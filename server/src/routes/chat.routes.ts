import { getChatHistory,createMessage } from "../services/chat.service";
import { requireAuth } from "../middleware/requireAuth";
import { Router } from "express";



export const chatRouter = Router();


chatRouter.get("/:peerId/history",requireAuth,getChatHistory)
chatRouter.post("/:peerId/send",requireAuth,createMessage)



