import { prisma } from "@/lib/prisma";

export type GameOutcome = "win" | "lose" | "forfeit";

export async function recordGameHistory(options: {
  userId: string;
  score: number;
  outcome: GameOutcome;
}) {
  return prisma.gameHistory.create({
    data: {
      userId: options.userId,
      score: options.score,
      outcome: options.outcome,
    },
  });
}

export async function listGameHistory(userId: string) {
  return prisma.gameHistory.findMany({
    where: { userId },
    orderBy: { endedAt: "desc" },
  });
}