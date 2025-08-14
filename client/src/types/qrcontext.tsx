export type QRContextType = {
  token:string | null,
  validated:boolean,
  error:string | null;
  validate: (scanned: string) => Promise<boolean>;
  
};