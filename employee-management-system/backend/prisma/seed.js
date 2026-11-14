const { prisma } = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('🌱 Seeding Outbox Mail database...');

  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      password: passwordHash,
      name: 'System Admin',
      role: 'ADMIN',
    },
  });

  console.log(`✅ Default user ready: ${user.email} (Password: Admin@123)`);

  // Create a sample scheduled email scheduled 10 minutes in the future
  const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.scheduledEmail.create({
    data: {
      userId: user.id,
      recipients: 'team@company.com, client1@partner.org, client2@partner.org',
      recipientCount: 3,
      subject: 'Quarterly Project Status & Roadmap Update',
      body: '<p>Hello Team,</p><p>Here is our automated project progress summary for the upcoming quarter.</p><p>Best regards,<br>Automated Outbox System</p>',
      scheduledAt: tenMinutesLater,
      status: 'SCHEDULED',
    },
  });

  // Create a past sent email sample
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  await prisma.scheduledEmail.create({
    data: {
      userId: user.id,
      recipients: 'welcome@subscriber.com',
      recipientCount: 1,
      subject: 'Welcome to our platform!',
      body: '<p>Thank you for subscribing to our automated email updates.</p>',
      scheduledAt: oneHourAgo,
      sentAt: oneHourAgo,
      status: 'SENT',
    },
  });

  console.log('✅ Seeded sample scheduled and sent emails!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
