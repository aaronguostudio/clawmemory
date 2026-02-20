import { NextResponse } from "next/server";
import { openclawStatus } from "@/lib/openclaw";

export function GET() {
  const status = openclawStatus();
  return NextResponse.json(status);
}
