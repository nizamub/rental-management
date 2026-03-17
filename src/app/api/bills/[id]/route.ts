import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET single bill
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        apartment: true,
        renter: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Renters can only view their own bills
    if (session.user.role === "RENTER" && bill.renterId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(bill);
  } catch (error) {
    console.error("Fetch bill error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH update bill status
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, baseRent, electricBill, gasBill, waterBill, otherCharges } = body;

    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;
      if (status === "PAID") {
        updateData.paidAt = new Date();
      }
    }

    // Allow editing bill amounts before sending
    if (baseRent !== undefined) updateData.baseRent = baseRent;
    if (electricBill !== undefined) updateData.electricBill = electricBill;
    if (gasBill !== undefined) updateData.gasBill = gasBill;
    if (waterBill !== undefined) updateData.waterBill = waterBill;
    if (otherCharges !== undefined) updateData.otherCharges = otherCharges;

    // Recalculate total if amounts changed
    if (baseRent !== undefined || electricBill !== undefined || gasBill !== undefined || waterBill !== undefined) {
      const currentBill = await prisma.bill.findUnique({ where: { id } });
      if (currentBill) {
        const newBaseRent = baseRent ?? currentBill.baseRent;
        const newElectric = electricBill ?? currentBill.electricBill;
        const newGas = gasBill ?? currentBill.gasBill;
        const newWater = waterBill ?? currentBill.waterBill;
        const charges = otherCharges ?? (currentBill.otherCharges as { amount: number }[] | null);
        const otherTotal = Array.isArray(charges)
          ? charges.reduce((sum: number, c: { amount: number }) => sum + c.amount, 0)
          : 0;
        updateData.totalAmount = newBaseRent + newElectric + newGas + newWater + otherTotal;
      }
    }

    const bill = await prisma.bill.update({
      where: { id },
      data: updateData,
      include: {
        apartment: { select: { name: true } },
        renter: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(bill);
  } catch (error) {
    console.error("Update bill error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
