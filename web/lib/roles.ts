import {redirect} from 'next/navigation';

import type {CurrentUserResponse} from '@/types/api';
import {internalFetch} from '@/lib/server/internal';

type RequireRoleOptions = {
  redirectTo?: string;
  fallback?: () => never | Promise<never>;
};

export async function requireRole(role: string, options?: RequireRoleOptions): Promise<CurrentUserResponse> {
  const response = await internalFetch('/api/auth/me', { method: 'GET' });

  if (!response.ok) {
    if (options?.fallback) {
      await options.fallback();
    }

    redirect(options?.redirectTo ?? '/auth/login');
  }

  let user: CurrentUserResponse | null = null;

  try {
    user = (await response.json()) as CurrentUserResponse;
  } catch (error) {
    user = null;
  }

  if (!user || !Array.isArray(user.roles) || !user.roles.includes(role)) {
    if (options?.fallback) {
      await options.fallback();
    }

    redirect(options?.redirectTo ?? '/auth/login');
  }

  return user;
}
