import { Request } from 'express';
import { UserRole } from '../users/user-role.enum';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type AuthenticatedRequest = Request & {
  user?: AuthUser;
};
