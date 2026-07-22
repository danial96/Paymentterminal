import { createRequire } from 'module';
import { readFileSync } from 'fs';

// Load production env
const envFile = readFileSync('.env.production.local', 'utf8');
for (const line of envFile.split('\n')) {
  const m = line.match(/^([^#=]+)="?(.+?)"?\s*$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const require = createRequire(import.meta.url);
const { PrismaClient } = require('./lib/generated/prisma/client.ts');
const prisma = new PrismaClient();

const emps = await prisma.hRMEmployee.findMany({
  where: { employeeId: { in: ['IKIA1022','IKIA1020','IKIA1021','IKIA1028','IKIA1025'] } },
  select: { employeeId: true, firstName: true, lastName: true, shift: { select: { name: true, startTime: true } } }
});

console.log(`${'EmpID'.padEnd(12)} ${'Name'.padEnd(28)} ${'Shift'.padEnd(15)} ${'StartTime'}`);
console.log('-'.repeat(65));
for (const e of emps) {
  const name = `${e.firstName} ${e.lastName}`;
  console.log(`${e.employeeId.padEnd(12)} ${name.padEnd(28)} ${(e.shift?.name ?? 'None').padEnd(15)} ${e.shift?.startTime ?? '—'}`);
}

await prisma.$disconnect();
