import { createContext, use } from "react";
import type { Context } from "./types";

export const AppContext = createContext<Context | null>(null);

export function useAppContext(): Context {
  const context = use(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within a ContextProvider");
  }
  return context;
}
