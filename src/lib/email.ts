import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface BillEmailData {
  renterName: string;
  renterEmail: string;
  apartmentName: string;
  month: string;
  year: number;
  baseRent: number;
  electricBill: number;
  netUnits?: number;
  costPerUnit?: number;
  gasBill: number;
  waterBill: number;
  otherCharges: number;
  totalAmount: number;
}

export async function sendBillEmail(data: BillEmailData) {
  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #e0e0e0; padding: 32px; border-radius: 12px;">
      <h2 style="color: #818cf8; margin-bottom: 24px;">Rent Bill for ${data.month} ${data.year}</h2>
      <p>Dear ${data.renterName},</p>
      <p>Your bill for <strong>${data.apartmentName}</strong> is ready.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <tr style="border-bottom: 1px solid #333;">
          <td style="padding: 8px 0;">Base Rent</td>
          <td style="text-align: right; padding: 8px 0;">৳${data.baseRent.toLocaleString()}</td>
        </tr>
        <tr style="border-bottom: 1px solid #333;">
          <td style="padding: 8px 0;">Electricity${data.netUnits ? ` (${data.netUnits} units × ৳${data.costPerUnit})` : ""}</td>
          <td style="text-align: right; padding: 8px 0;">৳${data.electricBill.toLocaleString()}</td>
        </tr>
        <tr style="border-bottom: 1px solid #333;">
          <td style="padding: 8px 0;">Gas</td>
          <td style="text-align: right; padding: 8px 0;">৳${data.gasBill.toLocaleString()}</td>
        </tr>
        <tr style="border-bottom: 1px solid #333;">
          <td style="padding: 8px 0;">Water</td>
          <td style="text-align: right; padding: 8px 0;">৳${data.waterBill.toLocaleString()}</td>
        </tr>
        ${data.otherCharges > 0 ? `
        <tr style="border-bottom: 1px solid #333;">
          <td style="padding: 8px 0;">Other Charges</td>
          <td style="text-align: right; padding: 8px 0;">৳${data.otherCharges.toLocaleString()}</td>
        </tr>
        ` : ""}
        <tr style="border-top: 2px solid #818cf8;">
          <td style="padding: 12px 0; font-weight: bold; font-size: 18px; color: #818cf8;">TOTAL</td>
          <td style="text-align: right; padding: 12px 0; font-weight: bold; font-size: 18px; color: #818cf8;">৳${data.totalAmount.toLocaleString()}</td>
        </tr>
      </table>

      <p style="color: #f87171;">Status: UNPAID</p>
      <p>Please pay at your earliest convenience.</p>
      
      <hr style="border: 1px solid #333; margin: 24px 0;" />
      <p style="color: #888; font-size: 12px;">This is an automated message from the Rental Management System.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: data.renterEmail,
      subject: `Your Rent Bill for ${data.month} ${data.year} - ${data.apartmentName}`,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: "Failed to send email" };
  }
}
