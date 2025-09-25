import Link from 'next/link';
import {redirect} from 'next/navigation';

import {SectionTabs} from '@/components/teach/section-tabs';
import {fetchCurrentInstructor, hasInstructorAccess} from '@/lib/teach/auth';
import {normaliseRoster} from '@/lib/teach/normalise';
import {fetchInstructorSections} from '@/lib/teach/sections';
import type {InstructorSection, RosterEntry} from '@/types/teach';
import {internalFetch} from '@/lib/server/internal-api';

export const dynamic = 'force-dynamic';

interface SectionDetailPageProps {
  params: { id: string };
}

function formatWeekday(weekday?: number | null): string | null {
  if (weekday == null) {
    return null;
  }

  const parsed = Number(weekday);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (parsed >= 0 && parsed <= 6) {
    return labels[parsed];
  }

  if (parsed >= 1 && parsed <= 7) {
    return labels[(parsed - 1) % 7];
  }

  const normalised = ((parsed % 7) + 7) % 7;
  return labels[normalised];
}

function formatTime(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const dateValue = value.includes('T') ? value : `1970-01-01T${value}`;

  try {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
  } catch {
    return value;
  }
}

function describeSection(section: InstructorSection | null | undefined): string | null {
  if (!section) {
    return null;
  }

  const weekday = formatWeekday(section.weekday);
  const start = formatTime(section.startTime);
  const end = formatTime(section.endTime);

  if (weekday && start && end) {
    return `${weekday} · ${start} – ${end}`;
  }

  if (weekday && start) {
    return `${weekday} · ${start}`;
  }

  if (weekday) {
    return weekday;
  }

  if (start && end) {
    return `${start} – ${end}`;
  }

  return null;
}

async function fetchRoster(sectionId: string): Promise<{
  roster: RosterEntry[];
  status?: number;
  error?: string;
}> {
  try {
    const response = await internalFetch(`/api/teach/roster/${encodeURIComponent(sectionId)}`, { method: 'GET' });
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      if (isJson) {
        const body = await response.json().catch(() => ({}));
        const message = typeof body?.message === 'string' ? body.message : 'Unable to load roster';
        return { roster: [], status: response.status, error: message };
      }

      return { roster: [], status: response.status, error: 'Unable to load roster' };
    }

    if (!isJson) {
      return { roster: [], status: response.status, error: 'Roster response was not JSON' };
    }

    const data = await response.json();
    const roster = normaliseRoster(data);
    return { roster, status: response.status };
  } catch (error) {
    return { roster: [], error: error instanceof Error ? error.message : 'Unable to load roster' };
  }
}

export default async function SectionDetailPage({ params }: SectionDetailPageProps) {
  const sectionId = params.id;
  const { user, status: userStatus } = await fetchCurrentInstructor();

  if (userStatus === 401 || (!user && userStatus == null)) {
    redirect('/auth/login');
  }

  if (!user) {
    return (
      <section className="card" style={{ gap: '0.75rem' }}>
        <h1 style={{ margin: 0 }}>Section management</h1>
        <div className="error-state" style={{ textAlign: 'left' }}>
          We could not verify your account. Please try again later.
        </div>
      </section>
    );
  }

  if (!hasInstructorAccess(user)) {
    return (
      <section className="card" style={{ gap: '0.75rem' }}>
        <h1 style={{ margin: 0 }}>Section management</h1>
        <div className="error-state" style={{ textAlign: 'left' }}>
          You don't have access to this section.
        </div>
      </section>
    );
  }

  const [sectionsResult, rosterResult] = await Promise.all([fetchInstructorSections(), fetchRoster(sectionId)]);
  const section = sectionsResult.sections.find((item) => item.id === sectionId) ?? null;
  const heading = section?.title ?? section?.courseTitle ?? section?.courseCode ?? `Section ${sectionId}`;
  const scheduleDescription = describeSection(section);

  const rosterErrorMessage =
    rosterResult.status === 403 ? "You don't have access to this section." : rosterResult.error ?? null;

  const backendAvailable = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL);
  const attendanceDisabled = !backendAvailable || rosterResult.status === 403;
  const lessonDisabled = !backendAvailable;
  const quizDisabled = !backendAvailable;

  const defaultDate = new Date().toISOString().slice(0, 10);

  return (
    <section className="card" style={{ gap: '1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Link href="/teach" className="nav-link" style={{ fontSize: '0.95rem' }}>
          ← Back to sections
        </Link>
        <h1 style={{ margin: 0 }}>{heading}</h1>
        {section?.courseTitle && section.courseTitle !== heading ? (
          <p style={{ margin: 0, color: '#6b7280' }}>{section.courseTitle}</p>
        ) : null}
        {scheduleDescription ? (
          <p style={{ margin: 0, color: '#4b5563' }}>{scheduleDescription}</p>
        ) : null}
        {sectionsResult.error ? (
          <p style={{ margin: 0, color: '#b91c1c' }}>{sectionsResult.error}</p>
        ) : null}
        {!backendAvailable ? (
          <p style={{ margin: 0, color: '#b45309' }}>
            API connectivity is not configured yet. Actions are temporarily read-only.
          </p>
        ) : null}
      </div>

      <SectionTabs
        sectionId={sectionId}
        roster={{
          students: rosterResult.roster,
          defaultDate,
          disabled: attendanceDisabled,
          disabledReason: !backendAvailable
            ? 'Attendance service is not available yet.'
            : rosterResult.status === 403
              ? "You don't have access to this section."
              : undefined,
          errorMessage: rosterErrorMessage
        }}
        lessonForm={{
          disabled: lessonDisabled,
          disabledReason: !backendAvailable ? 'Lesson endpoints are not available yet.' : undefined
        }}
        quizForm={{
          disabled: quizDisabled,
          disabledReason: !backendAvailable ? 'Quiz endpoints are not available yet.' : undefined
        }}
      />
    </section>
  );
}
