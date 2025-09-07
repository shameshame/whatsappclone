export type QRContextType = {
  token:string | null,
  ttl:number,
  validated:boolean,
  error:string | null;
  validate: (payload:{ sessionId:string, challenge:string, deviceInfo:any}) => Promise<Response>;
  createSessionToken : ()=>Promise<string>
  
};