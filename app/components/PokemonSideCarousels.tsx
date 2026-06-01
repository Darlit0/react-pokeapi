"use client";

import { useEffect, useState, type CSSProperties } from "react";

const POKEMON_COUNT = 151;
const ITEMS_PER_COLUMN = 28;
const POKEMON_SIZE = 188; // 75px × 2,5

function pickRandomIds(count: number): number[] {
  const ids = new Set<number>();
  while (ids.size < count) {
    ids.add(Math.floor(Math.random() * POKEMON_COUNT) + 1);
  }
  return Array.from(ids);
}

function spriteUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

function VerticalCarousel({
  ids,
  durationSeconds,
}: {
  ids: number[];
  durationSeconds: number;
}) {
  const track = [...ids, ...ids];

  return (
    <div
      className="h-full overflow-hidden"
      style={{ width: POKEMON_SIZE }}
    >
      <div
        className="pokemon-scroll-track flex flex-col items-center gap-6"
        style={
          { "--scroll-duration": `${durationSeconds}s` } as CSSProperties
        }
      >
        {track.map((id, index) => (
          <img
            key={`${id}-${index}`}
            src={spriteUrl(id)}
            alt=""
            width={POKEMON_SIZE}
            height={POKEMON_SIZE}
            className="shrink-0 object-contain"
            style={{ width: POKEMON_SIZE, height: POKEMON_SIZE }}
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
}

function CarouselColumn({
  ids,
  durationSeconds,
  side,
}: {
  ids: number[];
  durationSeconds: number;
  side: "left" | "right";
}) {
  const horizontalFade =
    side === "left"
      ? "bg-gradient-to-r from-base-200/95 via-base-200/40 to-transparent"
      : "bg-gradient-to-l from-base-200/95 via-base-200/40 to-transparent";

  return (
    <aside
      aria-hidden
      className={`pointer-events-none fixed inset-y-0 z-0 hidden md:flex ${
        side === "left" ? "left-2" : "right-2"
      }`}
    >
      <div
        className="relative h-full"
        style={{ width: POKEMON_SIZE }}
      >
        <div className="h-full opacity-50 blur-[1px]">
          <VerticalCarousel ids={ids} durationSeconds={durationSeconds} />
        </div>
        <div
          className={`absolute inset-0 ${horizontalFade}`}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-base-200 via-transparent to-base-200"
          aria-hidden
        />
      </div>
    </aside>
  );
}

export default function PokemonSideCarousels() {
  const [leftIds, setLeftIds] = useState<number[]>([]);
  const [rightIds, setRightIds] = useState<number[]>([]);

  useEffect(() => {
    setLeftIds(pickRandomIds(ITEMS_PER_COLUMN));
    setRightIds(pickRandomIds(ITEMS_PER_COLUMN));
  }, []);

  if (leftIds.length === 0) return null;

  return (
    <>
      <CarouselColumn ids={leftIds} durationSeconds={45} side="left" />
      <CarouselColumn ids={rightIds} durationSeconds={38} side="right" />
    </>
  );
}
