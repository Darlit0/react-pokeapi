"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

type Mode = "login" | "register";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        const data = (await response.json()) as { user: AuthUser };
        if (!cancelled) {
          setUser(data.user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          ...(mode === "register" ? { name } : {}),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        user?: AuthUser;
      };

      if (!response.ok) {
        setMessage(data.error ?? "Une erreur est survenue.");
        return;
      }

      setUser(data.user ?? null);
      setMessage(mode === "login" ? "Connexion réussie." : "Compte créé avec succès.");
      router.refresh();
      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    setMessage(null);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setMessage("Tu es maintenant déconnecté.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card w-full bg-base-100 shadow-xl">
      <div className="card-body gap-6 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Connexion</h1>
          <p className="mt-2 text-sm text-base-content/60">
            {mode === "login"
              ? "Connecte-toi pour accéder à ton compte."
              : "Crée un compte pour commencer."}
          </p>
        </div>

        {checkingSession ? (
          <div className="alert">Vérification de ta session...</div>
        ) : user ? (
          <div className="space-y-4">
            <div className="alert alert-success">
              Connecté en tant que {user.name ?? user.email}
            </div>
            <button type="button" className="btn btn-outline w-full" onClick={handleLogout} disabled={loading}>
              Se déconnecter
            </button>
          </div>
        ) : (
          <>
            <div className="join join-horizontal w-full">
              <button
                type="button"
                className={`btn join-item flex-1 ${mode === "login" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setMode("login")}
              >
                Se connecter
              </button>
              <button
                type="button"
                className={`btn join-item flex-1 ${mode === "register" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setMode("register")}
              >
                Créer un compte
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === "register" && (
                <label className="form-control">
                  <div className="label">
                    <span className="label-text">Nom</span>
                  </div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Ton prénom ou pseudo"
                    className="input input-bordered w-full"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={loading}
                  />
                </label>
              )}

              <label className="form-control">
                <div className="label">
                  <span className="label-text">Adresse e-mail</span>
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="toi@exemple.com"
                  className="input input-bordered w-full"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                  autoComplete="email"
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
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </label>

              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading
                  ? "Patiente..."
                  : mode === "login"
                    ? "Se connecter"
                    : "Créer mon compte"}
              </button>
            </form>
          </>
        )}

        {message && <div className="alert alert-info">{message}</div>}
      </div>
    </div>
  );
}