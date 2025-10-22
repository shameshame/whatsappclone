import { DeviceInfo } from "./device";
import { SessionTuple } from "./sessionTuple";


export type QRContextType = {
  session:SessionTuple | null
  validated:boolean,
  error:string | null;
  validate: (payload:{ sessionId:string, challenge:string, deviceInfo:DeviceInfo}) => Promise<Response>;
  createSessionToken : ()=>Promise<SessionTuple | null>
  
};