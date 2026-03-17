import "dotenv/config"; // This forces the script to read your .env file
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// Set up the Prisma 7 adapter just like we did for the main app
const pool = new Pool({ 
  connectionString: process.env.POSTGRES_PRISMA_URL 
});

// Using "as any" to bypass that same TypeScript mismatch we fixed earlier
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create owner account
  const hashedPassword = await bcrypt.hash("owner123", 12);
  
  const owner = await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: {},
    create: {
      name: "Building Owner",
      email: "owner@example.com",
      password: hashedPassword,
      phone: "+8801700000000",
      role: "OWNER",
    },
  });
  console.log("Owner created:", owner.email);

  // Create default settings
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      costPerUnit: 8.0,
      ownerName: "Building Owner",
      ownerPhone: "+8801700000000",
      ownerEmail: "owner@example.com",
      buildingName: "Monowara Amin Mansion",
      buildingAddress: "Dhaka, Bangladesh",
    },
  });
  console.log("Default settings created");

  // Create sample apartments
  const apartments = await Promise.all([
    prisma.apartment.upsert({
      where: { id: "apt-1a" },
      update: {},
      create: {
        id: "apt-1a",
        name: "Apt 1A",
        floor: "1st Floor",
        size: "850 sq ft",
        status: "VACANT",
      },
    }),
    prisma.apartment.upsert({
      where: { id: "apt-2a" },
      update: {},
      create: {
        id: "apt-2a",
        name: "Apt 2A",
        floor: "2nd Floor",
        size: "920 sq ft",
        status: "VACANT",
      },
    }),
    prisma.apartment.upsert({
      where: { id: "apt-2b" },
      update: {},
      create: {
        id: "apt-2b",
        name: "Apt 2B",
        floor: "2nd Floor",
        size: "780 sq ft",
        status: "VACANT",
      },
    }),
    prisma.apartment.upsert({
      where: { id: "apt-3a" },
      update: {},
      create: {
        id: "apt-3a",
        name: "Apt 3A",
        floor: "3rd Floor",
        size: "1050 sq ft",
        status: "VACANT",
      },
    }),
  ]);
  console.log(`${apartments.length} sample apartments created`);

  // Create sample renter
  const renterPassword = await bcrypt.hash("renter123", 12);
  const renter = await prisma.user.upsert({
    where: { email: "renter@example.com" },
    update: {},
    create: {
      name: "Sample Renter",
      email: "renter@example.com",
      password: renterPassword,
      phone: "+8801800000000",
      role: "RENTER",
    },
  });
  console.log("Sample renter created:", renter.email);

  // Assign renter to apartment 1A
  await prisma.apartment.update({
    where: { id: "apt-1a" },
    data: {
      renterId: renter.id,
      status: "OCCUPIED",
    },
  });
  console.log("Renter assigned to Apt 1A");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });