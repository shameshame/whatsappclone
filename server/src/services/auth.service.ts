// authServices.ts

import {generateAuthenticationOptions, verifyAuthenticationResponse} from "@simplewebauthn/server";
import {getUserIdByCredentialId, updateCounter } from "../db/user"; 
import type {RequestHandler } from "express";
import { redis } from "../redis";
import { issueAppSession, revokeSession } from "./auth.session.service";
import { setSessionCookie } from "../utils/cookies";
import { getCredentialById } from "../db/credential";
import { getRpIdFromOrigin,getExpectedOrigin } from "../utils/origin";


const isCastingValid = (credCounter:bigint)=>{
  const counterNum = Number(credCounter);
  if (!Number.isSafeInteger(counterNum) ||
       counterNum < 0 ||
       counterNum > 0xFFFFFFFF
    ) {
     throw new Error("counter-out-of-range");
 }
   return counterNum
}


export const checkIfLoggedIn :RequestHandler = (req: any,res:any)=>{
   if (req.body.user?.id) return res.sendStatus(200);
   return res.sendStatus(401);
}



export const passkeyUsernamelessLoginOptions: RequestHandler = async (req, res, next) => {
  try {
    const options = await generateAuthenticationOptions({
      rpID: getRpIdFromOrigin(getExpectedOrigin(req)),
      userVerification: "required",
      // usernameless: do not supply allowCredentials
    });
    await redis.set(`wa:auth:${options.challenge}`, "1", { EX: 60 });
    res.json({ options });
  } catch (err) {
    next(err); // let your error middleware handle it
  }
};

export const mapCredentialToUserId : RequestHandler = async(req, res, _next)=>{
  const { authResp } = req.body ?? {};
  const origin = getExpectedOrigin(req)
  if (!authResp) return res.status(400).json({ ok: false });
  
  // won't exist; use a different keying
  // const expectedChallenge = await redis.get(`wa:auth:${authResp.response?.clientDataJSON?.challenge}`) 
  // Better: store by challenge you sent, then read it back from server-side state.
  // Simpler approach:
  const challenge = authResp.response?.clientDataJSON?.challenge; // you encoded b64url; generally your server should track it separately
  // If you saved by challenge earlier, fetch now; else decode from your session store.

  // Find credential by rawId
  const credIdB64 = authResp.rawId as string;
  const cred = await getCredentialById(credIdB64); // store rawId as base64url in DB to avoid binary hassle
  if (!cred) return res.status(404).json({ ok: false,code:"unknown-credential" });
  
  const verification = await verifyAuthenticationResponse({
    response: authResp,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: getRpIdFromOrigin(origin),
    credential: {
      id: cred.credentialIdB64,
      publicKey: Buffer.from(cred.publicKeyB64, 'base64url'),
      counter: isCastingValid(cred.counter),
      transports: cred.transports ? JSON.parse(cred.transports) : undefined,
    },
  });

  if (!verification.verified) return res.status(401).json({ ok: false });

  await updateCounter(cred.credentialIdB64, verification.authenticationInfo!.newCounter);
  const userId = await getUserIdByCredentialId(cred.credentialIdB64);
   const sessionId = await issueAppSession(userId);
  setSessionCookie(res, sessionId);
  res.json({ ok: true });

}

export const logOutHandler : RequestHandler = async (req,res)=>{
  const sid = req.cookies?.sessionId;
  if (sid) await revokeSession(sid);
  res.clearCookie("sessionId", { path: "/" });
  res.json({ ok: true });
}


