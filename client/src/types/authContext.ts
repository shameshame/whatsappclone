import { User } from "../../../shared/types/user"


export type AuthStatus= {
   status:string,
   user:User | undefined,
   device?:string,
 

}

export type AuthContextValue = AuthStatus & {
  refresh: () => Promise<void>;
};


