// server/src/db.ts
import { Prisma, PrismaClient, User } from "@prisma/client";
import { RegComplete, RegPending } from "../types/userAndCredentialData";
import { randomUUID } from "crypto";


const prisma = new PrismaClient();



/**
 * Return the userId that owns this credential (or null if not found).
 * Useful when doing usernameless passkey auth: credential → user.
 */
export async function getUserIdByCredentialId(credentialIdB64: string) : Promise<string> {
  const row = await prisma.credential.findUnique({
    where: { credentialIdB64 },
    select: { userId: true },
  });
  
  if (!row) throw new Error("credential-not-found");
  return row?.userId ?? null;
}

/**
 * Update the stored WebAuthn sign-in counter.
 * We only bump it forward (never decrement), protecting against races.
 */
export async function updateCounter(
  credentialIdB64: string,
  newCounter: number | bigint
) {
  const next = BigInt(newCounter);

  // Only update if the new value is greater than the stored one
  const { count } = await prisma.credential.updateMany({
    where: {
      credentialIdB64,
      // @ts-ignore Prisma supports BigInt with native PG bigint
      counter: { lt: next },
    },
    data: { counter: next },
  });

  // If nothing updated (count === 0), fetch current row for callers that expect data back
  if (count === 0) {
    return prisma.credential.findUnique({ where: { credentialIdB64 } });
  }
  return prisma.credential.findUnique({ where: { credentialIdB64 } });
}


export async function createUserIfNotCreatedYet(complete:RegComplete) :Promise<User>{
  
 const user= await prisma.$transaction(async (tx:Prisma.TransactionClient) => {
     const createdOrExisting= await tx.user.upsert({
        where: { id: complete.id },
        create: {
          id: complete.id, // ok to provide even though model has @default(uuid())
          displayName: complete.displayName,
          handle: complete.handle ?? null,       // unique; may throw if taken
          phoneE164: complete.phone ?? null,
          // phoneVerified stays default=false
        },
        update:{}
      });
      
      // Save Credential
    await tx.credential.create({
      data: {
        credentialIdB64: complete.credentialIdB64,
        userId: complete.id,
        publicKeyB64: complete.publicKeyB64,
        counter: complete.counter,
        transports: complete.transports
      },
    });
    return createdOrExisting;
    
  })

  return user;
}
