import { Request } from "express";

export function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getUserIdFromHeader(req: Request): string {
  return String(req.header("x-user-id") ?? "").trim();
}
