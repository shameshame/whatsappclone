export const stringToBytes = (id: string): Uint8Array => {
    const bytes = new TextEncoder().encode(id);
  if (bytes.length > 64) throw new Error("userID too long");
  return bytes;
};