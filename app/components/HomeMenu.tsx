import Link from "next/link";

import PokemonSideCarousels from "./PokemonSideCarousels";

export default function HomeMenu() {
  return (
    <div className="hero relative min-h-screen bg-base-200">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <Link href="/login" className="btn btn-primary btn-sm sm:btn-md">
          Connexion
        </Link>
      </div>
      <PokemonSideCarousels />
      <div className="hero-content relative z-10 flex-col gap-8 px-4 py-12">
        <div className="text-center">
          <span className="badge badge-primary badge-lg mb-4">PokeFindr</span>
          <h1 className="text-4xl font-bold sm:text-5xl">
            Quel est ce Pokémon ?
          </h1>
          <p className="mx-auto mt-4 max-w-md text-center text-base-content/70">
            Trouve le Pokémon à partir de ses statistiques !
          </p>
        </div>

        <div className="card w-full max-w-lg bg-base-100 shadow-xl">
          <div className="card-body items-center gap-6">
            <p className="text-sm text-base-content/60">
              Aperçu d&apos;une manche
            </p>
            <div className="stats stats-vertical w-full shadow sm:stats-horizontal">
              <div className="stat place-items-center">
                <div className="stat-title">PV</div>
                <div className="stat-value text-primary">???</div>
              </div>
              <div className="stat place-items-center">
                <div className="stat-title">Attaque</div>
                <div className="stat-value text-secondary">???</div>
              </div>
              <div className="stat place-items-center">
                <div className="stat-title">Défense</div>
                <div className="stat-value text-accent">???</div>
              </div>
              <div className="stat place-items-center">
                <div className="stat-title">Vitesse</div>
                <div className="stat-value">???</div>
              </div>
            </div>
            <button type="button" className="btn btn-primary btn-lg w-full">
              Commencer à jouer
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-base-content/50">
          Données fournies par{" "}
          <a
            href="https://pokeapi.co/"
            target="_blank"
            rel="noopener noreferrer"
            className="link link-primary"
          >
            PokéAPI
          </a>
        </p>
      </div>
    </div>
  );
}
