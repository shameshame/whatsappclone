export type QRContextType = {
  token:string | null,
  ttl:number,
  validated:boolean,
  error:string | null;
  validate: (scanned: string) => Promise<boolean>;
  createSessionToken : ()=>Promise<string>
  
};