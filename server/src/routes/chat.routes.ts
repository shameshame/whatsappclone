import { getChatHistory,sendMessage,getAllMyChats,deleteMessage,editMessage } from "../services/chat.service";
import { requireAuth } from "../middleware/requireAuth";
import { Router } from "express";



export const chatRouter = Router();


chatRouter.get("/:chatId/history",requireAuth,getChatHistory)
chatRouter.post("/:chatId/send",requireAuth,sendMessage)
chatRouter.get("/my-chats",requireAuth,getAllMyChats)
chatRouter.delete("/messages/:messageId/delete",requireAuth,deleteMessage)
chatRouter.put("/messages/:messageId/edit",requireAuth,editMessage)



