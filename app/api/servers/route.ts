// /app/api/servers/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const userIdParam = searchParams.get('userId');

//     console.log("Received GET request with userId:", userIdParam);

//     // Validate userId
//     if (!userIdParam) {
//       console.log("User ID is missing.");
//       return NextResponse.json(
//         { error: 'User ID is required' },
//         { status: 400 }
//       );
//     }

//     const userId = parseInt(userIdParam, 10);
//     if (isNaN(userId)) {
//       console.log("Invalid User ID:", userIdParam);
//       return NextResponse.json(
//         { error: 'Invalid User ID' },
//         { status: 400 }
//       );
//     }

//     // Fetch all servers associated with the user
//     const userServers = await prisma.userMetabaseServer.findMany({
//       where: {
//         userId: userId,
//       },
//       include: {
//         server: true, // Include server details
//       },
//     });

//     console.log("Fetched userServers:", userServers);

//     // Format the response data to include necessary fields
//     const formattedServers = userServers.map((userServer) => ({
//       id: userServer.server.id, // Server ID
//       hostUrl: userServer.server.hostUrl,
//       isSource: userServer.isSource, // User-specific isSource
//       email: userServer.email,
//       password: userServer.password
//       // Exclude email and password for security
//     }));

//     console.log("Formatted Servers:", formattedServers);

//     return NextResponse.json(formattedServers, { status: 200 });
//   } catch (error: any) {
//     console.error("Error in GET /api/servers:", error);
//     return NextResponse.json({ error: "Failed to fetch servers" }, { status: 500 });
//   }
// }

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');

    console.log("Received GET request with userId:", userIdParam);

    // Validate userId
    if (!userIdParam) {
      console.log("User ID is missing.");
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userId = parseInt(userIdParam, 10);
    if (isNaN(userId)) {
      console.log("Invalid User ID:", userIdParam);
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

    console.log("Fetched userServers:", userServers);

    // Include email and password now
    const formattedServers = userServers.map((userServer) => ({
      id: userServer.server.id, // Server ID
      hostUrl: userServer.server.hostUrl,
      isSource: userServer.isSource, // User-specific isSource
      email: userServer.email,
      password: userServer.password
    }));

    console.log("Formatted Servers:", formattedServers);

    return NextResponse.json(formattedServers, { status: 200 });
  } catch (error: any) {
    console.error("Error in GET /api/servers:", error);
    return NextResponse.json({ error: "Failed to fetch servers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { hostUrl, email, password, isSource, userId } = await request.json();

    console.log("Received POST request with data:", { hostUrl, email, isSource, userId });

    // Validate input data
    if (!hostUrl || !email || !password || isSource === undefined || userId === undefined) {
      console.log("Missing required fields in POST request.");
      return NextResponse.json(
        { error: 'hostUrl, email, password, isSource, and userId are required' },
        { status: 400 }
      );
    }

    // Upsert the MetabaseServer (only one entry per unique hostUrl)
    const server = await prisma.metabaseServer.upsert({
      where: { hostUrl },
      update: { /* No global fields to update */ },
      create: { hostUrl },
    });

    console.log("Server upserted successfully:", server);

    // Upsert the UserMetabaseServer with user-specific email, password, and isSource
    const userServer = await prisma.userMetabaseServer.upsert({
      where: {
        userId_serverId: { userId: userId, serverId: server.id },
      },
      update: {
        email,
        password, // Note: Storing plain-text passwords is not recommended
        isSource,
      },
      create: {
        userId: userId,
        serverId: server.id,
        email,
        password, // Note: Storing plain-text passwords is not recommended
        isSource,
      },
    });

    console.log("User-specific server credentials saved successfully:", userServer);

    return NextResponse.json(userServer, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/servers:", error);
    return NextResponse.json({ error: "Failed to save Metabase server" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serverIdParam = searchParams.get('serverId');
    const userIdParam = searchParams.get('userId');

    console.log("Received DELETE request with serverId:", serverIdParam, "and userId:", userIdParam);

    // Validate serverId and userId
    if (!serverIdParam || !userIdParam) {
      console.log("Missing serverId or userId in DELETE request.");
      return NextResponse.json(
        { error: "Both serverId and userId are required" },
        { status: 400 }
      );
    }

    const serverId = parseInt(serverIdParam, 10);
    const userId = parseInt(userIdParam, 10);

    if (isNaN(serverId) || isNaN(userId)) {
      console.log("Invalid serverId or userId:", serverIdParam, userIdParam);
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
    console.error("Error in DELETE /api/servers:", error);
    return NextResponse.json({ error: "Failed to delete Metabase server" }, { status: 500 });
  }
}
