"use client";

import { createContext, ReactNode, useContext } from "react";

export type SurfaceTheme = "inherit" | "light";

const SurfaceThemeContext = createContext<SurfaceTheme>("inherit");

export function SurfaceThemeProvider({ children, theme }: { children: ReactNode; theme: SurfaceTheme }) {
  return <SurfaceThemeContext.Provider value={theme}>{children}</SurfaceThemeContext.Provider>;
}

export function useSurfaceTheme(): SurfaceTheme {
  return useContext(SurfaceThemeContext);
}
