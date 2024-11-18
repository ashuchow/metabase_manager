
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Ensure this path is correct
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, role } = body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user in the database
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role || 'USER', // Default role to USER if not provided
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
