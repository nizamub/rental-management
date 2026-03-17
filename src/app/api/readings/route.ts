import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST save meter reading
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { apartmentId, month, year, prevUnit, currUnit, costPerUnit } = body;

    if (!apartmentId || !month || !year || prevUnit === undefined || currUnit === undefined || !costPerUnit) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (currUnit < prevUnit) {
      return NextResponse.json({ error: "Current reading must be ≥ previous reading" }, { status: 400 });
    }

    // Upsert - update if reading for this month already exists
    const existing = await prisma.meterReading.findFirst({
      where: { apartmentId, month, year },
    });

    let reading;
    if (existing) {
      reading = await prisma.meterReading.update({
        where: { id: existing.id },
        data: { prevUnit, currUnit, costPerUnit },
      });
    } else {
      reading = await prisma.meterReading.create({
        data: { apartmentId, month, year, prevUnit, currUnit, costPerUnit },
      });
    }

    return NextResponse.json({
      ...reading,
      netUnits: currUnit - prevUnit,
      electricBill: (currUnit - prevUnit) * costPerUnit,
    }, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error("Save reading error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET readings
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const apartmentId = searchParams.get("apartmentId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const where: Record<string, unknown> = {};
    if (apartmentId) where.apartmentId = apartmentId;
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);

    const readings = await prisma.meterReading.findMany({
      where,
      include: {
        apartment: { select: { name: true } },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json(readings);
  } catch (error) {
    console.error("Fetch readings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
