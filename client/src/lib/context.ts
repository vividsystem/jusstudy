import { createContext } from "react-router";
import type { authClient } from "./auth-client";

export type SessionUser = typeof authClient.$Infer.Session["user"]
export const userContext = createContext<SessionUser | null>(null)
