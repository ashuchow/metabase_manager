
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; 
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Find the user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Return user details with id, username, and role
    return NextResponse.json({
      message: 'Sign-in successful',
      user: {
        id: user.id,       // Include id here
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Sign-in error:', error);
    return NextResponse.json(
      { error: 'An error occurred during sign-in' },
      { status: 500 }
    );
  }
}
