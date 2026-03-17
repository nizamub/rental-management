interface BillSmsData {
  renterName: string;
  renterPhone: string;
  apartmentName: string;
  month: string;
  year: number;
  totalAmount: number;
}

export async function sendBillSms(data: BillSmsData) {
  // Twilio integration placeholder
  // To enable SMS, install `twilio` package and set TWILIO_* env vars
  const body = `Dear ${data.renterName}, your rent bill for ${data.month} ${data.year} (${data.apartmentName}) is ready. Total: ৳${data.totalAmount.toLocaleString()}. Status: UNPAID. Please pay at your earliest convenience.`;

  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_PHONE_NUMBER
  ) {
    console.warn("Twilio not configured. SMS not sent.");
    console.info("SMS would have been sent to:", data.renterPhone);
    console.info("SMS body:", body);
    return { success: false, error: "Twilio not configured" };
  }

  try {
    // Twilio package is not installed.
    // Replace this block with actual Twilio API call when package is added.
    return { success: true, message: "Stubbed SMS sent successfully" };
  } catch (error) {
    console.error("SMS send error:", error);
    return { success: false, error: "Failed to send SMS" };
  }
}
