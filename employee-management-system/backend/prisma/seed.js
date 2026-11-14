const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Departments
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { name: 'Engineering' },
      update: {},
      create: { name: 'Engineering', description: 'Software development and technical operations' },
    }),
    prisma.department.upsert({
      where: { name: 'Human Resources' },
      update: {},
      create: { name: 'Human Resources', description: 'HR and employee relations' },
    }),
    prisma.department.upsert({
      where: { name: 'Finance' },
      update: {},
      create: { name: 'Finance', description: 'Financial management and accounting' },
    }),
    prisma.department.upsert({
      where: { name: 'Marketing' },
      update: {},
      create: { name: 'Marketing', description: 'Marketing and brand management' },
    }),
    prisma.department.upsert({
      where: { name: 'Operations' },
      update: {},
      create: { name: 'Operations', description: 'Business operations and logistics' },
    }),
  ]);

  console.log(`✅ Created ${departments.length} departments`);

  // Create Admin User
  const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@company.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@company.com',
      password: adminPasswordHash,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Created admin user: ${admin.email}`);

  // Create sample employees
  const employeeData = [
    {
      email: 'john.doe@company.com',
      password: 'Employee@123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1-555-0101',
      designation: 'Senior Software Engineer',
      departmentName: 'Engineering',
      salary: 95000,
      status: 'ACTIVE',
    },
    {
      email: 'jane.smith@company.com',
      password: 'Employee@123',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1-555-0102',
      designation: 'HR Manager',
      departmentName: 'Human Resources',
      salary: 75000,
      status: 'ACTIVE',
    },
    {
      email: 'bob.wilson@company.com',
      password: 'Employee@123',
      firstName: 'Bob',
      lastName: 'Wilson',
      phone: '+1-555-0103',
      designation: 'Financial Analyst',
      departmentName: 'Finance',
      salary: 80000,
      status: 'ACTIVE',
    },
    {
      email: 'alice.johnson@company.com',
      password: 'Employee@123',
      firstName: 'Alice',
      lastName: 'Johnson',
      phone: '+1-555-0104',
      designation: 'Marketing Specialist',
      departmentName: 'Marketing',
      salary: 65000,
      status: 'ACTIVE',
    },
    {
      email: 'charlie.brown@company.com',
      password: 'Employee@123',
      firstName: 'Charlie',
      lastName: 'Brown',
      phone: '+1-555-0105',
      designation: 'Operations Coordinator',
      departmentName: 'Operations',
      salary: 60000,
      status: 'INACTIVE',
    },
  ];

  let empIndex = 1;
  for (const emp of employeeData) {
    const passwordHash = await bcrypt.hash(emp.password, 10);
    const dept = departments.find((d) => d.name === emp.departmentName);

    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        email: emp.email,
        password: passwordHash,
        role: 'EMPLOYEE',
      },
    });

    const employeeId = `EMP${String(empIndex).padStart(4, '0')}`;
    await prisma.employee.upsert({
      where: { employeeId },
      update: {},
      create: {
        employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phone,
        designation: emp.designation,
        joiningDate: new Date(`2023-0${empIndex}-15`),
        salary: emp.salary,
        status: emp.status,
        userId: user.id,
        departmentId: dept.id,
      },
    });

    // Add performance evaluations
    await prisma.performanceEvaluation.create({
      data: {
        evaluationDate: new Date('2024-01-15'),
        rating: empIndex % 2 === 0 ? 'EXCELLENT' : 'GOOD',
        score: 75 + empIndex * 4,
        comments: `${emp.firstName} demonstrates strong performance and team collaboration.`,
        goals: 'Complete Q1 objectives and improve technical skills.',
        achievements: 'Successfully delivered 3 major projects on time.',
        evaluatorName: 'Admin',
        employeeId: (
          await prisma.employee.findUnique({ where: { employeeId } })
        ).id,
      },
    });

    empIndex++;
  }

  console.log(`✅ Created ${employeeData.length} employees with evaluations`);
  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('  Admin: admin@company.com / Admin@123');
  console.log('  Employee: john.doe@company.com / Employee@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

