export interface CaseAccessUser {
  username: string;
  role: string;
}

export interface OwnedCaseRecord {
  username: string;
}

export function canAccessCase(user: CaseAccessUser, record: OwnedCaseRecord): boolean {
  return user.role === "admin" || record.username === user.username;
}

export function filterCasesForUser<T extends OwnedCaseRecord>(
  user: CaseAccessUser,
  records: T[]
): T[] {
  return user.role === "admin" ? records : records.filter((record) => canAccessCase(user, record));
}
