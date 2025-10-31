import bcrypt from "bcryptjs";
import {
  InvalidCredentialsError,
  InvalidPasswordError,
  InvalidUsernameError,
  UserExistsError,
} from "@ratio1/cstore-auth-ts";
import { getAuthClient, ensureAuthInitialized } from "../auth/cstore";
import { getCStoreClient } from "../ratio1/cstore";
import type { PublicUser, UserRecord, UserRole } from "../types";
import { createSessionToken, getSessionUser } from "../auth/session";
import { USE_MOCK_RATIO1 } from "../config";

export async function authenticateUser(username: string, password: string) {
  const cstore = await getCStoreClient();

  if (USE_MOCK_RATIO1) {
    const user = await cstore.getUserByUsername(username);
    if (!user || !user.isActive || !user.passwordHash) {
      return null;
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return null;
    }
    const sessionToken = await createSessionToken(user);
    return { user, sessionToken };
  }

  const authClient = getAuthClient();
  await ensureAuthInitialized(authClient);

  try {
    const authUser = await authClient.simple.authenticate(username, password);
    let user = await cstore.getUserByUsername(authUser.username);
    if (!user) {
      try {
        user = await cstore.createUser({
          username: authUser.username,
          passwordHash: "cstore-auth-managed",
          role: authUser.role ?? "user",
        });
      } catch (error) {
        console.warn("[auth] Failed to create metadata record during authentication", error);
        user = await cstore.getUserByUsername(authUser.username);
        if (!user) {
          throw error;
        }
      }
    }
    if (!user.isActive) {
      return null;
    }
    const sessionToken = await createSessionToken(user);
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
  const cstore = await getCStoreClient();

  if (USE_MOCK_RATIO1) {
    const passwordHash = await bcrypt.hash(input.password, 12);
    return cstore.createUser({
      username: input.username,
      passwordHash,
      role: input.role,
    });
  }

  const authClient = getAuthClient();
  await ensureAuthInitialized(authClient);

  try {
    await authClient.simple.createUser(input.username, input.password, { role: input.role });
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

  return cstore.createUser({
    username: input.username,
    passwordHash: "cstore-auth-managed",
    role: input.role,
  });
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const cstore = await getCStoreClient();

  if (USE_MOCK_RATIO1) {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    return cstore.updateUserPassword({ userId, passwordHash });
  }

  throw new Error("Password resets without current password are not supported when Ratio1 auth is enabled.");
}

export async function listUsers(): Promise<PublicUser[]> {
  const cstore = await getCStoreClient();
  const users = await cstore.listUsers();

  if (!USE_MOCK_RATIO1) {
    const authClient = getAuthClient();
    await ensureAuthInitialized(authClient);
    const authUsers = await authClient.simple.getAllUsers();
    const known = new Set(users.map((user) => user.username.toLowerCase()));

    for (const authUser of authUsers) {
      const canonical = authUser.username.toLowerCase();
      if (!known.has(canonical)) {
        try {
          const created = await cstore.createUser({
            username: authUser.username,
            passwordHash: "cstore-auth-managed",
            role: authUser.role ?? "user",
          });
          users.push(created);
          known.add(canonical);
        } catch (error) {
          // If another process created the user concurrently, ignore the duplicate error.
          console.warn("[users] Failed to sync metadata for auth-managed user", error);
        }
      }
    }
  }

  return users;
}

export async function getUserById(userId: string): Promise<UserRecord | null> {
  const cstore = await getCStoreClient();
  return cstore.getUserById(userId);
}

export async function getCurrentAuthenticatedUser(): Promise<PublicUser | null> {
  const session = await getSessionUser();
  if (!session) {
    return null;
  }
  const cstore = await getCStoreClient();
  const user = await cstore.getUserById(session.sub);
  if (!user || !user.isActive) {
    return null;
  }
  return (({ passwordHash, ...rest }) => {
    void passwordHash;
    return rest;
  })(user);
}
