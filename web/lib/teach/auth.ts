import {internalFetch} from '@/lib/server/internal-api';
import type {CurrentUserResponse} from '@/types/api';

export async function fetchCurrentInstructor(): Promise<{
  user: CurrentUserResponse | null;
  status?: number;
  error?: string;
}> {
  try {
    const response = await internalFetch('/api/auth/me', { method: 'GET' });
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      if (isJson) {
        await response.json().catch(() => ({}));
      }

      return { user: null, status: response.status, error: 'Unable to load current user' };
    }

    if (!isJson) {
      return { user: null, status: response.status, error: 'User response was not JSON' };
    }

    const data = (await response.json()) as CurrentUserResponse;
    return { user: data, status: response.status };
  } catch (error) {
    return { user: null, error: error instanceof Error ? error.message : 'Unable to load current user' };
  }
}

export function hasInstructorAccess(user: CurrentUserResponse | null): boolean {
  if (!user?.roles?.length) {
    return false;
  }

  return user.roles.some((role) => {
    const lower = role.toLowerCase();
    return lower === 'instructor' || lower === 'admin';
  });
}
