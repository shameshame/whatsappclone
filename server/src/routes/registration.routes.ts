import { Router } from "express";
import { passkeyRegistrationOptions,registerVerify} from "../services/register.service";

export const registryRouter = Router();


registryRouter.post("/options",passkeyRegistrationOptions)
registryRouter.post("/verify",registerVerify)