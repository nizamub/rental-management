import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET bills with filters
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const renterId = searchParams.get("renterId");
    const apartmentId = searchParams.get("apartmentId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    
    if (session.user.role === "RENTER") {
      where.renterId = session.user.id;
    } else {
      if (renterId) where.renterId = renterId;
    }
    
    if (apartmentId) where.apartmentId = apartmentId;
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (status) where.status = status;

    const bills = await prisma.bill.findMany({
      where,
      include: {
        apartment: { select: { name: true, floor: true } },
        renter: { select: { name: true, email: true, phone: true } },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(bills);
  } catch (error) {
    console.error("Fetch bills error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST generate bill
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      apartmentId,
      renterId,
      month,
      year,
      baseRent,
      electricBill,
      gasBill = 0,
      waterBill = 0,
      otherCharges = [],
    } = body;

    if (!apartmentId || !renterId || !month || !year || baseRent === undefined || electricBill === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check for duplicate bill
    const existing = await prisma.bill.findFirst({
      where: { apartmentId, month, year },
    });
    if (existing) {
      return NextResponse.json({ error: "Bill already exists for this month" }, { status: 400 });
    }

    const otherTotal = Array.isArray(otherCharges)
      ? otherCharges.reduce((sum: number, c: { amount: number }) => sum + (c.amount || 0), 0)
      : 0;

    const totalAmount = baseRent + electricBill + gasBill + waterBill + otherTotal;

    const bill = await prisma.bill.create({
      data: {
        month,
        year,
        baseRent,
        electricBill,
        gasBill,
        waterBill,
        otherCharges: otherCharges.length > 0 ? otherCharges : undefined,
        totalAmount,
        apartmentId,
        renterId,
      },
      include: {
        apartment: { select: { name: true } },
        renter: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    console.error("Create bill error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
