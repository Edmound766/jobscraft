import { auth } from "./auth";
import { getRequestHeaders } from "@tanstack/solid-start/server";

export async function requireUser() {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers });
  if (!session) throw new Error("UNAUTHORIZED");
  return session.user;
}


export async function getOptionalUser() {
  const headers= getRequestHeaders();
  const session = await auth.api.getSession({ headers });
  return session?.user ?? null;
}
