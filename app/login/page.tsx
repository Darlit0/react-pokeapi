import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Connexion - PokeFindr",
  description:
    "Page de connexion statique de PokeFindr, sans authentification pour le moment.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-base-200 px-4 py-10 text-base-content">
      <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
        <Link href="/" className="btn btn-ghost btn-sm">
          Retour à l&apos;accueil
        </Link>
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div className="card w-full bg-base-100 shadow-xl">
          <div className="card-body gap-6 p-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold">Connexion</h1>
              <p className="mt-2 text-sm text-base-content/60">
                Page de login statique, sans système de connexion pour le moment.
              </p>
            </div>

            <form className="space-y-4">
              <label className="form-control">
                <div className="label">
                  <span className="label-text">Adresse e-mail</span>
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="toi@exemple.com"
                  className="input input-bordered w-full"
                />
              </label>

              <label className="form-control">
                <div className="label">
                  <span className="label-text">Mot de passe</span>
                </div>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full"
                />
              </label>

              <button type="button" className="btn btn-primary w-full">
                Se connecter
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}