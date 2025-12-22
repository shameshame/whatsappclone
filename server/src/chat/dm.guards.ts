// src/routes/dm.guards.ts
import { PrismaClient } from "@prisma/client";
import { differenceInMilliseconds } from "date-fns";



const prisma = new PrismaClient();

export async function loadOwnedMessageOrThrow(messageId: string | undefined, me: string, chatId: string) {
  const msg = await prisma.message.findUnique({ where: { id: messageId } });
  if (!msg || msg.chatId !== chatId) {
    const err = new Error("not-found");
    (err as any).status = 404;
    throw err;
  }
  if (msg.senderId !== me) {
    const err = new Error("forbidden");
    (err as any).status = 403;
    throw err;
  }
  return msg;
}

export function assertWithinEditWindowOrThrow(createdAt: Date ) {
  
  const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
  
  if (!(createdAt instanceof Date) || Number.isNaN(createdAt.getTime())) {
    throw Object.assign(new Error("invalid-created-at"), { status: 400 });
  }

  const ageMs = Date.now() - createdAt.getTime();

  if (ageMs > FIFTEEN_MINUTES_MS) {
    throw Object.assign(new Error("edit-window-expired"), { status: 409 });
  }
}