const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mode = process.argv[2] || 'sqlite';
const backendDir = __dirname;
const prismaDir = path.join(backendDir, 'prisma');
const schemaTarget = path.join(prismaDir, 'schema.prisma');
const envFile = path.join(backendDir, '.env');

console.log(`\n🔄 Switching database mode to: ${mode.toUpperCase()}...`);

if (mode === 'sqlite') {
  fs.copyFileSync(path.join(prismaDir, 'schema.sqlite.prisma'), schemaTarget);
  let env = fs.readFileSync(envFile, 'utf8');
  env = env.replace(/DATABASE_URL=.*/, 'DATABASE_URL="file:./dev.db"');
  fs.writeFileSync(envFile, env);
  console.log('✅ Updated prisma/schema.prisma and .env to SQLite (file:./dev.db)');
} else {
  fs.copyFileSync(path.join(prismaDir, 'schema.postgresql.prisma'), schemaTarget);
  let env = fs.readFileSync(envFile, 'utf8');
  env = env.replace(/DATABASE_URL=.*/, 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/employee_management_db?schema=public"');
  fs.writeFileSync(envFile, env);
  console.log('✅ Updated prisma/schema.prisma and .env to PostgreSQL (localhost:5432)');
}

console.log('⚡ Generating Prisma Client...');
execSync('npx prisma generate', { stdio: 'inherit', cwd: backendDir });

console.log('📦 Pushing database schema...');
execSync('npx prisma db push', { stdio: 'inherit', cwd: backendDir });

console.log('🌱 Seeding database...');
execSync('node prisma/seed.js', { stdio: 'inherit', cwd: backendDir });

console.log(`\n🎉 Success! Database is now running on ${mode.toUpperCase()} and seeded with sample data.\n`);

