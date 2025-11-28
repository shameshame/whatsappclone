// POST /api/groups

import { RequestHandler } from "express";
import { PrismaClient} from "@prisma/client";
import { emitToChatRoom, populateParticipantsList } from "../chat/helpers";
import {buildMemberRows} from "../chat/helpers";
import { chatWithMembersArgs } from "../db/chat/queries";
import { ChatSummary } from "@shared/types/chatSummary";

const prisma = new PrismaClient();


function nameValidation(res:any,name: string): string {
      const trimmedName = (name ?? "").trim();
    
      if (!trimmedName) {
        return res.status(400).json({ ok: false, message: "name-required" });
      }
      if (trimmedName.length > 80) {
        return res.status(400).json({ ok: false, message: "name-too-long" });
     }

    return trimmedName;
}


// body: { name?: string, memberIds: string[] }  // includes creator? optional
export const createGroup: RequestHandler = async (req, res) => {
  const me = (req as any).user.id as string;
  const { name, memberIds = [] } = req.body ?? {};

  const trimmedName = nameValidation(res,name);
  if (typeof trimmedName !== "string") return; // error already sent

  // ensure creator is included and unique
  const members = Array.from(new Set([me, ...memberIds].filter(Boolean)));

  const chatWithMembers = await prisma.$transaction(async (tx) => {
    const chat = await tx.chat.create({
      data: { id: crypto.randomUUID(), type: "GROUP", name: trimmedName},
      select: { id: true, type: true, name: true, createdAt: true },
    });

    // creator is ADMIN, others MEMBER
    await tx.chatMember.createMany({
      data: buildMemberRows(chat.id, me, members),
      skipDuplicates: true,
    });

    return tx.chat.findUniqueOrThrow({
        where: { id: chat.id },
        ...chatWithMembersArgs,
    });


  });
  const myMember = chatWithMembers.members.find(m => m.user.id === me) ?? null;
  
  const summary: ChatSummary = {
      id: chatWithMembers.id,
      type: chatWithMembers.type,          // "GROUP"
      name: chatWithMembers.name,
      createdAt: chatWithMembers.createdAt.toISOString(),
      updatedAt: chatWithMembers.updatedAt.toISOString(),
      lastMessageAt: chatWithMembers.lastMessageAt? chatWithMembers.lastMessageAt.toISOString(): null,
      // brand new group → no messages yet
      lastMessage: null,
      participants: populateParticipantsList(chatWithMembers.members),
      me: myMember
        ? {
            role: myMember.role,
            unreadCount: myMember.unreadCount,
          }
        : null,
    };


  emitToChatRoom(req, chatWithMembers.id, "chat:created", { chat: summary });

  res.json({ ok: true, chat: chatWithMembers });
};
