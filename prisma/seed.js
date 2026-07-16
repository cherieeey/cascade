const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const members = [
    { name: 'Member One', email: 'member1@example.com', role: 'Developer' },
    { name: 'Member Two', email: 'member2@example.com', role: 'Developer' },
    { name: 'Member Three', email: 'member3@example.com', role: 'Developer' },
  ];

  for (const member of members) {
    await prisma.member.upsert({
      where: { email: member.email },
      update: member,
      create: member,
    });
  }
}

main()
  .then(() => console.log('Seed completed'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
