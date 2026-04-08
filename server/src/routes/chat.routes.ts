import { getChatHistory,sendTextMessage,getAllMyChats,deleteMessage,editMessage,openOrCreateDm, reactToMessage, markChatRead, sendVoiceMessage } from "../services/chat.service";
import { requireAuth } from "../middleware/requireAuth";
import { Router } from "express";
import { upload } from "../chat/helpers";




export const chatRouter = Router();


chatRouter.get("/:chatId/history",requireAuth,getChatHistory)
chatRouter.post("/:chatId/send",requireAuth,sendTextMessage)
chatRouter.post("/dm/:peerId/open",requireAuth,openOrCreateDm)
chatRouter.post("/:chatId/messages/:messageId/react",requireAuth,reactToMessage)
chatRouter.post("/:chatId/mark-read",requireAuth,markChatRead)
chatRouter.get("/my-chats",requireAuth,getAllMyChats)
chatRouter.delete("/:chatId/messages/:messageId/delete",requireAuth,deleteMessage)
chatRouter.put("/:chatId/messages/:messageId/edit",requireAuth,editMessage)
chatRouter.post("/:chatId/send-voice", requireAuth, upload.single("audio"), sendVoiceMessage);



