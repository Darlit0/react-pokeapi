import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { clearSessionCookie, deleteSession, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    await deleteSession(sessionToken);
  }

  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}