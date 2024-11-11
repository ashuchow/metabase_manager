import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Fetch all user servers
    const userServers = await prisma.userMetabaseServer.findMany({
      include: {
        server: true, // Include server details
      },
    });

    // Format the response data to include necessary fields
    const formattedServers = userServers.map((userServer) => ({
      id: userServer.server.id, // Include server ID
      hostUrl: userServer.server.hostUrl,
      email: userServer.email,
      password: userServer.password, // Include plain-text password (not recommended)
      isSource: userServer.server.isSource,
    }));

    return NextResponse.json(formattedServers, { status: 200 });
  } catch (error) {
    console.error("Error fetching user servers:", error);
    return NextResponse.json({ error: "Failed to fetch servers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { hostUrl, email, password, isSource } = await request.json();
    console.log("Received data:", { hostUrl, email, password, isSource });

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
        userId_serverId: { userId: 1, serverId: server.id }, // Assuming userId is 1 for now
      },
      update: {
        email,
        password, // Store password in plain text (not recommended)
      },
      create: {
        userId: 1, // Assuming userId is 1 for now
        serverId: server.id,
        email,
        password, // Store password in plain text (not recommended)
      },
    });

    console.log("User-specific server credentials saved successfully:", userServer);

    return NextResponse.json(userServer, { status: 201 });
  } catch (error) {
    console.error("Error saving Metabase server:", error);
    return NextResponse.json({ error: "Failed to save Metabase server" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = parseInt(searchParams.get('serverId'));
    const userId = 1; // Replace with actual user ID from authentication

    if (!serverId) {
      return NextResponse.json({ error: "Server ID is required" }, { status: 400 });
    }

    // Delete the user-specific server entry
    await prisma.userMetabaseServer.delete({
      where: {
        userId_serverId: { userId, serverId },
      },
    });

    // Optionally, delete the server if no other users are using it
    const otherUsers = await prisma.userMetabaseServer.count({
      where: {
        serverId,
      },
    });

    if (otherUsers === 0) {
      await prisma.metabaseServer.delete({
        where: {
          id: serverId,
        },
      });
    }

    return NextResponse.json({ message: "Server deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting Metabase server:", error);
    return NextResponse.json({ error: "Failed to delete Metabase server" }, { status: 500 });
  }
}
