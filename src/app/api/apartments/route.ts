import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET all apartments
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apartments = await prisma.apartment.findMany({
      include: {
        renter: {
          select: { id: true, name: true, email: true, phone: true },
        },
        _count: { select: { bills: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(apartments);
  } catch (error) {
    console.error("Fetch apartments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create apartment
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, floor, size } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const apartment = await prisma.apartment.create({
      data: { name, floor, size },
    });

    return NextResponse.json(apartment, { status: 201 });
  } catch (error) {
    console.error("Create apartment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
