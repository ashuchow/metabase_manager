import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';


export async function GET(request: Request) {
  try {
    // Parse the userId from the URL search params
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      console.error("User ID is missing.");
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Fetch servers associated with the user and include user-specific credentials
    const userServers = await prisma.userMetabaseServer.findMany({
      where: { userId: parseInt(userId) },
      include: {
        server: true, // Include server details
      },
    });

    // Format the response data to include only necessary fields
    const formattedServers = userServers.map((userServer) => ({
      hostUrl: userServer.server.hostUrl,
      email: userServer.email,
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
    const { hostUrl, email, password, isSource, userId } = await request.json();
    console.log("Received data:", { hostUrl, email, password, isSource, userId });

    if (!userId) {
      console.error("User ID is missing or unauthorized.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hashed successfully");

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
        userId_serverId: { userId, serverId: server.id }, // Unique constraint for user-server pair
      },
      update: {
        email,
        password: hashedPassword,
      },
      create: {
        userId,
        serverId: server.id,
        email,
        password: hashedPassword,
      },
    });

    console.log("User-specific server credentials saved successfully:", userServer);

    return NextResponse.json(userServer, { status: 201 });
  } catch (error) {
    console.error("Error saving Metabase server:", error);
    return NextResponse.json({ error: "Failed to save Metabase server" }, { status: 500 });
  }
}
