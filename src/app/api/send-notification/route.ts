import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendBillEmail } from "@/lib/email";
import { sendBillSms } from "@/lib/sms";
import { getMonthName } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { billId, sendEmail = true, sendSms = false } = body;

    if (!billId) {
      return NextResponse.json({ error: "Bill ID is required" }, { status: 400 });
    }

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        apartment: true,
        renter: true,
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const results: { email?: { success: boolean; error?: string }; sms?: { success: boolean; error?: string } } = {};

    const otherChargesAmount = Array.isArray(bill.otherCharges)
      ? (bill.otherCharges as { amount: number }[]).reduce((sum, c) => sum + c.amount, 0)
      : 0;

    if (sendEmail && bill.renter.email) {
      results.email = await sendBillEmail({
        renterName: bill.renter.name,
        renterEmail: bill.renter.email,
        apartmentName: bill.apartment.name,
        month: getMonthName(bill.month),
        year: bill.year,
        baseRent: bill.baseRent,
        electricBill: bill.electricBill,
        gasBill: bill.gasBill,
        waterBill: bill.waterBill,
        otherCharges: otherChargesAmount,
        totalAmount: bill.totalAmount,
      });
    }

    if (sendSms && bill.renter.phone) {
      results.sms = await sendBillSms({
        renterName: bill.renter.name,
        renterPhone: bill.renter.phone,
        apartmentName: bill.apartment.name,
        month: getMonthName(bill.month),
        year: bill.year,
        totalAmount: bill.totalAmount,
      });
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Send notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
