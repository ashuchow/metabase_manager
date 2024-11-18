// /app/api/get-databases/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = parseInt(searchParams.get('serverId') || '');

    if (!serverId) {
      return NextResponse.json({ error: 'Server ID is required' }, { status: 400 });
    }

    // Fetch server credentials
    const userServer = await prisma.userMetabaseServer.findUnique({
      where: {
        userId_serverId: { userId: 1, serverId }, // Replace with actual user ID if necessary
      },
      include: {
        server: true,
      },
    });

    if (!userServer) {
      console.error(`No userServer found for userId: 1, serverId: ${serverId}`);
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    const server = {
      id: userServer.server.id,
      hostUrl: userServer.server.hostUrl,
      email: userServer.email,
      password: userServer.password,
    };

    console.log(`Attempting to authenticate with server ${server.hostUrl}`);

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

    const authResponseText = await authResponse.text();

    if (!authResponse.ok) {
      console.error(`Authentication failed for server ${server.hostUrl}:`, authResponseText);
      throw new Error(`Authentication failed: ${authResponseText}`);
    }

    const authData = JSON.parse(authResponseText);
    const token = authData.id;

    console.log(`Authenticated with server ${server.hostUrl}, token: ${token}`);

    // Fetch databases
    const databasesResponse = await fetch(`${server.hostUrl}/api/database`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Metabase-Session': token,
      },
    });

    const databasesResponseText = await databasesResponse.text();

    if (!databasesResponse.ok) {
      console.error(`Failed to fetch databases from server ${server.hostUrl}:`, databasesResponseText);
      throw new Error(`Failed to fetch databases: ${databasesResponseText}`);
    }

    const databasesData = JSON.parse(databasesResponseText);

    console.log(`Databases fetched from server ${server.hostUrl}:`, databasesData.data);

    return NextResponse.json(databasesData.data, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching databases:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch databases' },
      { status: 500 }
    );
  }
}
