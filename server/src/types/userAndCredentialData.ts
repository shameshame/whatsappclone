export type RegPending={
      id?:string,
      expectedChallenge: string,
      displayName: string,
      handle?: string | null,
      phone?: string | null,
      

}

export type RegComplete = RegPending & {
  id: string;                 // userId
  credentialIdB64: string;
  publicKeyB64: string;
  counter: bigint;            // <- use bigint
  transports?: string;        // JSON string if you capture transports
};