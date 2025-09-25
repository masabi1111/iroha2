export interface InstructorSection {
  id: string;
  title?: string | null;
  courseTitle?: string | null;
  courseCode?: string | null;
  weekday?: number | null;
  startTime?: string | null;
  endTime?: string | null;
}

export interface RosterEntry {
  enrollmentId?: string | null;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  email?: string | null;
}
