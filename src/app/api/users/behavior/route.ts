import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateBehaviorProfile } from "@/services/ai/context-awareness.service";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await updateBehaviorProfile(session.user.id);
  return NextResponse.json({ success: true, message: "Behavior profile updated" });
}
