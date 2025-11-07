// auth/shared.ts
import { getSession} from "../services/auth.session.service";

export type AuthContext = { userId: string; device?: any };

export async function authFromSid(sid: string): Promise<AuthContext | null> {
  const sess = await getSession(sid);
  if (!sess) return null;
  
  return { userId: sess.userId, device: sess.device };
}
