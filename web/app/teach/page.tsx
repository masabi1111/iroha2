import {redirect} from 'next/navigation';

import {SectionList} from '@/components/teach/section-list';
import {fetchCurrentInstructor, hasInstructorAccess} from '@/lib/teach/auth';
import {fetchInstructorSections} from '@/lib/teach/sections';

export const dynamic = 'force-dynamic';

export default async function TeachLandingPage() {
  const { user, status: userStatus } = await fetchCurrentInstructor();

  if (userStatus === 401 || (!user && userStatus == null)) {
    redirect('/auth/login');
  }

  if (!user) {
    return (
      <section className="card">
        <h1 style={{ margin: 0 }}>Instructor portal</h1>
        <p style={{ margin: 0, color: '#4b5563' }}>We could not verify your account. Please try again later.</p>
      </section>
    );
  }

  if (!hasInstructorAccess(user)) {
    return (
        <section className="card" style={{ gap: '0.75rem' }}>
          <h1 style={{ margin: 0 }}>Instructor portal</h1>
          <div className="error-state" style={{ textAlign: 'left' }}>
            You don't have permission to access the instructor portal.
          </div>
        </section>
    );
  }

  const { sections, error: sectionsError } = await fetchInstructorSections();

  return (
    <section className="card" style={{ gap: '1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <h1 style={{ margin: 0 }}>Instructor portal</h1>
        <p style={{ margin: 0, color: '#4b5563' }}>
          Review your assigned sections and manage roster, lessons, and quizzes.
        </p>
      </div>

      {sectionsError ? (
        <div className="error-state" style={{ textAlign: 'left' }}>
          {sectionsError}
        </div>
      ) : (
        <SectionList sections={sections} emptyMessage="No sections assigned to you yet." />
      )}
    </section>
  );
}
