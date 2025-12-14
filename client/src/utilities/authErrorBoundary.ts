import { requiresAuth,toAppError } from "./error-utils"


type Options = {
  forceLogout: () => void;
  rethrow?: boolean;
};

function handleAuthError(
  error: unknown,
  { forceLogout, rethrow = true }: Options
): never | void {
  const appError = toAppError(error);

  if (requiresAuth(appError)) {
    forceLogout();
    return;
  }

  if (rethrow) {
    throw appError;
  }
}

export async function withAuthGuard<T>(
  fn: () => Promise<T>,
  forceLogout: () => void
): Promise<T> {
  try {
        return await fn();
    } catch (error) {
        handleAuthError(error, { forceLogout, rethrow: false });
        throw error;
    }
}
