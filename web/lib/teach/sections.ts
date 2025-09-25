import {internalFetch} from '@/lib/server/internal-api';
import {normaliseSections} from '@/lib/teach/normalise';
import type {InstructorSection} from '@/types/teach';

export async function fetchInstructorSections(): Promise<{
  sections: InstructorSection[];
  status?: number;
  error?: string;
}> {
  try {
    const response = await internalFetch('/api/teach/sections', { method: 'GET' });
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      if (isJson) {
        const body = await response.json().catch(() => ({}));
        const message = typeof body?.message === 'string' ? body.message : 'Unable to load sections';
        return { sections: [], status: response.status, error: message };
      }

      return { sections: [], status: response.status, error: 'Unable to load sections' };
    }

    if (!isJson) {
      return { sections: [], status: response.status, error: 'Sections response was not JSON' };
    }

    const data = await response.json();
    const sections = normaliseSections(data);
    return { sections, status: response.status };
  } catch (error) {
    return { sections: [], error: error instanceof Error ? error.message : 'Unable to load sections' };
  }
}
