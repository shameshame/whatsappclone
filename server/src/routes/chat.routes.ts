import { getChatHistory,sendMessage,getAllMyChats,deleteMessage,editMessage } from "../services/chat.service";
import { requireAuth } from "../middleware/requireAuth";
import { Router } from "express";



export const chatRouter = Router();


chatRouter.get("/:peerId/history",requireAuth,getChatHistory)
chatRouter.post("/:peerId/send",requireAuth,sendMessage)
chatRouter.get("/my-chats",requireAuth,getAllMyChats)
chatRouter.delete("/message/:messageId/delete",requireAuth,deleteMessage)
chatRouter.put("/message/:messageId/edit",requireAuth,editMessage)



