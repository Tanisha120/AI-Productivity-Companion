import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { z } from "zod";

const prefsSchema = z.object({
  workStartTime: z.string().optional(),
  workEndTime: z.string().optional(),
  timezone: z.string().optional(),
  darkMode: z.boolean().optional(),
  productiveHours: z.array(z.number()).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.user.id).select("preferences timezone");
  return NextResponse.json({ success: true, data: { ...user?.preferences?.toObject?.() ?? user?.preferences, timezone: user?.timezone } });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = prefsSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await connectDB();
  const { timezone, darkMode, workStartTime, workEndTime, productiveHours } = parsed.data;

  const update: Record<string, unknown> = {};
  if (timezone) update.timezone = timezone;
  if (workStartTime) update["preferences.workStartTime"] = workStartTime;
  if (workEndTime) update["preferences.workEndTime"] = workEndTime;
  if (darkMode !== undefined) update["preferences.darkMode"] = darkMode;
  if (productiveHours) update["preferences.productiveHours"] = productiveHours;

  await User.findByIdAndUpdate(session.user.id, { $set: update });
  return NextResponse.json({ success: true });
}
