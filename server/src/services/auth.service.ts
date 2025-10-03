// authServices.ts

import {generateAuthenticationOptions, verifyAuthenticationResponse} from "@simplewebauthn/server";
import {getUserIdByCredentialId, updateCounter } from "../db/user"; 
import type {RequestHandler } from "express";
import { redis } from "../redis";
import { issueAppSession, revokeSession } from "./auth.session.service";
import { ctxCookieOpts, setSessionCookie } from "../utils/cookies";
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
    const requestId = crypto.randomUUID();
    await redis.set(`wa:authctx:${requestId}`, options.challenge, { EX: 90 });

    // Set requestId(key for challenge) as httpOnly cookie (don’t set domain; let browser use current host)
    res.cookie("wa_ctx", requestId, ctxCookieOpts(req));

    res.json({ options });
  } catch (err) {
    next(err); // let your error middleware handle it
  }
};

export const mapCredentialToUserId : RequestHandler = async(req, res, _next)=>{
  const { authResp } = req.body ?? {};
  const origin = getExpectedOrigin(req)
  if (!authResp) return res.status(400).json({ ok: false,code: "bad-request" });
  
  const requestId = req.cookies?.wa_ctx as string | undefined;
  if (!requestId) return res.status(400).json({ ok: false, code: "missing-request-id" });
  
  const key = `wa:authctx:${requestId}`;
  const expectedChallenge = await redis.get(key);
  if (!expectedChallenge) return res.status(410).json({ ok: false, code: "challenge-expired" });

  // consume single-use
    await redis.del(key);
    // optionally clear the cookie so it can’t be reused
    res.clearCookie("wa_ctx", ctxCookieOpts(req));
  
  // Find credential by rawId
  const credIdB64 = authResp.rawId as string;
  const cred = await getCredentialById(credIdB64); // store rawId as base64url in DB to avoid binary hassle
  if (!cred) return res.status(404).json({ ok: false,code:"unknown-credential" });
  
  const verification = await verifyAuthenticationResponse({
    response: authResp,
    expectedChallenge,
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


