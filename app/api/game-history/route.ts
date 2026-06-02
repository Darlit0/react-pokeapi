import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionFromCookie } from "@/lib/auth";
import { listGameHistory, recordGameHistory } from "@/lib/game-history";

const createHistorySchema = z.object({
  score: z.number().int().min(0),
  outcome: z.enum(["win", "lose", "forfeit"]),
});

export async function GET() {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
  }

  const history = await listGameHistory(session.user.id);

  return NextResponse.json({ history });
}

export async function POST(request: Request) {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createHistorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Donnees invalides." }, { status: 400 });
  }

  const history = await recordGameHistory({
    userId: session.user.id,
    score: parsed.data.score,
    outcome: parsed.data.outcome,
  });

  return NextResponse.json({ history }, { status: 201 });
}