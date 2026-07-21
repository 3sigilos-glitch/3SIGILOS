"use client";

import { createContext, useContext } from "react";
import type { Env } from "@/lib/maps";

// O ambiente segue o ecrã: Estudo (claro), Altar/Templo (escuro).
export const EnvContext = createContext<Env>("claro");
export const useEnv = () => useContext(EnvContext);
