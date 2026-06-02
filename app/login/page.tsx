import type { Metadata } from "next";
import Link from "next/link";

import LoginForm from "./LoginForm";

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
        <LoginForm />
      </div>
    </main>
  );
}