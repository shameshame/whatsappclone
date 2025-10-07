import { DeviceInfo } from "./device";


export type QRContextType = {
  token:string | null,
  ttl:number,
  validated:boolean,
  error:string | null;
  validate: (payload:{ sessionId:string, challenge:string, deviceInfo:DeviceInfo}) => Promise<Response>;
  createSessionToken : ()=>Promise<string>
  
};