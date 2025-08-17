import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  // If we're here, x402 has already verified payment via middleware.
  // We don't need to decode headers here — client can handle that.

  return NextResponse.json({
    status: "payment_verified",
    message: "x402 payment succeeded",
  });
}
