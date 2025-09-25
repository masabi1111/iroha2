'use client';

import {useState} from 'react';

import type {RosterEntry} from '@/types/teach';

import {LessonForm} from './lesson-form';
import {QuizForm} from './quiz-form';
import {RosterTable} from './roster-table';

type TabKey = 'roster' | 'lessons' | 'quizzes';

interface SectionTabsProps {
  sectionId: string;
  roster: {
    students: RosterEntry[];
    defaultDate: string;
    disabled?: boolean;
    disabledReason?: string;
    errorMessage?: string | null;
  };
  lessonForm: {
    disabled?: boolean;
    disabledReason?: string;
  };
  quizForm: {
    disabled?: boolean;
    disabledReason?: string;
  };
}

const TAB_LABELS: Record<TabKey, string> = {
  roster: 'Roster & Attendance',
  lessons: 'Lessons',
  quizzes: 'Quizzes'
};

export function SectionTabs({ sectionId, roster, lessonForm, quizForm }: SectionTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('roster');

  const renderTabs = () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => {
        const isActive = key === activeTab;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            style={{
              borderRadius: '999px',
              border: '1px solid',
              borderColor: isActive ? '#2563eb' : '#d1d5db',
              backgroundColor: isActive ? '#2563eb' : '#f3f4f6',
              color: isActive ? '#ffffff' : '#1f2937',
              padding: '0.4rem 1rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {TAB_LABELS[key]}
          </button>
        );
      })}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {renderTabs()}

      {activeTab === 'roster' ? (
        roster.errorMessage ? (
          <div className="error-state" style={{ textAlign: 'left' }}>
            {roster.errorMessage}
          </div>
        ) : (
          <RosterTable
            sectionId={sectionId}
            students={roster.students}
            defaultDate={roster.defaultDate}
            disabled={roster.disabled}
            disabledReason={roster.disabledReason}
          />
        )
      ) : null}

      {activeTab === 'lessons' ? (
        <LessonForm
          sectionId={sectionId}
          disabled={lessonForm.disabled}
          disabledReason={lessonForm.disabledReason}
        />
      ) : null}

      {activeTab === 'quizzes' ? (
        <QuizForm sectionId={sectionId} disabled={quizForm.disabled} disabledReason={quizForm.disabledReason} />
      ) : null}
    </div>
  );
}
