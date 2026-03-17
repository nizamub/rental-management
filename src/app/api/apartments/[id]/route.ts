import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET single apartment
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const apartment = await prisma.apartment.findUnique({
      where: { id },
      include: {
        renter: { select: { id: true, name: true, email: true, phone: true } },
        bills: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
          take: 12,
          include: { renter: { select: { name: true } } },
        },
        readings: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
          take: 12,
        },
      },
    });

    if (!apartment) {
      return NextResponse.json({ error: "Apartment not found" }, { status: 404 });
    }

    return NextResponse.json(apartment);
  } catch (error) {
    console.error("Fetch apartment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH update apartment
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, floor, size, renterId } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (floor !== undefined) updateData.floor = floor;
    if (size !== undefined) updateData.size = size;
    
    if (renterId !== undefined) {
      if (renterId === null) {
        updateData.renterId = null;
        updateData.status = "VACANT";
      } else {
        // Check if renter already assigned elsewhere
        const existingApt = await prisma.apartment.findFirst({
          where: { renterId, id: { not: id } },
        });
        if (existingApt) {
          return NextResponse.json({ error: "Renter is already assigned to another apartment" }, { status: 400 });
        }
        updateData.renterId = renterId;
        updateData.status = "OCCUPIED";
      }
    }

    const apartment = await prisma.apartment.update({
      where: { id },
      data: updateData,
      include: {
        renter: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    return NextResponse.json(apartment);
  } catch (error) {
    console.error("Update apartment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE apartment
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    // Check for existing bills
    const billCount = await prisma.bill.count({ where: { apartmentId: id } });
    if (billCount > 0) {
      return NextResponse.json({ error: "Cannot delete apartment with existing bills" }, { status: 400 });
    }

    await prisma.meterReading.deleteMany({ where: { apartmentId: id } });
    await prisma.apartment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete apartment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
