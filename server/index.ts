// This file isn't processed by Vite, see https://github.com/brillout/vite-plugin-ssr/issues/562
//  - Consequently, the server needs be manually restarted when changing this file
import * as Sentry from "@sentry/node";
import express from "express";
import compression from "compression";
import { renderPage } from "vite-plugin-ssr/server";
import { root } from "./root.js";
import { telefunc, config } from "telefunc";
import "dotenv/config";
const isProduction = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.4,
});

config.disableNamingConvention = true;
startServer();

async function startServer() {
  const app = express();

  app.use(compression());

  // Vite integration
  if (isProduction) {
    // In production, we need to serve our static assets ourselves.
    // (In dev, Vite's middleware serves our static assets.)
    const sirv = (await import("sirv")).default;
    app.use(sirv(`${root}/dist/client`));
  } else {
    // We instantiate Vite's development server and integrate its middleware to our server.
    // ⚠️ We instantiate it only in development. (It isn't needed in production and it
    // would unnecessarily bloat our server in production.)
    const vite = await import("vite");
    const viteDevMiddleware = (
      await vite.createServer({
        root,
        server: { middlewareMode: true },
      })
    ).middlewares;
    app.use(viteDevMiddleware);
  }

  app.use(express.text()); // Parse & make HTTP request body available at `req.body`
  app.all("/_telefunc", async (req, res) => {
    const context = {};
    const httpResponse = await telefunc({ url: req.originalUrl, method: req.method, body: req.body, context });
    try {
      if (JSON.parse(httpResponse.body)?.["ret"]?.["errors"]) {
        Sentry.captureEvent({
          timestamp: new Date().getTime() / 1000,
          platform: "node",
          level: "error",
          request: {
            url: req.originalUrl,
            method: req.method,
            data: req.body,
          },
          message: JSON.stringify(JSON.parse(httpResponse.body)?.["ret"]?.["errors"]),
          extra: httpResponse,
        });
      }
    } catch (e) {
      console.error("Error sending to sentry", e);
      Sentry.captureEvent({
        timestamp: new Date().getTime() / 1000,
        platform: "node",
        level: "error",
        request: {
          url: req.originalUrl,
          method: req.method,
          data: req.body,
        },
        message: httpResponse.body.toString(),
        extra: httpResponse,
      });
    }
    const { body, statusCode, contentType } = httpResponse;
    res.status(statusCode).type(contentType).send(body);
  });

  // Vite-plugin-ssr middleware. It should always be our last middleware (because it's a
  // catch-all middleware superseding any middleware placed after it).
  app.get("*", async (req, res, next) => {
    const pageContextInit = {
      urlOriginal: req.originalUrl,
    };
    const pageContext = await renderPage(pageContextInit);
    if (pageContext.errorWhileRendering) {
      Sentry.captureException(pageContext.errorWhileRendering);
    }
    const { httpResponse } = pageContext;
    if (!httpResponse) return next();
    const { body, statusCode, contentType, earlyHints } = httpResponse;
    if (res.writeEarlyHints) res.writeEarlyHints({ link: earlyHints.map((e) => e.earlyHintLink) });
    res.status(statusCode).type(contentType).send(body);
  });

  const port = process.env.PORT || 3000;
  app.listen(port);
  console.log(`Server running at http://localhost:${port}`);
}
