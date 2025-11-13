import {
  InvalidCredentialsError,
  InvalidPasswordError,
  InvalidUsernameError,
  UserExistsError,
  type PublicUser,
  createPasswordHasher,
} from "@ratio1/cstore-auth-ts";
import { getAuthClient, ensureAuthInitialized } from "../auth/cstore";
import type { UserRole } from "../types";
import { createSessionToken, getSessionUser } from "../auth/session";
import { config } from "../config";

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

export async function resetUserPassword(username: string, newPassword: string) {
  const authClient = getAuthClient();
  await ensureAuthInitialized(authClient);

  try {
    // Validate the new password
    if (!newPassword || newPassword.length < 8) {
      throw new InvalidPasswordError("Password must be at least 8 characters long");
    }

    // Get the user first to verify they exist and get their current data
    const user = await authClient.simple.getUser(username);
    if (!user) {
      throw new Error("User not found");
    }

    // Access the internal CStore client to update the password directly
    // This requires accessing private members, so we use type assertion
    const client = (authClient as any).client;
    const secret = config.auth.cstore.secret || "";

    if (!secret) {
      throw new Error("Auth secret not configured");
    }

    // Hash the new password
    const hasher = createPasswordHasher();
    const passwordRecord = await hasher.hashPassword(newPassword, secret);

    // Get the current user record from CStore
    const userKey = `user:${username}`;
    const currentRecord = await client.get(userKey);

    if (!currentRecord) {
      throw new Error("User record not found in CStore");
    }

    // Parse and update the user record with the new password
    const userRecord = JSON.parse(currentRecord);
    userRecord.password = passwordRecord;
    userRecord.updatedAt = new Date().toISOString();

    // Write the updated record back to CStore
    await client.put(userKey, JSON.stringify(userRecord));

    return { success: true };
  } catch (error) {
    if (error instanceof InvalidUsernameError || error instanceof InvalidPasswordError) {
      throw error;
    }
    console.error("Error resetting password:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to reset password");
  }
}
