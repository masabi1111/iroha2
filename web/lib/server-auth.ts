import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';

export type Session = {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
};

export function getSession(options?: {required?: boolean}): Session {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('accessToken')?.value ?? null;
  const refreshToken = cookieStore.get('refreshToken')?.value ?? null;

  if (!accessToken && options?.required) {
    redirect('/auth/login');
  }

  return {
    accessToken,
    refreshToken,
    isAuthenticated: Boolean(accessToken)
  };
}
