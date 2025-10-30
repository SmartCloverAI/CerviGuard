import bcrypt from "bcryptjs";
import { getCStoreClient } from "../ratio1/cstore";
import type { PublicUser, UserRecord, UserRole } from "../types";
import { createSessionToken, getSessionUser } from "../auth/session";

export async function authenticateUser(username: string, password: string) {
  const cstore = await getCStoreClient();
  const user = await cstore.getUserByUsername(username);
  if (!user || !user.isActive) {
    return null;
  }
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return null;
  }
  const sessionToken = await createSessionToken(user);
  return { user, sessionToken };
}

export async function createUserAccount(input: {
  username: string;
  password: string;
  role: UserRole;
}) {
  const cstore = await getCStoreClient();
  const passwordHash = await bcrypt.hash(input.password, 12);
  return cstore.createUser({
    username: input.username,
    passwordHash,
    role: input.role,
  });
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const cstore = await getCStoreClient();
  const passwordHash = await bcrypt.hash(newPassword, 12);
  return cstore.updateUserPassword({ userId, passwordHash });
}

export async function listUsers(): Promise<PublicUser[]> {
  const cstore = await getCStoreClient();
  return cstore.listUsers();
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
