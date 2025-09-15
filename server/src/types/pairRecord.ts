export type PairRecord = {
  validated: "0" | "1";      // kept for back-compat
  status: "pending" | "approved" | "used";
  socketId?: string;
  challenge: string;
  createdAt: string;         // Date.now().toString()
};