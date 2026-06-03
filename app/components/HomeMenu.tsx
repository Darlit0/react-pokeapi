"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import PokemonSideCarousels from "./PokemonSideCarousels";

type PokemonData = {
  id: number;
  name: string;
  frenchName: string | null;
  generation: string | null;
  generationSlug: string | null;
  sprite: string | null;
  types: Array<{ english: string; french: string | null }>;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    specialAttack: number;
    specialDefense: number;
  };
};

const MAX_POINTS = 5;
const MAX_POKEMON_ID_FALLBACK = 1025;
const typeNameCache = new Map<string, string | null>();
const generationNamesCache = new Map<string, string[]>();

function normalizePokemonName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatPokemonName(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatGenerationLabel(generationSlug: string): string {
  // PokeAPI renvoie typiquement: "generation-i", "generation-ii", "generation-ix", ...
  const parts = generationSlug.split("-");
  if (parts.length === 2 && parts[0] === "generation") {
    return `Generation ${parts[1].toUpperCase()}`;
  }
  // Fallback générique.
  return formatPokemonName(generationSlug);
}

function getStat(statName: string, stats: Array<{ base_stat: number; stat: { name: string } }>) {
  return stats.find((entry) => entry.stat.name === statName)?.base_stat ?? 0;
}

function getLocalizedSpeciesName(
  names: Array<{ language: { name: string }; name: string }>,
  locale: string
) {
  return names.find((entry) => entry.language.name === locale)?.name ?? null;
}

function getPointsColor(points: number): string {
  const ratio = (MAX_POINTS - points) / MAX_POINTS;
  const start = { r: 17, g: 24, b: 39 };
  const end = { r: 220, g: 38, b: 38 };

  const r = Math.round(start.r + (end.r - start.r) * ratio);
  const g = Math.round(start.g + (end.g - start.g) * ratio);
  const b = Math.round(start.b + (end.b - start.b) * ratio);

  return `rgb(${r}, ${g}, ${b})`;
}

function getRevealPokemonName(pokemon: PokemonData): string {
  const englishName = formatPokemonName(pokemon.name);

  if (!pokemon.frenchName) {
    return englishName;
  }

  return `${pokemon.frenchName} (${englishName})`;
}

async function fetchRandomPokemon(maxPokemonId: number): Promise<PokemonData> {
  const safeMax = Math.max(1, maxPokemonId);
  const randomId = Math.floor(Math.random() * safeMax) + 1;
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);

  if (!response.ok) {
    throw new Error("Impossible de récupérer les données Pokémon.");
  }

  const data = await response.json();
  let frenchName: string | null = null;
  let generation: string | null = null;
  let generationSlug: string | null = null;

  if (data.species?.url) {
    try {
      const speciesResponse = await fetch(data.species.url);
      if (speciesResponse.ok) {
        const speciesData = await speciesResponse.json();
        frenchName = getLocalizedSpeciesName(speciesData.names ?? [], "fr");
        generationSlug = speciesData.generation?.name ?? null;
        generation = generationSlug ? formatGenerationLabel(generationSlug) : null;
      }
    } catch {
      frenchName = null;
      generation = null;
      generationSlug = null;
    }
  }

  const types = await Promise.all(
    data.types.map(async (entry: { type: { name: string; url: string } }) => {
      const english = entry.type.name;

      if (!entry.type.url) {
        return { english, french: null };
      }

      if (typeNameCache.has(english)) {
        return { english, french: typeNameCache.get(english) ?? null };
      }

      try {
        const typeResponse = await fetch(entry.type.url);
        if (!typeResponse.ok) {
          typeNameCache.set(english, null);
          return { english, french: null };
        }

        const typeData = await typeResponse.json();
        const french = getLocalizedSpeciesName(typeData.names ?? [], "fr");
        typeNameCache.set(english, french);
        return { english, french };
      } catch {
        typeNameCache.set(english, null);
        return { english, french: null };
      }
    })
  );

  return {
    id: data.id,
    name: data.name,
    frenchName,
    generation,
    generationSlug,
    sprite: data.sprites?.front_default ?? null,
    types,
    stats: {
      hp: getStat("hp", data.stats),
      attack: getStat("attack", data.stats),
      defense: getStat("defense", data.stats),
      speed: getStat("speed", data.stats),
      specialAttack: getStat("special-attack", data.stats),
      specialDefense: getStat("special-defense", data.stats),
    },
  };
}

async function fetchGenerationPokemonNames(generationSlug: string): Promise<string[]> {
  const cached = generationNamesCache.get(generationSlug);
  if (cached) return cached;

  const response = await fetch(`https://pokeapi.co/api/v2/generation/${generationSlug}`);
  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const speciesList: Array<{ name: string; url?: string }> = data.pokemon_species ?? [];

  // Fetch each species resource to obtain the localized French name when available.
  const names = await Promise.all(
    speciesList.map(async (entry) => {
      const speciesUrl = entry.url ?? `https://pokeapi.co/api/v2/pokemon-species/${entry.name}`;
      try {
        const res = await fetch(speciesUrl);
        if (!res.ok) return formatPokemonName(entry.name);
        const speciesData = await res.json();
        const french = getLocalizedSpeciesName(speciesData.names ?? [], "fr");
        return french ? french : formatPokemonName(entry.name);
      } catch {
        return formatPokemonName(entry.name);
      }
    })
  );

  generationNamesCache.set(generationSlug, names);
  return names;
}

function HomeCard({ onStart }: { onStart: () => void }) {
  return (
    <>
      <div className="text-center">
        <span className="badge badge-primary badge-lg mb-4">PokeFindr</span>
        <h1 className="text-4xl font-bold sm:text-5xl">Quel est ce Pokémon ?</h1>
        <p className="mx-auto mt-4 max-w-md text-center text-base-content/70">
          Trouve le Pokémon à partir de ses statistiques !
        </p>
      </div>

      <div className="card w-full max-w-xl bg-base-100 shadow-xl">
        <div className="card-body items-center gap-6">
          <p className="text-sm text-base-content/60">Aperçu d&apos;une manche</p>
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
          <button type="button" className="btn btn-primary btn-lg w-full" onClick={onStart}>
            Commencer à jouer
          </button>
        </div>
      </div>
    </>
  );
}

async function saveGameHistory(outcome: "win" | "lose" | "forfeit", score: number) {
  try {
    await fetch("/api/game-history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ outcome, score }),
    });
  } catch {
    // L'historique ne doit pas bloquer la fin de partie.
  }
}

function GameCard({
  pokemon,
  generationLabel,
  points,
  flashHit,
  guess,
  suggestions,
  lastOutcome,
  loading,
  error,
  onGuessChange,
  onGuessSubmit,
  onForfeit,
  onGoHome,
  onNextRound,
}: {
  pokemon: PokemonData | null;
  generationLabel: string;
  points: number;
  flashHit: boolean;
  guess: string;
  suggestions: string[];
  lastOutcome: "win" | "lose" | "forfeit" | null;
  loading: boolean;
  error: string | null;
  onGuessChange: (value: string) => void;
  onGuessSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onForfeit: () => void;
  onGoHome: () => void;
  onNextRound: () => void;
}) {
  const canShowTypes = points <= 3;
  const canShowSprite = points <= 1;
  const gameOver = points === 0 || lastOutcome !== null;

  const displayTypes =
    pokemon?.types
      .map((typeName) => {
        const en = formatPokemonName(typeName.english);
        if (!typeName.french) return en;
        return `${typeName.french} (${en})`;
      })
      .join(" / ") ?? "-";
  const revealName = pokemon ? getRevealPokemonName(pokemon) : "-";
  const showResultModal = lastOutcome !== null && pokemon !== null;
  const pointsDelta =
    lastOutcome === "win" ? points : lastOutcome === "lose" || lastOutcome === "forfeit" ? -2 : 0;
  const modalTitle =
    lastOutcome === "win" ? "Victoire !" : lastOutcome === "forfeit" ? "Forfeit" : "Perdu !";
  const modalText =
    lastOutcome === "win"
      ? "Bien joue, tu as trouve le bon Pokemon."
      : lastOutcome === "forfeit"
        ? "Tu as abandonne la manche."
        : "Tu as perdu cette manche.";

  return (
    <div className={`card game-card-danger relative w-full max-w-5xl shadow-xl ${flashHit ? "is-hit" : ""}`}>
      <div className="card-body gap-9 p-8 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="card-title text-3xl md:text-4xl">Partie en cours</h2>
          <div
            className="text-5xl font-bold tabular-nums transition-colors duration-700 md:text-6xl"
            style={{ color: getPointsColor(points) }}
          >
            {points} pts
          </div>
        </div>
        <p className="text-center text-2xl font-bold text-base-content md:text-3xl">
          Génération : <span className="text-primary">{generationLabel}</span>
        </p>

        {loading && <div className="alert">Chargement du Pokémon...</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {pokemon && !loading && !error && (
          <>
            <div className="stats stats-vertical w-full shadow md:stats-horizontal">
              <div className="stat">
                <div className="stat-title text-base">PV</div>
                <div className="stat-value text-primary text-4xl">{pokemon.stats.hp}</div>
              </div>
              <div className="stat">
                <div className="stat-title text-base">Attaque</div>
                <div className="stat-value text-secondary text-4xl">{pokemon.stats.attack}</div>
              </div>
              <div className="stat">
                <div className="stat-title text-base">Défense</div>
                <div className="stat-value text-accent text-4xl">{pokemon.stats.defense}</div>
              </div>
              <div className="stat">
                <div className="stat-title text-base">Vitesse</div>
                <div className="stat-value text-4xl">{pokemon.stats.speed}</div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title text-sm">Type(s) (3 points restants)</div>
                  <div className="stat-value whitespace-normal break-words text-primary text-2xl leading-tight md:text-3xl">
                    {canShowTypes ? displayTypes : "???"}
                  </div>
                </div>
              </div>

              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title text-sm">Sp. Atk / Sp. Def (3 points restants)</div>
                  <div className="stat-value text-secondary text-3xl">
                    {canShowTypes
                      ? `${pokemon.stats.specialAttack} / ${pokemon.stats.specialDefense}`
                      : "??? / ???"}
                  </div>
                </div>
              </div>

              <div className="stats shadow">
                <div className="stat min-h-64">
                  <div className="stat-title text-sm">Sprite (1 point restant)</div>
                  <div className="stat-value text-center text-accent">
                    {canShowSprite && pokemon.sprite ? (
                      <img
                        src={pokemon.sprite}
                        alt="Sprite Pokémon"
                        width={220}
                        height={220}
                        className="pokemon-sprite-silhouette mx-auto h-56 w-full object-contain md:h-64"
                      />
                    ) : (
                      <span className="block text-8xl leading-none md:text-9xl">?</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <form className="flex flex-col gap-3 md:flex-row" onSubmit={onGuessSubmit}>
              <input
                type="text"
                className="input input-bordered input-lg w-full text-lg"
                placeholder="Ton guess (ex: pikachu)"
                value={guess}
                onChange={(event) => onGuessChange(event.target.value)}
                disabled={gameOver}
                list="pokemon-name-suggestions"
                autoComplete="on"
              />
              <button type="submit" className="btn btn-primary btn-lg md:min-w-52" disabled={gameOver}>
                Valider
              </button>
            </form>
            <datalist id="pokemon-name-suggestions">
              {suggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>

            <div className="card-actions justify-end">
              <button type="button" className="btn btn-outline btn-lg" onClick={onForfeit} disabled={gameOver}>
                Forfeit
              </button>
            </div>
          </>
        )}
      </div>
      {showResultModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="mb-4 text-center text-2xl font-bold">{modalTitle}</h3>
            <div className="mb-4 flex flex-col items-center gap-3">
              {pokemon?.sprite ? (
                <img
                  src={pokemon.sprite}
                  alt={`Sprite de ${revealName}`}
                  width={140}
                  height={140}
                  className="h-36 w-36 object-contain"
                />
              ) : (
                <div className="flex h-36 w-36 items-center justify-center text-6xl">?</div>
              )}
              <p className="text-center text-xl font-semibold">{revealName}</p>
            </div>
            <p className="text-center text-base">{modalText}</p>
            <p
              className={`text-center text-base font-semibold ${
                pointsDelta >= 0 ? "text-primary" : "text-error"
              }`}
            >
              Points gagnés / perdus : {pointsDelta >= 0 ? `+${pointsDelta}` : pointsDelta}
            </p>
            <div className="modal-action">
              {lastOutcome === "forfeit" ? (
                <>
                  <button type="button" className="btn btn-outline flex-1" onClick={onGoHome}>
                    Home
                  </button>
                  <button type="button" className="btn btn-primary flex-1" onClick={onNextRound}>
                    Relancer une partie
                  </button>
                </>
              ) : (
                <button type="button" className="btn btn-primary w-full" onClick={onNextRound}>
                  Relancer une partie
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomeMenu() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string | null } | null>(null);
  const [pokemon, setPokemon] = useState<PokemonData | null>(null);
  const [points, setPoints] = useState(MAX_POINTS);
  const [flashHit, setFlashHit] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<"win" | "lose" | "forfeit" | null>(null);
  const [guess, setGuess] = useState("");
  const [generationPokemonNames, setGenerationPokemonNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxPokemonId, setMaxPokemonId] = useState<number>(MAX_POKEMON_ID_FALLBACK);
  const flashTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) {
          if (!isCancelled) {
            setCurrentUser(null);
          }
          return;
        }

        const data = (await response.json()) as {
          user: { id: string; email: string; name: string | null };
        };

        if (!isCancelled) {
          setCurrentUser(data.user);
        }
      } catch {
        if (!isCancelled) {
          setCurrentUser(null);
        }
      }
    }

    loadSession();

    return () => {
      isCancelled = true;
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
  }

  useEffect(() => {
    return () => {
      const timer = flashTimerRef.current;
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  const canSubmit = useMemo(() => guess.trim().length > 0, [guess]);
  const guessSuggestions = useMemo(() => {
    const normalizedGuess = normalizePokemonName(guess);
    if (normalizedGuess.length < 1) return [];

    return generationPokemonNames
      .filter((name) => normalizePokemonName(name).includes(normalizedGuess))
      .slice(0, 10);
  }, [generationPokemonNames, guess]);

  useEffect(() => {
    let isCancelled = false;

    async function loadGenerationPokemonNames() {
      if (!pokemon?.generationSlug) {
        setGenerationPokemonNames([]);
        return;
      }

      try {
        const names = await fetchGenerationPokemonNames(pokemon.generationSlug);
        if (!isCancelled) {
          setGenerationPokemonNames(names);
        }
      } catch {
        if (!isCancelled) {
          setGenerationPokemonNames([]);
        }
      }
    }

    loadGenerationPokemonNames();

    return () => {
      isCancelled = true;
    };
  }, [pokemon?.generationSlug]);

  useEffect(() => {
    // Permet de tirer au hasard parmi toutes les générations (pas seulement la Gen 1).
    let isCancelled = false;

    async function loadMaxPokemonId() {
      try {
        const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1");
        if (!response.ok) return;
        const data = await response.json();
        if (!isCancelled && typeof data?.count === "number") {
          setMaxPokemonId(data.count);
        }
      } catch {
        // Fallback gardé.
      }
    }

    loadMaxPokemonId();
    return () => {
      isCancelled = true;
    };
  }, []);

  async function startRound() {
    setLoading(true);
    setError(null);
    setPokemon(null);
    setPoints(MAX_POINTS);
    setFlashHit(false);
    setLastOutcome(null);
    setGuess("");
    setGenerationPokemonNames([]);

    try {
      const randomPokemon = await fetchRandomPokemon(maxPokemonId);
      setPokemon(randomPokemon);
    } catch (fetchError) {
      const text = fetchError instanceof Error ? fetchError.message : "Erreur inconnue.";
      setError(text);
    } finally {
      setLoading(false);
    }
  }

  async function handleStart() {
    setIsPlaying(true);
    await startRound();
  }

  function handleGuessSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!pokemon || points === 0 || !canSubmit) return;

    const cleanGuess = normalizePokemonName(guess);
    const acceptedNames = [pokemon.name, pokemon.frenchName].filter(
      (value): value is string => Boolean(value)
    );
    const isGoodAnswer = acceptedNames
      .map((name) => normalizePokemonName(name))
      .includes(cleanGuess);

    if (isGoodAnswer) {
      void saveGameHistory("win", points);
      setGuess("");
      setLastOutcome("win");
      return;
    }

    const nextPoints = Math.max(0, points - 1);
    setPoints(nextPoints);
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
    }
    setFlashHit(true);
    flashTimerRef.current = window.setTimeout(() => setFlashHit(false), 700);
    if (nextPoints === 0) {
      void saveGameHistory("lose", nextPoints);
      setLastOutcome("lose");
    }
    setGuess("");
  }

  function handleForfeit() {
    if (!pokemon || lastOutcome !== null) return;
    void saveGameHistory("forfeit", points);
    setLastOutcome("forfeit");
  }

  function handleGoHome() {
    setIsPlaying(false);
    setPokemon(null);
    setPoints(MAX_POINTS);
    setFlashHit(false);
    setLastOutcome(null);
    setGuess("");
    setError(null);
    setGenerationPokemonNames([]);
  }

  return (
    <div className="hero relative min-h-screen bg-base-200">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        {currentUser ? (
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="hidden rounded-full bg-base-100 px-3 py-2 text-sm shadow transition hover:bg-base-300 sm:inline-flex"
            >
              {currentUser.name ?? currentUser.email}
            </Link>
            <button type="button" className="btn btn-outline btn-sm sm:btn-md" onClick={handleLogout}>
              Déconnexion
            </button>
          </div>
        ) : (
          <Link href="/login" className="btn btn-primary btn-sm sm:btn-md">
            Connexion
          </Link>
        )}
      </div>

      <PokemonSideCarousels />

      <div className="hero-content relative z-10 flex-col gap-8 px-4 py-12">
        {!isPlaying ? (
          <HomeCard onStart={handleStart} />
        ) : (
          <GameCard
            pokemon={pokemon}
            generationLabel={pokemon?.generation ?? "-"}
            points={points}
            flashHit={flashHit}
            guess={guess}
            suggestions={guessSuggestions}
            lastOutcome={lastOutcome}
            loading={loading}
            error={error}
            onGuessChange={setGuess}
            onGuessSubmit={handleGuessSubmit}
            onForfeit={handleForfeit}
            onGoHome={handleGoHome}
            onNextRound={startRound}
          />
        )}

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
