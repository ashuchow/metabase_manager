// import { NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma'; // Assuming prisma client is configured here
// import bcrypt from 'bcrypt';
// // import { getAuthUser } from '@/utils/auth'; // A utility to get the authenticated user

// export async function POST(request: Request) {
//   const body = await request.json();
//   const { username, password, role } = body;

// //   const authUser = await getAuthUser(request); // Utility function to get the authenticated user

// //   if (!authUser || authUser.role !== 'SUPER_USER') {
// //     return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
// //   }


//   // const authUser = await getAuthUser(request); // Utility function to get the authenticated user

//   // if (!authUser ) {
//   //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
//   // }

//   // Hash the password
//   const hashedPassword = await bcrypt.hash(password, 10);

//   // Create a new user in the database
//   const newUser = await prisma.user.create({
//     data: {
//       username,
//       password: hashedPassword,
//       role: role || 'USER', // Default role to USER if not provided
//     },
//   });

//   return NextResponse.json(newUser, { status: 201 });
// }

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
