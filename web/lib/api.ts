const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

export type ApiError = {
  message: string;
  status?: number;
};

export interface Season {
  id: string;
  code: string;
  title: string;
  startDate: string;
  endDate: string;
  enrollmentOpen?: string;
  enrollmentClose?: string;
  status?: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  level?: string;
  description?: string | null;
  priceCents?: number;
  currency?: string;
  seatsLeft?: number | null;
  seasonCode?: string;
}

export interface SectionInstructor {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
}

export interface Section {
  id: string;
  title?: string | null;
  weekday?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  instructor?: SectionInstructor | null;
}

type ListPayload<T> = T[] | { data?: T[]; items?: T[]; meta?: PaginationMeta };

export interface PaginationMeta {
  page?: number;
  size?: number;
  total?: number;
  pageCount?: number;
}

export interface PagedResult<T> {
  items: T[];
  meta: Required<PaginationMeta>;
  error?: ApiError;
}

const defaultMeta: Required<PaginationMeta> = {
  page: 1,
  size: 20,
  total: 0,
  pageCount: 0
};

function normaliseListResponse<T>(payload: ListPayload<T>): { items: T[]; meta: PaginationMeta } {
  if (Array.isArray(payload)) {
    return { items: payload, meta: {} };
  }

  if (payload?.data && Array.isArray(payload.data)) {
    return { items: payload.data, meta: payload.meta ?? {} };
  }

  if (payload?.items && Array.isArray(payload.items)) {
    return { items: payload.items, meta: payload.meta ?? {} };
  }

  return { items: [], meta: {} };
}

function toSeason(raw: any): Season | null {
  if (!raw) return null;

  const id = raw.id ?? raw.season_id ?? raw.seasonId;
  const code = raw.code;
  const title = raw.title;

  if (!code || !title) {
    return null;
  }

  return {
    id: String(id ?? code),
    code,
    title,
    startDate: raw.start_date ?? raw.startDate ?? '',
    endDate: raw.end_date ?? raw.endDate ?? '',
    enrollmentOpen: raw.enrollment_open ?? raw.enrollmentOpen ?? undefined,
    enrollmentClose: raw.enrollment_close ?? raw.enrollmentClose ?? undefined,
    status: raw.status ?? raw.state ?? undefined
  };
}

function toCourse(raw: any): Course | null {
  if (!raw) return null;

  const id = raw.id ?? raw.course_id ?? raw.courseId;
  const code = raw.code;
  const title = raw.title;

  if (!id || !code || !title) {
    return null;
  }

  return {
    id: String(id),
    code,
    title,
    level: raw.level ?? raw.course_level ?? raw.courseLevel ?? undefined,
    description: raw.description ?? null,
    priceCents: raw.price_cents ?? raw.priceCents ?? undefined,
    currency: raw.currency ?? undefined,
    seatsLeft: raw.seats_left ?? raw.seatsLeft ?? undefined,
    seasonCode: raw.season?.code ?? raw.seasonCode ?? undefined
  };
}

function toInstructor(raw: any): SectionInstructor | null {
  if (!raw) return null;
  const id = raw.id ?? raw.instructor_id ?? raw.instructorId;
  if (!id) return null;

  return {
    id: String(id),
    firstName: raw.first_name ?? raw.firstName ?? null,
    lastName: raw.last_name ?? raw.lastName ?? null,
    displayName: raw.display_name ?? raw.displayName ?? null
  };
}

function toSection(raw: any): Section | null {
  if (!raw) return null;
  const id = raw.id ?? raw.section_id ?? raw.sectionId;
  if (!id) return null;

  return {
    id: String(id),
    title: raw.title ?? null,
    weekday: raw.weekday ?? null,
    startTime: raw.start_time ?? raw.startTime ?? null,
    endTime: raw.end_time ?? raw.endTime ?? null,
    startDate: raw.start_date ?? raw.startDate ?? null,
    endDate: raw.end_date ?? raw.endDate ?? null,
    instructor: toInstructor(raw.instructor ?? raw.teacher ?? null)
  };
}

async function request<T>(endpoint: string, init?: RequestInit): Promise<{ data: T | null; error?: ApiError }> {
  if (!API_BASE_URL) {
    return {
      data: null,
      error: {
        message: 'API base URL is not configured'
      }
    };
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {})
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return {
        data: null,
        error: {
          message: `Request failed with status ${response.status}`,
          status: response.status
        }
      };
    }

    const data = (await response.json()) as T;
    return { data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      data: null,
      error: {
        message
      }
    };
  }
}

export async function fetchSeasons(): Promise<{ seasons: Season[]; error?: ApiError }> {
  const { data, error } = await request<ListPayload<unknown>>(`/seasons?status=enrolling,running`);

  if (error) {
    return { seasons: [], error };
  }

  const { items } = normaliseListResponse(data ?? []);
  const seasons = items
    .map((item) => toSeason(item))
    .filter((season): season is Season => Boolean(season));

  return { seasons };
}

export async function fetchSeasonByCode(code: string): Promise<{ season: Season | null; error?: ApiError }> {
  if (!code) {
    return { season: null, error: { message: 'Missing season code' } };
  }

  const { data, error } = await request<any>(`/seasons/${encodeURIComponent(code)}`);

  if (error) {
    return { season: null, error };
  }

  const season = toSeason(data);
  return { season: season ?? null };
}

export async function fetchCoursesBySeason({
  code,
  page,
  size
}: {
  code: string;
  page?: number;
  size?: number;
}): Promise<PagedResult<Course>> {
  if (!code) {
    return {
      items: [],
      meta: defaultMeta,
      error: { message: 'Missing season code' }
    };
  }

  const search = new URLSearchParams({
    season: code,
    published: 'true'
  });

  if (page && Number.isFinite(page)) {
    search.set('page', String(page));
  }

  if (size && Number.isFinite(size)) {
    search.set('size', String(size));
  }

  const { data, error } = await request<ListPayload<unknown>>(`/courses?${search.toString()}`);

  const { items, meta } = normaliseListResponse(data ?? []);
  const courses = items
    .map((item) => toCourse(item))
    .filter((course): course is Course => Boolean(course));

  return {
    items: courses,
    meta: {
      page: meta.page ?? page ?? defaultMeta.page,
      size: meta.size ?? size ?? defaultMeta.size,
      total: meta.total ?? courses.length,
      pageCount: meta.pageCount ?? (meta.total && meta.size ? Math.ceil(meta.total / meta.size) : courses.length ? 1 : 0)
    },
    error
  };
}

export async function fetchCourseById(id: string): Promise<{ course: Course | null; error?: ApiError }> {
  if (!id) {
    return { course: null, error: { message: 'Missing course id' } };
  }

  const { data, error } = await request<any>(`/courses/${encodeURIComponent(id)}`);

  if (error) {
    return { course: null, error };
  }

  return {
    course: toCourse(data)
  };
}

export async function fetchSectionsByCourse(courseId: string): Promise<{ sections: Section[]; error?: ApiError }> {
  if (!courseId) {
    return { sections: [], error: { message: 'Missing course id' } };
  }

  const search = new URLSearchParams({ courseId });
  const { data, error } = await request<ListPayload<unknown>>(`/sections?${search.toString()}`);

  if (error) {
    return { sections: [], error };
  }

  const { items } = normaliseListResponse(data ?? []);
  const sections = items
    .map((item) => toSection(item))
    .filter((section): section is Section => Boolean(section));

  return { sections };
}
