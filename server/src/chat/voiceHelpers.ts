import fs from "fs/promises";
import path from "path";
import { assertMemberOfChat } from "../db/chat/chat";
import { Prisma } from "@prisma/client";
import { voiceMessageSelect } from "../db/chat/queries";
import { VoiceRequestData, StoredVoiceFile } from "../types/voiceTypes";
import multer from "multer";



export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "audio/webm",
      "audio/ogg",
      "audio/mpeg",
      "audio/mp4",
      "audio/wav",
      "audio/x-wav",
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error(`unsupported-audio-type:${file.mimetype}`));
  },
});




export function getVoiceRequestData(req: any): VoiceRequestData {
  const me = req.user.id as string;
  const { chatId } = req.params;

  const file = req.file as Express.Multer.File | undefined;
  const tempId = typeof req.body?.tempId === "string" ? req.body.tempId : undefined;

  const replyToId =
    typeof req.body?.replyToId === "string" && req.body.replyToId.trim() !== ""
      ? req.body.replyToId.trim()
      : null;

  const durationSecRaw =
    typeof req.body?.durationSec === "string" ? Number(req.body.durationSec) : NaN;

  const durationSec =
    Number.isFinite(durationSecRaw) && durationSecRaw > 0
      ? Math.round(durationSecRaw)
      : 0;

  if (!chatId) {
    const err: any = new Error("missing-chatId");
    err.status = 400;
    throw err;
  }

  if (!file) {
    const err: any = new Error("missing-audio");
    err.status = 400;
    throw err;
  }

  if (durationSec <= 0) {
    const err: any = new Error("invalid-duration");
    err.status = 400;
    throw err;
  }

  if (durationSec > 120) {
    const err: any = new Error("voice-too-long");
    err.status = 413;
    throw err;
  }

  return {
    me,
    chatId,
    file,
    tempId,
    replyToId,
    durationSec,
  };
}

export function extensionFromMime(mimeType: string): string {
  if (mimeType.includes("webm")) return ".webm";
  if (mimeType.includes("ogg")) return ".ogg";
  if (mimeType.includes("mpeg")) return ".mp3";
  if (mimeType.includes("mp4")) return ".m4a";
  if (mimeType.includes("wav")) return ".wav";
  return ".bin";
}

export async function storeVoiceFile(file: Express.Multer.File): Promise<StoredVoiceFile> {
  const ext = extensionFromMime(file.mimetype);
  const fileName = `${Date.now()}-${crypto.randomUUID()}${ext}`;

  const uploadDir = path.join(process.cwd(), "uploads", "voice");
  await fs.mkdir(uploadDir, { recursive: true });

  const absolutePath = path.join(uploadDir, fileName);
  await fs.writeFile(absolutePath, file.buffer);

  return {
    publicUrl: `/uploads/voice/${fileName}`,
  };
}

export async function assertValidReplyTarget(
  tx: Prisma.TransactionClient,
  replyToId: string | null,
  chatId: string
) {
  if (!replyToId) return;

  const replyTarget = await tx.message.findUnique({
    where: { id: replyToId },
    select: { id: true, chatId: true },
  });

  if (!replyTarget || replyTarget.chatId !== chatId) {
    const err: any = new Error("invalid-replyToId");
    err.status = 400;
    throw err;
  }
}

export function toVoiceMessageDto(created: {
  id: string;
  text: string | null;
  type: string;
  createdAt: Date;
  senderId: string;
  voiceUrl: string | null;
  voiceMimeType: string | null;
  voiceDurationSec: number | null;
  author: {
    id: string;
    displayName: string | null;
    handle: string | null;
  };
}) {
  
  const {voiceUrl,voiceMimeType,voiceDurationSec,...rest} = created;

  return {
    ...rest,
    voice: {
      url: created.voiceUrl,
      mimeType: created.voiceMimeType,
      durationSec: created.voiceDurationSec,
    },
  };
}

export async function createVoiceMessageInTx(
  tx: Prisma.TransactionClient,
  params: {
    chatId: string;
    me: string;
    replyToId: string | null;
    durationSec: number;
    publicUrl: string;
    mimeType: string;
  }
) {
  const { chatId, me, replyToId, durationSec, publicUrl, mimeType } = params;

  await assertMemberOfChat(tx, chatId, me);
  await assertValidReplyTarget(tx, replyToId, chatId);

  const created = await tx.message.create({
    data: {
      chatId,
      senderId: me,
      type: "voice",
      text: null,
      voiceUrl: publicUrl,
      voiceMimeType: mimeType,
      voiceDurationSec: durationSec,
    },
    select: voiceMessageSelect,
  });

  await tx.chat.update({
    where: { id: chatId },
    data: { lastMessageAt: created.createdAt },
  });

  await tx.chatMember.updateMany({
    where: { chatId, userId: { not: me } },
    data: { unreadCount: { increment: 1 } },
  });

  return toVoiceMessageDto(created);
}
