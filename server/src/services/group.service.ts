// POST /api/groups

import { RequestHandler } from "express";
import { PrismaClient} from "@prisma/client";
import { emitToChatRoom,toChatSummary } from "../chat/helpers";
import { upsertGroupChat } from "../db/chat/chat";

export const prisma = new PrismaClient();


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
  const groupChat = await upsertGroupChat(members, me, trimmedName);

  if (!groupChat) return res.status(500).json({ ok: false, message: "group-creation-failed" });
  
 
  
  const summary=toChatSummary(groupChat, me);


  emitToChatRoom(req, groupChat.id, "chat:created", { chat: summary });

  res.json({ ok: true, chat: summary });
};
