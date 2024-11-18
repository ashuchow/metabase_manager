// /app/api/execute-query/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Server {
  id: number;
  hostUrl: string;
  email: string;
  password: string;
  isSource: boolean;
}

export async function POST(request: Request) {
  try {
    const { query, serverIds } = await request.json();

    if (!query || !serverIds || !Array.isArray(serverIds)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Fetch servers and credentials from the database
    const servers = await prisma.userMetabaseServer.findMany({
      where: {
        serverId: { in: serverIds },
      },
      include: {
        server: true,
      },
    });

    const results = [];

    for (const userServer of servers) {
      const server: Server = {
        id: userServer.server.id,
        hostUrl: userServer.server.hostUrl,
        email: userServer.email,
        password: userServer.password,
        isSource: userServer.server.isSource,
      };

      try {
        // Authenticate with Metabase API
        const authResponse = await fetch(
          `${server.hostUrl}/api/session`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: server.email,
              password: server.password,
            }),
          }
        );

        if (!authResponse.ok) {
          throw new Error('Authentication failed');
        }

        const authData = await authResponse.json();
        const token = authData.id;

        // Execute SQL query
        const queryResponse = await fetch(
          `${server.hostUrl}/api/dataset/sql`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Metabase-Session': token,
            },
            body: JSON.stringify({
              database: 1, // Replace with your database ID
              type: 'native',
              native: {
                query: query,
              },
            }),
          }
        );

        if (!queryResponse.ok) {
          const errorData = await queryResponse.json();
          throw new Error(errorData.message || 'Query execution failed');
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
