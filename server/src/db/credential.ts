import { Prisma, PrismaClient } from "@prisma/client";

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