import {InstructorSection, RosterEntry} from '@/types/teach';

function toArray(payload: unknown): any[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const data = (payload as any).data;
    const items = (payload as any).items;

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(items)) {
      return items;
    }
  }

  return [];
}

function toNullableNumber(value: unknown): number | null {
  if (value == null) {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function toStringOrNull(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  return String(value);
}

function toInstructorSection(raw: any): InstructorSection | null {
  if (!raw) {
    return null;
  }

  const id = raw.id ?? raw.section_id ?? raw.sectionId;
  if (!id) {
    return null;
  }

  return {
    id: String(id),
    title: raw.title ?? raw.name ?? null,
    courseTitle: raw.course?.title ?? raw.courseTitle ?? raw.course_name ?? null,
    courseCode: raw.course?.code ?? raw.courseCode ?? raw.course_code ?? null,
    weekday: toNullableNumber(raw.weekday ?? raw.day_of_week ?? raw.dayOfWeek ?? raw.day ?? null),
    startTime: raw.start_time ?? raw.startTime ?? raw.start ?? null,
    endTime: raw.end_time ?? raw.endTime ?? raw.end ?? null
  };
}

function toRosterEntry(raw: any): RosterEntry | null {
  if (!raw) {
    return null;
  }

  const user = raw.user ?? raw.student ?? {};
  const userId =
    user.id ??
    user.userId ??
    user.user_id ??
    raw.userId ??
    raw.user_id ??
    raw.studentId ??
    raw.student_id;

  if (!userId) {
    return null;
  }

  return {
    enrollmentId: toStringOrNull(raw.id ?? raw.enrollmentId ?? raw.enrollment_id ?? null),
    userId: String(userId),
    firstName: user.firstName ?? user.first_name ?? raw.firstName ?? raw.first_name ?? null,
    lastName: user.lastName ?? user.last_name ?? raw.lastName ?? raw.last_name ?? null,
    displayName: user.displayName ?? user.display_name ?? raw.displayName ?? raw.display_name ?? null,
    email: user.email ?? raw.email ?? null
  };
}

export function normaliseSections(payload: unknown): InstructorSection[] {
  return toArray(payload)
    .map((item) => toInstructorSection(item))
    .filter((section): section is InstructorSection => Boolean(section));
}

export function normaliseRoster(payload: unknown): RosterEntry[] {
  return toArray(payload)
    .map((item) => toRosterEntry(item))
    .filter((entry): entry is RosterEntry => Boolean(entry));
}
