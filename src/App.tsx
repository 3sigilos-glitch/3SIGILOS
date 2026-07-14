import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { PrefsProvider, usePrefs } from "./lib/prefs";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { Splash } from "./components/Splash";
import { Home } from "./screens/Home";
import { Cards } from "./screens/Cards";
import { CardDetail } from "./screens/CardDetail";

const Journey = lazy(() => import("./screens/Journey").then((mod) => ({ default: mod.Journey })));
const Guide = lazy(() => import("./screens/Guide").then((mod) => ({ default: mod.Guide })));
const Study = lazy(() => import("./screens/Study").then((mod) => ({ default: mod.Study })));
const Readings = lazy(() => import("./screens/Readings").then((mod) => ({ default: mod.Readings })));
const NewReading = lazy(() => import("./screens/NewReading").then((mod) => ({ default: mod.NewReading })));
const ReadingView = lazy(() => import("./screens/ReadingView").then((mod) => ({ default: mod.ReadingView })));

/* As funcionalidades reservadas só existem para quem tem o código. */
function Reserved({ children }: { children: React.ReactNode }) {
  const { reserved } = usePrefs();
  if (!reserved) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/* Redirecciona links antigos no formato #/carta/x para as rotas novas. */
function LegacyHashRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    const h = window.location.hash;
    if (h.startsWith("#/")) {
      const path = h.slice(1);
      window.history.replaceState(null, "", window.location.pathname);
      navigate(path === "/guia" ? "/guia" : path, { replace: true });
    }
  }, [navigate]);
  return null;
}

function Screens() {
  const location = useLocation();
  const reduced = useReducedMotion();
  const isDetail = location.pathname.startsWith("/carta/");

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        // Os detalhes partilham a mesma chave para o swipe entre cartas
        // animar por conta própria, sem crossfade de página no meio.
        key={isDetail ? "detail" : location.pathname}
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduced ? undefined : { opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeInOut" }}
      >
        <Suspense fallback={null}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/cartas" element={<Cards />} />
            <Route path="/carta/:slug" element={<CardDetail />} />
            <Route path="/jornada" element={<Journey />} />
            <Route path="/guia" element={<Guide />} />
            <Route path="/estudo" element={<Study />} />
            <Route path="/leituras" element={<Reserved><Readings /></Reserved>} />
            <Route path="/leituras/nova/:spreadId" element={<Reserved><NewReading /></Reserved>} />
            <Route path="/leituras/:id" element={<Reserved><ReadingView /></Reserved>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </m.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      <PrefsProvider>
        <div className="app">
          <Splash />
          <LegacyHashRedirect />
          <Header />
          <Screens />
          <BottomNav />
        </div>
      </PrefsProvider>
    </LazyMotion>
  );
}
