// /app/api/execute-query/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { query, serverDatabaseSelections } = await request.json();

    if (!query || !serverDatabaseSelections || !Array.isArray(serverDatabaseSelections)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const results = [];

    for (const selection of serverDatabaseSelections) {
      const { serverId, databaseId } = selection;

      // Fetch server credentials
      const userServer = await prisma.userMetabaseServer.findUnique({
        where: {
          userId_serverId: { userId: 1, serverId }, // Replace with actual user ID
        },
        include: {
          server: true,
        },
      });

      if (!userServer) {
        results.push({
          serverId,
          serverUrl: '',
          data: null,
          error: 'Server not found',
        });
        continue;
      }

      const server = {
        id: userServer.server.id,
        hostUrl: userServer.server.hostUrl,
        email: userServer.email,
        password: userServer.password,
      };

      try {
        // Authenticate with Metabase API
        const authResponse = await fetch(`${server.hostUrl}/api/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: server.email,
            password: server.password,
          }),
        });

        if (!authResponse.ok) {
          const errorData = await authResponse.json();
          console.error(`Authentication error on server ${server.hostUrl}:`, errorData);
          throw new Error(errorData.message || 'Authentication failed');
        }

        const authData = await authResponse.json();
        const token = authData.id;

        console.log(`Authenticated with server ${server.hostUrl}, token: ${token}`);

        // Optionally, check Metabase version
        const propertiesResponse = await fetch(`${server.hostUrl}/api/session/properties`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Metabase-Session': token,
          },
        });

        if (propertiesResponse.ok) {
          const propertiesData = await propertiesResponse.json();
          console.log(`Metabase version: ${propertiesData['metabase-version']}`);
        } else {
          console.warn(`Failed to get Metabase version from server ${server.hostUrl}`);
        }

        // Execute SQL query using the selected database ID
        const queryBody = {
          database: databaseId,
          type: 'native',
          native: {
            query: query,
          },
        };

        console.log(`Executing query on server ${server.hostUrl} with database ID ${databaseId}:`, queryBody);

        // Use /api/dataset instead of /api/dataset/sql
        const queryResponse = await fetch(
          `${server.hostUrl}/api/dataset`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Metabase-Session': token,
            },
            body: JSON.stringify(queryBody),
          }
        );

        if (!queryResponse.ok) {
          const errorData = await queryResponse.json();
          console.error(`Query execution error on server ${server.hostUrl}:`, errorData);
          throw new Error(errorData.message || errorData.error || 'Query execution failed');
        }

        const queryData = await queryResponse.json();

        results.push({
          serverId: server.id,
          serverUrl: server.hostUrl,
          data: queryData,
        });
      } catch (error: any) {
        console.error(`Error querying server ${server.hostUrl}:`, error);
        results.push({
          serverId: server.id,
          serverUrl: server.hostUrl,
          data: null,
          error: error.message,
        });
      }
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('Error executing queries:', error);
    return NextResponse.json(
      { error: 'Failed to execute queries' },
      { status: 500 }
    );
  }
}
