import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET all renters
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const renters = await prisma.user.findMany({
      where: { role: "RENTER" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        apartment: {
          select: { id: true, name: true, floor: true, status: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(renters);
  } catch (error) {
    console.error("Fetch renters error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create renter
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone, password, apartmentId } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    // Check email duplicate
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const renter = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: "RENTER",
      },
    });

    // Assign to apartment if provided
    if (apartmentId) {
      await prisma.apartment.update({
        where: { id: apartmentId },
        data: { renterId: renter.id, status: "OCCUPIED" },
      });
    }

    return NextResponse.json({
      id: renter.id,
      name: renter.name,
      email: renter.email,
      phone: renter.phone,
    }, { status: 201 });
  } catch (error) {
    console.error("Create renter error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
