import {generateRegistrationOptions, verifyRegistrationResponse} from "@simplewebauthn/server";
import type {RequestHandler } from "express";
import { RegPending,RegComplete } from "../types/userAndCredentialData";
import { redis } from "../redis";
import { issueAppSession, revokeSession } from "./auth.session.service";
import { setSessionCookie } from "../utils/cookies";
import { randomUUID } from "crypto";
import { stringToBytes} from "../utils/stringToBytes";
import { toB64url } from "../utils/toB64url";
import { createUserIfNotCreatedYet } from "../db/user";
import { getRpIdFromOrigin,getExpectedOrigin } from "../utils/origin";

export const  passkeyRegistrationOptions: RequestHandler = async(req,res, next)=>{
  try {
    const { displayName, handle, phone } = req.body ?? {};
    
    if (!displayName || typeof displayName !== "string") {
      return res.status(400).json({ ok: false, message: "displayName required" });
    }

    const userId = randomUUID();
    const origin = getExpectedOrigin(req);
   
    const options = await generateRegistrationOptions({
      rpID : getRpIdFromOrigin(origin),
      rpName: "Your App",
      userID: stringToBytes(userId), // simplewebauthn will encode to bytes for user.id
      userName: handle || `user-${userId.slice(0,8)}`,
      userDisplayName: displayName,
      attestationType: "none",
      // excludeCredentials: list existing passkeys for this user if you pre-created a row
    });

    // Store a pending record keyed by userId (NOT by challenge alone)
    await redis.set(
      `reg:${userId}`,
      JSON.stringify({
        expectedChallenge: options.challenge,
        displayName,
        handle: handle || null,
        phone: phone || null,
        createdAt: Date.now(),
      }),
      { EX: 600 } // 10 minutes
    );

    // You may return userId to the client; it’s just a correlation id for verify.
    res.json({ userId, options });
  } catch (err) { next(err); }
}

export const registerVerify: RequestHandler = async (req, res, next) => {
  try {
    const { userId, attResp, deviceInfo } = req.body ?? {};
    const origin = getExpectedOrigin(req);
    
    if (!userId || !attResp) return res.status(400).json({ ok: false });

    const pendingRaw = await redis.get(`reg:${userId}`);
    if (!pendingRaw) return res.status(410).json({ ok: false, message: "expired" });

    const pending = JSON.parse(pendingRaw) as RegPending;
    
    // If you captured transports on the client during registration (often you won't):
   // const transportsJson = JSON.stringify(getTransportsSomehow) // or leave undefined
   const transportsJson: string | undefined = undefined;
   
   const verification = await verifyRegistrationResponse({
      response: attResp,
      expectedChallenge:pending.expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: getRpIdFromOrigin(origin)
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(401).json({ ok: false, message: "register-verification-failed" });
    }

     const info = verification.registrationInfo;
     const { id, publicKey, counter } = info.credential;
     
     const complete: RegComplete = {
        ...pending,
        id: userId,
        credentialIdB64: toB64url(id),         
        publicKeyB64:toB64url(publicKey),      
        counter: BigInt(counter),               // number -> bigint for DB BIGINT
        transports: transportsJson,
    };

    // Upsert User (create if not pre-created)
    createUserIfNotCreatedYet(complete)
    
    // Create app session
    const sid = await issueAppSession(userId, deviceInfo);
    setSessionCookie(res, sid);

    await redis.del(`reg:${userId}`);
    res.json({ ok: true });
  } catch (err) { next(err); }
};