import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quel est ce Pokémon ? - PokeFindr",
  description:
    "Trouve le Pokémon à partir de ses statistiques. Un jeu inspiré de « Quel est ce Pokémon ? ».",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-theme="lemonade">
      <body>{children}</body>
    </html>
  );
}
