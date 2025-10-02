import { Router } from "express";
import { checkIfLoggedIn,logOutHandler,mapCredentialToUserId,passkeyUsernamelessLoginOptions} from "../services/auth.service";
import { requireAuth } from "../middleware/requireAuth";


export const authRouter = Router();



authRouter.get("/session", checkIfLoggedIn);
authRouter.post("/passkey/options",passkeyUsernamelessLoginOptions)
authRouter.post("/passkey/verify",mapCredentialToUserId)
authRouter.post("/logout",requireAuth,logOutHandler)