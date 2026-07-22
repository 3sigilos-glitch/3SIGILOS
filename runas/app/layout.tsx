import type { Metadata, Viewport } from "next";
import { Cinzel, EB_Garamond, Noto_Sans_Runic } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cinzel",
});

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-garamond",
});

const runic = Noto_Sans_Runic({
  subsets: ["runic"],
  weight: "400",
  variable: "--font-runic",
});

export const metadata: Metadata = {
  title: "Magia Nórdica · Runas",
  description:
    "Códice interativo do Módulo Branco: as 25 runas, matriz elemento e pólo, modo Altar, montador de templo e favoritos.",
  // Conteúdo reservado: não indexar em motores de busca.
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className={`${cinzel.variable} ${garamond.variable} ${runic.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
