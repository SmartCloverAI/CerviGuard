import {
  InvalidCredentialsError,
  InvalidPasswordError,
  InvalidUsernameError,
  UserExistsError,
  type PublicUser,
} from "@ratio1/cstore-auth-ts";
import { getAuthClient, ensureAuthInitialized } from "../auth/cstore";
import type { UserRole } from "../types";
import { createSessionToken, getSessionUser } from "../auth/session";

export async function authenticateUser(username: string, password: string) {
  const authClient = getAuthClient();
  await ensureAuthInitialized(authClient);

  try {
    const user = await authClient.simple.authenticate<{ isActive?: boolean }>(username, password);

    // Check if user is active (default to true if not set)
    const isActive = user.metadata?.isActive ?? true;
    if (!isActive) {
      return null;
    }

    const sessionToken = await createSessionToken({
      sub: user.username,
      role: user.role as UserRole,
    });

    return { user, sessionToken };
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return null;
    }
    throw error;
  }
}

export async function createUserAccount(input: {
  username: string;
  password: string;
  role: UserRole;
}) {
  const authClient = getAuthClient();
  await ensureAuthInitialized(authClient);

  try {
    const user = await authClient.simple.createUser(input.username, input.password, {
      role: input.role,
      metadata: { isActive: true },
    });
    return user;
  } catch (error) {
    if (
      error instanceof InvalidUsernameError ||
      error instanceof InvalidPasswordError ||
      error instanceof UserExistsError
    ) {
      throw new Error(error.message);
    }
    throw error;
  }
}

export async function changeUserPassword(username: string, currentPassword: string, newPassword: string) {
  const authClient = getAuthClient();
  await ensureAuthInitialized(authClient);

  await authClient.simple.changePassword(username, currentPassword, newPassword);
}

export async function listUsers(): Promise<PublicUser<{ isActive?: boolean }>[]> {
  const authClient = getAuthClient();
  await ensureAuthInitialized(authClient);

  const users = await authClient.simple.getAllUsers<{ isActive?: boolean }>();
  return users;
}

export async function getUserByUsername(username: string): Promise<PublicUser<{ isActive?: boolean }> | null> {
  const authClient = getAuthClient();
  await ensureAuthInitialized(authClient);

  const user = await authClient.simple.getUser<{ isActive?: boolean }>(username);
  return user;
}

export async function updateUser(
  username: string,
  updates: {
    metadata?: { isActive?: boolean; [key: string]: unknown };
    role?: UserRole;
  }
) {
  const authClient = getAuthClient();
  await ensureAuthInitialized(authClient);

  const user = await authClient.simple.updateUser(username, updates);
  return user;
}

export async function getCurrentAuthenticatedUser(): Promise<PublicUser<{ isActive?: boolean }> | null> {
  const session = await getSessionUser();
  if (!session) {
    return null;
  }

  const user = await getUserByUsername(session.sub);
  if (!user || user.metadata?.isActive === false) {
    return null;
  }

  return user;
}
