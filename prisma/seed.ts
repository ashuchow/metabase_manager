const { PrismaClient } = require('@prisma/client'); // CommonJS require
const bcrypt = require('bcrypt'); // CommonJS require

const prisma = new PrismaClient();

async function main() {
  const superUserPassword = process.env.SUPER_USER_PASSWORD;

  if (!superUserPassword) {
    throw new Error('SUPER_USER_PASSWORD is not defined in the environment variables.');
  }

  const hashedPassword = await bcrypt.hash(superUserPassword, 10);

  // Create the super user
  const superUser = await prisma.user.upsert({
    where: { username: 'superuser' },
    update: {},
    create: {
      username: 'superuser',
      password: hashedPassword,
      role: 'SUPER_USER',
    },
  });

  console.log('Super user created or already exists:', superUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });