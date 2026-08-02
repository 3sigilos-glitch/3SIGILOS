import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import RegistarServiceWorker from "./registar-sw";

const inter = Inter({
  subsets: ["latin"],
  variable: "--fonte-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--fonte-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SINAL",
  description: "Porta de entrada unica para a casa.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SINAL",
  },
};

export const viewport: Viewport = {
  themeColor: "#12161a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT" className={`${inter.variable} ${plexMono.variable}`}>
      <body>
        {children}
        <RegistarServiceWorker />
      </body>
    </html>
  );
}
