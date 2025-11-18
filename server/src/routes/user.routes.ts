import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { getAllUsers } from "../services/user.service";



export const userRouter = Router();

userRouter.get("/", requireAuth, getAllUsers);
