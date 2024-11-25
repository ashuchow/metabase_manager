// /app/api/servers/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');

    // Validate userId
    if (!userIdParam) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userId = parseInt(userIdParam, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid User ID' },
        { status: 400 }
      );
    }

    // Fetch all servers associated with the user
    const userServers = await prisma.userMetabaseServer.findMany({
      where: {
        userId: userId,
      },
      include: {
        server: true, // Include server details
      },
    });

    // Format the response data to include necessary fields
    const formattedServers = userServers.map((userServer) => ({
      id: userServer.server.id, // Include server ID
      hostUrl: userServer.server.hostUrl,
      email: userServer.email,
      // **Security Warning:** Including plain-text passwords is not recommended.
      // Consider encrypting passwords or handling them securely.
      // password: userServer.password,
      isSource: userServer.server.isSource,
    }));

    return NextResponse.json(formattedServers, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching user servers:", error);
    return NextResponse.json({ error: "Failed to fetch servers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { hostUrl, email, password, isSource, userId } = await request.json();

    // Validate input data
    if (!hostUrl || !email || !password || userId === undefined) {
      return NextResponse.json(
        { error: 'hostUrl, email, password, and userId are required' },
        { status: 400 }
      );
    }

    // **Security Recommendation:** 
    // - **Do not store passwords in plain text.**
    // - Use hashing algorithms like bcrypt to hash passwords before storing.
    // - If you need to decrypt them later, consider using encryption instead of hashing.

    // Upsert the MetabaseServer (only one entry per unique hostUrl)
    const server = await prisma.metabaseServer.upsert({
      where: { hostUrl },
      update: { isSource }, // Update only if hostUrl already exists
      create: { hostUrl, isSource },
    });

    console.log("Server upserted successfully:", server);

    // Upsert the UserMetabaseServer with user-specific email and password
    const userServer = await prisma.userMetabaseServer.upsert({
      where: {
        userId_serverId: { userId: userId, serverId: server.id },
      },
      update: {
        email,
        password, // **Security Warning:** Store passwords securely
      },
      create: {
        userId: userId,
        serverId: server.id,
        email,
        password, // **Security Warning:** Store passwords securely
      },
    });

    console.log("User-specific server credentials saved successfully:", userServer);

    return NextResponse.json(userServer, { status: 201 });
  } catch (error: any) {
    console.error("Error saving Metabase server:", error);
    return NextResponse.json({ error: "Failed to save Metabase server" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serverIdParam = searchParams.get('serverId');
    const userIdParam = searchParams.get('userId');

    // Validate serverId and userId
    if (!serverIdParam || !userIdParam) {
      return NextResponse.json(
        { error: "Both serverId and userId are required" },
        { status: 400 }
      );
    }

    const serverId = parseInt(serverIdParam, 10);
    const userId = parseInt(userIdParam, 10);

    if (isNaN(serverId) || isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid serverId or userId" },
        { status: 400 }
      );
    }

    // Delete the user-specific server entry
    await prisma.userMetabaseServer.delete({
      where: {
        userId_serverId: { userId, serverId },
      },
    });

    console.log(`User ${userId} deleted server ${serverId} association`);

    // Optionally, delete the server if no other users are using it
    const otherUsers = await prisma.userMetabaseServer.count({
      where: {
        serverId: serverId,
      },
    });

    if (otherUsers === 0) {
      await prisma.metabaseServer.delete({
        where: {
          id: serverId,
        },
      });
      console.log(`Server ${serverId} deleted as no other users are using it`);
    }

    return NextResponse.json({ message: "Server deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting Metabase server:", error);
    return NextResponse.json({ error: "Failed to delete Metabase server" }, { status: 500 });
  }
}
