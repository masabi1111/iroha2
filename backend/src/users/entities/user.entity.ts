import { UserRole } from '../../common/enums/user-role.enum';

export interface UserEntity {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  passwordHash?: string;
  roles: UserRole[];
}
