import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { createGroup } from "../services/group.service";


export const groupRouter = Router();

groupRouter.post("/create", requireAuth, createGroup);
