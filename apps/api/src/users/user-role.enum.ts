export enum UserRole {
  User = 'user',
  Admin = 'admin',
  RootAdmin = 'root_admin',
}

export function isPlatformAdmin(role: UserRole) {
  return role === UserRole.Admin || role === UserRole.RootAdmin;
}
