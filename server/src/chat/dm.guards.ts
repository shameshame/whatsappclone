// src/routes/dm.guards.ts
import { PrismaClient } from "@prisma/client";
import { differenceInMilliseconds } from "date-fns";

const FIFTEEN_MIN = 15 * 60 * 1000;

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

export function assertWithinEditWindowOrThrow(msg: { createdAt: Date }) {
  const age = Date.now() - msg.createdAt.getTime();
  if (age > FIFTEEN_MIN) {
    const err = new Error("edit-window-passed");
    (err as any).status = 403;
    throw err;
  }
}