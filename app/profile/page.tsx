import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionFromCookie } from "@/lib/auth";
import { listGameHistory } from "@/lib/game-history";

export const metadata: Metadata = {
  title: "Profil - PokeFindr",
  description: "Historique des parties de PokeFindr.",
};

function formatGameDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function ProfilePage() {
  const session = await getSessionFromCookie();

  if (!session) {
    redirect("/login");
  }

  const history = await listGameHistory(session.user.id);
  const totalGames = history.length;
  const bestScore = history.reduce((max, entry) => Math.max(max, entry.score), 0);
  const cumulativeScore = history.reduce((sum, entry) => sum + entry.score, 0);

  return (
    <main className="min-h-screen bg-base-200 px-4 py-10 text-base-content">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/" className="btn btn-ghost btn-sm">
            Retour au jeu
          </Link>
          <div className="text-right">
            <h1 className="text-2xl font-bold sm:text-3xl">Profil</h1>
            <p className="text-sm text-base-content/60">{session.user.name ?? session.user.email}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="card bg-base-100 shadow-xl md:col-span-1">
            <div className="card-body gap-4">
              <h2 className="card-title">Résumé</h2>
              <div className="stats stats-vertical shadow">
                <div className="stat">
                  <div className="stat-title">Parties jouées</div>
                  <div className="stat-value text-primary">{totalGames}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Meilleur score</div>
                  <div className="stat-value text-secondary">{bestScore}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Score cumulé</div>
                  <div className="stat-value text-accent">{cumulativeScore}</div>
                </div>
              </div>
              <p className="text-sm text-base-content/60">
                Chaque partie terminée est enregistrée ici avec sa date, son heure et son score.
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl md:col-span-2">
            <div className="card-body gap-4">
              <h2 className="card-title">Historique des parties</h2>

              {history.length === 0 ? (
                <div className="alert">
                  Aucune partie enregistrée pour le moment. Termine une partie connecté pour la voir ici.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Score</th>
                        <th>Résultat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((entry) => (
                        <tr key={entry.id}>
                          <td>{formatGameDate(entry.endedAt)}</td>
                          <td>{entry.score}</td>
                          <td className="capitalize">{entry.outcome}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}