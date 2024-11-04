const { PrismaClient } = require('@prisma/client'); // CommonJS require
const bcrypt = require('bcrypt'); // CommonJS require

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('superuserpassword123', 10);

  // Create the super user
  const superUser = await prisma.user.create({
    data: {
      username: 'superuser',
      password: hashedPassword,
      role: 'SUPER_USER',
    },
  });

  console.log('Super user created:', superUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
