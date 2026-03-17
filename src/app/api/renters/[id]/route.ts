import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET single renter
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const renter = await prisma.user.findUnique({
      where: { id, role: "RENTER" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        apartment: true,
        bills: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
          take: 12,
          include: { apartment: { select: { name: true } } },
        },
      },
    });

    if (!renter) {
      return NextResponse.json({ error: "Renter not found" }, { status: 404 });
    }

    return NextResponse.json(renter);
  } catch (error) {
    console.error("Fetch renter error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH update renter
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, email, phone, password } = body;

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (email) {
      const existing = await prisma.user.findFirst({ where: { email, id: { not: id } } });
      if (existing) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }
      updateData.email = email;
    }
    if (phone !== undefined) updateData.phone = phone;
    if (password) updateData.password = await bcrypt.hash(password, 12);

    const renter = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, phone: true },
    });

    return NextResponse.json(renter);
  } catch (error) {
    console.error("Update renter error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE renter
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Unassign from apartment
    await prisma.apartment.updateMany({
      where: { renterId: id },
      data: { renterId: null, status: "VACANT" },
    });

    // Delete related bills
    await prisma.bill.deleteMany({ where: { renterId: id } });

    // Delete user
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete renter error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
