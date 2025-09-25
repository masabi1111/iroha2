'use client';

import {FormEvent, useEffect, useMemo, useState} from 'react';

import type {RosterEntry} from '@/types/teach';
import {combineName} from '@/lib/format';

type ToastState = {
  variant: 'success' | 'error';
  message: string;
};

export interface RosterStudent extends RosterEntry {
  name: string;
}

interface RosterTableProps {
  sectionId: string;
  students: RosterEntry[];
  defaultDate: string;
  disabled?: boolean;
  disabledReason?: string;
  successMessage?: string;
  errorMessage?: string;
}

interface AttendanceRecord {
  userId: string;
  present: boolean;
  note: string;
}

function buildStudentName(entry: RosterEntry): string {
  const combined = combineName({
    firstName: entry.firstName,
    lastName: entry.lastName,
    displayName: entry.displayName
  });

  if (combined) {
    return combined;
  }

  if (entry.email) {
    return entry.email;
  }

  return `Student ${entry.userId}`;
}

function normaliseStudents(entries: RosterEntry[]): RosterStudent[] {
  return entries.map((entry) => ({
    ...entry,
    name: buildStudentName(entry)
  }));
}

export function RosterTable({
  sectionId,
  students,
  defaultDate,
  disabled = false,
  disabledReason,
  successMessage = 'Attendance saved successfully.',
  errorMessage = 'Unable to submit attendance.'
}: RosterTableProps) {
  const [meetingDate, setMeetingDate] = useState(defaultDate);
  const [records, setRecords] = useState<AttendanceRecord[]>(() =>
    students.map((student) => ({ userId: student.userId, present: true, note: '' }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const roster = useMemo(() => normaliseStudents(students), [students]);

  useEffect(() => {
    setRecords(students.map((student) => ({ userId: student.userId, present: true, note: '' })));
  }, [students]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const handleToggle = (userId: string) => {
    setRecords((prev) =>
      prev.map((record) => (record.userId === userId ? { ...record, present: !record.present } : record))
    );
  };

  const handleNoteChange = (userId: string, note: string) => {
    setRecords((prev) => prev.map((record) => (record.userId === userId ? { ...record, note } : record)));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (disabled || isSubmitting || !roster.length) {
      return;
    }

    if (!meetingDate) {
      setToast({ variant: 'error', message: 'Please choose a meeting date.' });
      return;
    }

    setIsSubmitting(true);
    setToast(null);

    try {
      const payload = records.map((record) => ({
        sectionId,
        userId: record.userId,
        meetingDate,
        present: record.present,
        ...(record.note ? { note: record.note } : {})
      }));

      const response = await fetch('/api/teach/attendance/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        cache: 'no-store'
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const body = await response.json().catch(() => ({}));
          const message = typeof body?.message === 'string' ? body.message : errorMessage;
          throw new Error(message);
        }

        throw new Error(errorMessage);
      }

      setToast({ variant: 'success', message: successMessage });
    } catch (error) {
      const message = error instanceof Error ? error.message : errorMessage;
      setToast({ variant: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {toast ? <div className={`toast toast--${toast.variant}`}>{toast.message}</div> : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <label htmlFor="attendance-date" style={{ fontWeight: 600 }}>
          Meeting date
        </label>
        <input
          id="attendance-date"
          type="date"
          value={meetingDate}
          onChange={(event) => setMeetingDate(event.target.value)}
          disabled={disabled || isSubmitting}
          style={{
            borderRadius: '0.5rem',
            border: '1px solid #d1d5db',
            padding: '0.5rem 0.75rem',
            backgroundColor: disabled ? '#f3f4f6' : '#fff'
          }}
        />
      </div>

      {disabledReason ? (
        <div className="error-state" style={{ textAlign: 'left' }}>
          {disabledReason}
        </div>
      ) : null}

      {roster.length ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="list-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Present</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((student) => {
                const record = records.find((item) => item.userId === student.userId);

                return (
                  <tr key={student.userId}>
                    <td>{student.name}</td>
                    <td style={{ color: '#6b7280' }}>{student.email ?? '—'}</td>
                    <td>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={record?.present ?? false}
                          onChange={() => handleToggle(student.userId)}
                          disabled={disabled || isSubmitting}
                        />
                        <span>{record?.present ? 'Present' : 'Absent'}</span>
                      </label>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={record?.note ?? ''}
                        onChange={(event) => handleNoteChange(student.userId, event.target.value)}
                        disabled={disabled || isSubmitting}
                        placeholder="Optional note"
                        style={{
                          width: '100%',
                          borderRadius: '0.5rem',
                          border: '1px solid #d1d5db',
                          padding: '0.4rem 0.6rem'
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state" style={{ textAlign: 'left' }}>
          No students enrolled in this section yet.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          className="button"
          disabled={disabled || isSubmitting || !roster.length}
          style={{ opacity: disabled || isSubmitting || !roster.length ? 0.7 : 1 }}
        >
          {isSubmitting ? 'Submitting...' : 'Save attendance'}
        </button>
      </div>
    </form>
  );
}
