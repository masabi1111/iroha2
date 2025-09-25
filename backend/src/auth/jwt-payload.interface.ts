import { UserRole } from '../common/enums/user-role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: UserRole[];
  tokenType: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}
