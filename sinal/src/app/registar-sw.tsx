"use client";

import { useEffect } from "react";

// Regista o service worker no ambito raiz. So corre no browser.
export default function RegistarServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Registo falhou. A app continua a funcionar online.
      });
    }
  }, []);

  return null;
}
