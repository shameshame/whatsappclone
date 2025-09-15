import { DeviceInfo } from "./deviceInfo";

export type AuthCodePayload = {
  userId: string;
  sessionId?: string;     // pairing session you bound when creating the code
  deviceInfo?: DeviceInfo;
  issuedAt: number;
};