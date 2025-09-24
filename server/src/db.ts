// server/src/db.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Return the full credential row (or null) for a WebAuthn credential id.
 * We store credentialId/publicKey as base64url strings to avoid binary hassles.
 */
export function getCredentialById(credentialIdB64: string) {
  return prisma.credential.findUnique({
    where: { credentialIdB64 },
  });
}

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
