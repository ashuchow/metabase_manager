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