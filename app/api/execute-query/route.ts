// /app/api/execute-query/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { query, serverDatabaseSelections, userId } = await request.json();

    // Validate input data
    if (
      !query ||
      !serverDatabaseSelections ||
      !Array.isArray(serverDatabaseSelections) ||
      userId === undefined
    ) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const results = [];

    for (const selection of serverDatabaseSelections) {
      const { serverId, databaseId } = selection;

      // Fetch user-specific server credentials
      const userServer = await prisma.userMetabaseServer.findUnique({
        where: {
          userId_serverId: { userId, serverId },
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
          error: 'Server not found for this user',
        });
        continue;
      }

      const server = {
        hostUrl: userServer.server.hostUrl,
        email: userServer.email,
        password: userServer.password,
        isSource: userServer.isSource, // User-specific isSource
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

        // Execute the query without pagination
        const queryBody = {
          database: databaseId,
          type: 'native',
          native: {
            query: query,
          },
        };

        console.log(`Executing query on server ${server.hostUrl} with database ID ${databaseId}:`, queryBody);

        const queryResponse = await fetch(`${server.hostUrl}/api/dataset`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Metabase-Session': token,
          },
          body: JSON.stringify(queryBody),
        });

        if (!queryResponse.ok) {
          const errorData = await queryResponse.json();
          console.error(`Query execution error on server ${server.hostUrl}:`, errorData);
          throw new Error(errorData.message || errorData.error || 'Query execution failed');
        }

        const queryData = await queryResponse.json();

        if (!queryData.data || !queryData.data.rows || !queryData.data.cols) {
          throw new Error('Invalid response format from Metabase');
        }

        results.push({
          serverId: serverId,
          serverUrl: server.hostUrl,
          data: {
            cols: queryData.data.cols,
            rows: queryData.data.rows,
          },
        });
      } catch (error: any) {
        console.error(`Error querying server ${server.hostUrl}:`, error);
        results.push({
          serverId: serverId,
          serverUrl: server.hostUrl,
          data: null,
          error: error.message,
        });
      }
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error('Error executing queries:', error);
    return NextResponse.json(
      { error: 'Failed to execute queries' },
      { status: 500 }
    );
  }
}
