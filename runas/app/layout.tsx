import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
});

const body = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Magia Nórdica · Runas",
  description:
    "Referência e prática do Módulo Branco: as 25 runas, armas, seres, elementos, evocações e o Montador de Templo.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className={`${display.variable} ${body.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
