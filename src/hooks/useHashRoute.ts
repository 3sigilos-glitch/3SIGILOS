import { useEffect, useState } from "react";

export type Route =
  | { view: "cards" }
  | { view: "guide" }
  | { view: "card"; slug: string };

function parse(hash: string): Route {
  const h = hash.replace(/^#\/?/, "");
  if (h === "guia") return { view: "guide" };
  const m = h.match(/^carta\/(.+)$/);
  if (m) return { view: "card", slug: decodeURIComponent(m[1]) };
  return { view: "cards" };
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export function navigate(to: string, replace = false) {
  if (replace) {
    const url = new URL(window.location.href);
    url.hash = to;
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = to;
  }
}
