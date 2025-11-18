import { User } from "./user"


export type AuthStatus= {
   status:string,
   user:User | undefined,
   device?:string

}


