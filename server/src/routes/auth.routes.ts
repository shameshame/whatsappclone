import { Router } from "express";
import { checkIfLoggedIn,logOutHandler,mapCredentialToUserId,passkeyUsernamelessLoginOptions,passkeyRegistrationOptions } from "../services/auth.service";
import { requireAuth } from "../middleware/requireAuth";


export const authRouter = Router();



authRouter.get("/session", checkIfLoggedIn);
authRouter.post("passkey/registration/options")
authRouter.post("/passkey/login/options",passkeyUsernamelessLoginOptions)
authRouter.post("/passkey/login/verify",mapCredentialToUserId)
authRouter.post("/logout",requireAuth,logOutHandler)