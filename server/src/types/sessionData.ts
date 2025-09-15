import { DeviceInfo } from "./deviceInfo";

export type SessionData = {
  userId: string;
  device?: DeviceInfo;
  createdAt: number;
  lastSeen: number;
};