import Link from 'next/link';

import type {InstructorSection} from '@/types/teach';

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatWeekday(weekday?: number | null): string | null {
  if (weekday == null) {
    return null;
  }

  const parsed = Number(weekday);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  if (parsed >= 0 && parsed <= 6) {
    return WEEKDAY_LABELS[parsed];
  }

  if (parsed >= 1 && parsed <= 7) {
    return WEEKDAY_LABELS[(parsed - 1) % 7];
  }

  const normalised = ((parsed % 7) + 7) % 7;
  return WEEKDAY_LABELS[normalised];
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

function formatSchedule(section: InstructorSection): string {
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

  return 'Schedule to be announced';
}

interface SectionListProps {
  sections: InstructorSection[];
  emptyMessage?: string;
}

export function SectionList({sections, emptyMessage = 'No sections assigned yet.'}: SectionListProps) {
  if (!sections.length) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <div className="card-grid">
      {sections.map((section) => {
        const schedule = formatSchedule(section);
        const heading = section.title ?? section.courseTitle ?? section.courseCode ?? `Section ${section.id}`;

        return (
          <Link
            key={section.id}
            href={`/teach/sections/${encodeURIComponent(section.id)}`}
            className="card"
            style={{ gap: '0.5rem' }}
          >
            <h2 style={{ margin: 0 }}>{heading}</h2>
            {section.courseTitle && section.courseTitle !== heading ? (
              <p style={{ margin: 0, color: '#6b7280' }}>{section.courseTitle}</p>
            ) : null}
            {section.courseCode ? (
              <span className="badge">{section.courseCode}</span>
            ) : null}
            <p style={{ margin: 0, color: '#4b5563' }}>{schedule}</p>
            <footer>
              <span className="nav-link" style={{ fontWeight: 600, color: '#2563eb' }}>
                Manage section →
              </span>
            </footer>
          </Link>
        );
      })}
    </div>
  );
}
