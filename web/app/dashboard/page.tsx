import {cookies, headers} from 'next/headers';
import Link from 'next/link';
import {redirect} from 'next/navigation';

import AttendanceSummary, {AttendanceSnapshot} from '@/components/attendance-summary';
import Certificates, {CertificateSummary} from '@/components/certificates';
import LessonCard, {LessonSummary} from '@/components/lesson-card';
import QuizList, {QuizSummary} from '@/components/quiz-list';
import {detectRequestLocale, getTranslator} from '@/lib/i18n';
import {getSession} from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

type EnrollmentRecord = {
  id: string;
  status?: string | null;
  courseId?: string | null;
  courseTitle?: string | null;
  seatsLeft?: number | null;
  raw: any;
};

type LessonRecord = {
  id: string;
  title?: string | null;
  releaseAt?: Date | null;
  videoUrl?: string | null;
};

type QuizRecord = {
  id: string;
  title?: string | null;
  dueAt?: Date | null;
  startUrl?: string | null;
};

type AttemptRecord = {
  id: string;
  quizId?: string | null;
  status?: string | null;
  submittedAt?: Date | null;
};

type AttendanceRecord = {
  presentCount?: number | null;
  totalCount?: number | null;
  percentage?: number | null;
  status?: string | null;
};

type CertificateRecord = {
  id: string;
  title?: string | null;
  courseTitle?: string | null;
  url?: string | null;
};

type CourseContext = {
  enrollment: EnrollmentRecord;
  lessons: LessonRecord[];
  quizzes: QuizRecord[];
  attempts: AttemptRecord[];
  attendance: AttendanceRecord | null;
  certificates: CertificateRecord[];
};

function toArray(payload: unknown): any[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const container = payload as Record<string, unknown>;
    for (const key of ['data', 'items', 'results', 'records']) {
      const value = container[key];
      if (Array.isArray(value)) {
        return value;
      }
    }
  }
  return [];
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normaliseStatus(status: unknown): string | null {
  if (typeof status !== 'string') return null;
  return status;
}

function normaliseCourseTitle(enrollment: any): string | null {
  if (!enrollment) return null;
  return (
    enrollment.courseTitle ??
    enrollment.course_title ??
    enrollment.course?.title ??
    enrollment.title ??
    null
  );
}

function mapEnrollment(raw: any): EnrollmentRecord | null {
  if (!raw) return null;
  const idCandidate = raw.id ?? raw.enrollment_id ?? raw.enrollmentId ?? raw.uuid ?? raw.course_id ?? raw.courseId;
  if (!idCandidate) {
    return null;
  }

  const courseId = raw.courseId ?? raw.course_id ?? raw.course?.id ?? raw.course?.course_id ?? null;
  const seatsLeft =
    toNumber(raw.seats_left ?? raw.seatsLeft ?? raw.course?.seats_left ?? raw.course?.seatsLeft ?? null) ?? null;

  return {
    id: String(idCandidate),
    status: normaliseStatus(raw.status ?? raw.state ?? raw.progress ?? null),
    courseId: courseId ? String(courseId) : null,
    courseTitle: normaliseCourseTitle(raw),
    seatsLeft,
    raw
  };
}

function mapLesson(raw: any): LessonRecord | null {
  if (!raw) return null;
  const id = raw.id ?? raw.lesson_id ?? raw.lessonId ?? raw.slug ?? raw.uuid ?? raw.title;
  if (!id) {
    return null;
  }
  const releaseAt =
    toDate(
      raw.releaseAt ??
        raw.release_at ??
        raw.availableAt ??
        raw.available_at ??
        raw.startAt ??
        raw.start_at ??
        raw.scheduled_at ??
        raw.published_at
    ) ?? null;

  return {
    id: String(id),
    title: raw.title ?? raw.name ?? null,
    releaseAt,
    videoUrl: raw.videoUrl ?? raw.video_url ?? raw.video ?? raw.resourceUrl ?? raw.resource_url ?? raw.url ?? null
  };
}

function mapQuiz(raw: any): QuizRecord | null {
  if (!raw) return null;
  const id = raw.id ?? raw.quiz_id ?? raw.quizId ?? raw.uuid;
  if (!id) {
    return null;
  }

  return {
    id: String(id),
    title: raw.title ?? raw.name ?? null,
    dueAt: toDate(raw.dueAt ?? raw.due_at ?? raw.deadline ?? raw.closesAt ?? raw.closes_at ?? raw.available_until),
    startUrl: raw.launchUrl ?? raw.launch_url ?? raw.startUrl ?? raw.start_url ?? raw.url ?? null
  };
}

function mapAttempt(raw: any): AttemptRecord | null {
  if (!raw) return null;
  const id = raw.id ?? raw.attempt_id ?? raw.attemptId ?? `${raw.quiz_id ?? raw.quizId ?? 'attempt'}-${raw.userId ?? raw.user_id ?? ''}`;
  return {
    id: String(id),
    quizId: raw.quizId ? String(raw.quizId) : raw.quiz_id ? String(raw.quiz_id) : raw.quiz?.id ? String(raw.quiz.id) : null,
    status: normaliseStatus(raw.status ?? raw.state ?? null),
    submittedAt: toDate(
      raw.submittedAt ?? raw.submitted_at ?? raw.completedAt ?? raw.completed_at ?? raw.finishedAt ?? raw.finished_at
    )
  };
}

function mapAttendance(raw: any): AttendanceRecord | null {
  if (!raw) return null;

  if (Array.isArray(raw)) {
    const total = raw.length;
    if (total === 0) {
      return { presentCount: 0, totalCount: 0, percentage: null, status: null };
    }
    const present = raw.filter((entry) => {
      const status = (entry?.status ?? entry?.attendanceStatus ?? entry?.state ?? '').toLowerCase();
      return status === 'present' || status === 'attended' || status === 'complete';
    }).length;
    const percentage = total > 0 ? (present / total) * 100 : null;
    return { presentCount: present, totalCount: total, percentage, status: null };
  }

  const present =
    toNumber(
      raw.present ?? raw.presentCount ?? raw.attended ?? raw.attendedSessions ?? raw.sessionsAttended ?? raw.completed ?? null
    ) ?? null;
  const total =
    toNumber(
      raw.total ??
        raw.totalCount ??
        raw.sessions ??
        raw.totalSessions ??
        raw.requiredSessions ??
        raw.total_classes ??
        raw.expected ??
        raw.overall?.total ??
        null
    ) ?? null;
  const percentage =
    toNumber(raw.percentage ?? raw.percent ?? raw.attendancePercentage ?? raw.rate ?? null) ??
    (present !== null && total ? (present / total) * 100 : null);

  return {
    presentCount: present,
    totalCount: total,
    percentage,
    status: raw.status ?? raw.attendanceStatus ?? raw.summary ?? null
  };
}

function mapCertificate(raw: any): CertificateRecord | null {
  if (!raw) return null;
  const id = raw.id ?? raw.certificate_id ?? raw.certificateId ?? raw.uuid ?? raw.slug;
  if (!id) {
    return null;
  }

  return {
    id: String(id),
    title: raw.title ?? raw.name ?? raw.label ?? null,
    courseTitle: raw.course?.title ?? raw.courseTitle ?? raw.course_title ?? null,
    url: raw.pdfUrl ?? raw.pdf_url ?? raw.url ?? raw.downloadUrl ?? raw.download_url ?? null
  };
}

function pickCourseTitle(enrollment: EnrollmentRecord): string | null {
  return enrollment.courseTitle ?? enrollment.raw?.course?.title ?? null;
}

function computeNextLesson(contexts: CourseContext[]): LessonSummary | null {
  const now = Date.now();
  const candidates: Array<LessonSummary & { releaseTime?: number | null }> = [];

  contexts.forEach((context) => {
    const lessons = context.lessons;
    if (!lessons || lessons.length === 0) {
      return;
    }

    const sortedByDate = lessons
      .map((lesson) => ({
        ...lesson,
        releaseTime: lesson.releaseAt ? lesson.releaseAt.getTime() : null
      }))
      .sort((a, b) => {
        const aTime = a.releaseTime ?? Number.MAX_SAFE_INTEGER;
        const bTime = b.releaseTime ?? Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      });

    const upcoming = sortedByDate.filter((lesson) => typeof lesson.releaseTime === 'number' && lesson.releaseTime > now);
    const fallback = sortedByDate.filter((lesson) => typeof lesson.releaseTime === 'number' && lesson.releaseTime <= now);

    const selected = upcoming.length > 0 ? upcoming[0] : fallback.length > 0 ? fallback[fallback.length - 1] : sortedByDate[0];

    if (selected) {
      candidates.push({
        courseTitle: pickCourseTitle(context.enrollment),
        lessonTitle: selected.title ?? null,
        releaseAt: selected.releaseAt ?? null,
        videoUrl: selected.videoUrl ?? null,
        releaseTime: selected.releaseTime ?? null
      });
    }
  });

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => {
    const aTime = typeof a.releaseTime === 'number' ? a.releaseTime : Number.MAX_SAFE_INTEGER;
    const bTime = typeof b.releaseTime === 'number' ? b.releaseTime : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });

  const best = candidates[0];
  return {
    courseTitle: best.courseTitle ?? null,
    lessonTitle: best.lessonTitle ?? null,
    releaseAt: best.releaseAt ?? null,
    videoUrl: best.videoUrl ?? null
  };
}

function computeDueQuizzes(contexts: CourseContext[]): QuizSummary[] {
  const now = Date.now();
  const items: QuizSummary[] = [];

  contexts.forEach((context) => {
    const attemptsByQuiz = new Map<string, AttemptRecord[]>();
    context.attempts.forEach((attempt) => {
      if (!attempt.quizId) return;
      const key = String(attempt.quizId);
      const entries = attemptsByQuiz.get(key) ?? [];
      entries.push(attempt);
      attemptsByQuiz.set(key, entries);
    });

    context.quizzes.forEach((quiz) => {
      if (!quiz.dueAt) return;
      const dueTime = quiz.dueAt.getTime();
      if (Number.isNaN(dueTime) || dueTime < now) {
        return;
      }

      const quizAttempts = attemptsByQuiz.get(String(quiz.id)) ?? [];
      const hasSubmitted = quizAttempts.some((attempt) => {
        const status = attempt.status?.toLowerCase() ?? '';
        if (status === 'submitted' || status === 'completed' || status === 'passed') {
          return true;
        }
        return Boolean(attempt.submittedAt);
      });

      if (hasSubmitted) {
        return;
      }

      items.push({
        id: quiz.id,
        title: quiz.title ?? null,
        dueAt: quiz.dueAt ?? null,
        startUrl: quiz.startUrl ?? null,
        courseTitle: pickCourseTitle(context.enrollment)
      });
    });
  });

  items.sort((a, b) => {
    const aTime = a.dueAt ? a.dueAt.getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.dueAt ? b.dueAt.getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });

  return items;
}

function computeAttendanceSnapshot(contexts: CourseContext[]): AttendanceSnapshot {
  let presentTotal = 0;
  let sessionTotal = 0;
  let primaryStatus: string | null = null;

  contexts.forEach((context) => {
    const attendance = context.attendance;
    if (!attendance) return;
    if (typeof attendance.presentCount === 'number') {
      presentTotal += attendance.presentCount;
    }
    if (typeof attendance.totalCount === 'number') {
      sessionTotal += attendance.totalCount;
    }
    if (!primaryStatus && attendance.status) {
      primaryStatus = attendance.status;
    }
  });

  if (sessionTotal === 0) {
    return { percentage: null, presentCount: null, totalCount: null, status: primaryStatus };
  }

  const percentage = (presentTotal / sessionTotal) * 100;
  return {
    percentage,
    presentCount: presentTotal,
    totalCount: sessionTotal,
    status: primaryStatus
  };
}

function computeCertificates(contexts: CourseContext[]): CertificateSummary[] {
  const certificates: CertificateSummary[] = [];
  contexts.forEach((context) => {
    context.certificates.forEach((certificate) => {
      certificates.push({
        id: certificate.id,
        title: certificate.title ?? null,
        courseTitle: certificate.courseTitle ?? pickCourseTitle(context.enrollment),
        url: certificate.url ?? null
      });
    });
  });
  return certificates;
}

function formatStatusLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return value
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export default async function DashboardPage() {
  const session = getSession();
  if (!session.accessToken) {
    redirect('/auth/login');
  }

  const locale = detectRequestLocale();
  const t = getTranslator(locale) as any;
  const headersList = headers();
  const cookieStore = cookies();

  const host = headersList.get('x-forwarded-host') ?? headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') ?? (host && host.includes('localhost') ? 'http' : 'https');
  const baseUrl = host ? `${protocol}://${host}` : null;
  const cookieHeader = cookieStore
    .getAll()
    .map(({name, value}) => `${name}=${value}`)
    .join('; ');

  const fetchJson = async <T,>(path: string): Promise<T | null> => {
    if (!baseUrl) return null;
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'GET',
        headers: cookieHeader ? { cookie: cookieHeader } : undefined,
        cache: 'no-store',
        next: { revalidate: 0 }
      });

      if (!response.ok) {
        return null;
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        return (await response.json()) as T;
      }

      const text = await response.text();
      if (!text) {
        return null;
      }

      try {
        return JSON.parse(text) as T;
      } catch (error) {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const enrollmentsPayload = await fetchJson<any>('/api/enrollments/mine');
  const enrollmentItems = toArray(enrollmentsPayload ?? []);
  const enrollments = enrollmentItems
    .map((item) => mapEnrollment(item))
    .filter((item): item is EnrollmentRecord => Boolean(item));
  const enrollmentError = !enrollmentsPayload && enrollments.length === 0;

  const activeEnrollments = enrollments.filter((enrollment) => {
    const status = enrollment.status?.toLowerCase();
    return status === 'active' || status === 'in_progress' || status === 'enrolled';
  });

  const contexts: CourseContext[] = await Promise.all(
    activeEnrollments.map(async (enrollment) => {
      if (!enrollment.courseId) {
        return {
          enrollment,
          lessons: [],
          quizzes: [],
          attempts: [],
          attendance: null,
          certificates: []
        };
      }

      const courseIdParam = encodeURIComponent(enrollment.courseId);
      const [lessonsPayload, quizzesPayload, attemptsPayload, attendancePayload, certificatesPayload] = await Promise.all([
        fetchJson<any>(`/api/lessons?courseId=${courseIdParam}`),
        fetchJson<any>(`/api/quizzes?courseId=${courseIdParam}`),
        fetchJson<any>(`/api/quiz-attempts?courseId=${courseIdParam}`),
        fetchJson<any>(`/api/attendance/mine?courseId=${courseIdParam}`),
        fetchJson<any>(`/api/certificates?enrollmentId=${encodeURIComponent(enrollment.id)}`)
      ]);

      const lessons = toArray(lessonsPayload ?? []).map((lesson) => mapLesson(lesson)).filter((lesson): lesson is LessonRecord => Boolean(lesson));
      const quizzes = toArray(quizzesPayload ?? []).map((quiz) => mapQuiz(quiz)).filter((quiz): quiz is QuizRecord => Boolean(quiz));
      const attempts = toArray(attemptsPayload ?? []).map((attempt) => mapAttempt(attempt)).filter((attempt): attempt is AttemptRecord => Boolean(attempt));
      const attendance = mapAttendance(attendancePayload);
      const certificates = toArray(certificatesPayload ?? [])
        .map((certificate) => mapCertificate(certificate))
        .filter((certificate): certificate is CertificateRecord => Boolean(certificate));

      return {
        enrollment,
        lessons,
        quizzes,
        attempts,
        attendance,
        certificates
      };
    })
  );

  const nextLesson = computeNextLesson(contexts);
  const dueQuizzes = computeDueQuizzes(contexts);
  const attendanceSnapshotRaw = computeAttendanceSnapshot(contexts);
  const certificates = computeCertificates(contexts);

  let attendanceStatusLabel = attendanceSnapshotRaw.status ?? null;
  if (attendanceSnapshotRaw.percentage !== null && attendanceSnapshotRaw.percentage !== undefined) {
    const percentage = attendanceSnapshotRaw.percentage;
    const statusKey = percentage >= 85 ? 'great' : percentage >= 60 ? 'warning' : 'danger';
    attendanceStatusLabel = t(`dashboard.attendanceStatus.${statusKey}`);
  }

  const attendanceSnapshot: AttendanceSnapshot = {
    percentage: attendanceSnapshotRaw.percentage,
    presentCount: attendanceSnapshotRaw.presentCount ?? null,
    totalCount: attendanceSnapshotRaw.totalCount ?? null,
    status: attendanceStatusLabel
  };

  const hasGlobalError = !baseUrl || enrollmentError;

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900">{t('dashboard.title')}</h1>
        <p className="text-sm text-slate-600">{t('dashboard.description')}</p>
      </header>

      {hasGlobalError ? <div className="error-state">{t('errors.generic')}</div> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <LessonCard
          heading={t('dashboard.nextLesson')}
          lesson={nextLesson}
          locale={locale}
          actionLabel={t('dashboard.openLesson')}
          emptyMessage={t('dashboard.nextLessonEmpty')}
        />

        <QuizList
          heading={t('dashboard.dueQuizzes')}
          quizzes={dueQuizzes}
          locale={locale}
          actionLabel={t('dashboard.startQuiz')}
          emptyMessage={t('dashboard.dueQuizzesEmpty')}
        />

        <AttendanceSummary
          heading={t('dashboard.attendance')}
          snapshot={attendanceSnapshot}
          emptyMessage={t('dashboard.attendanceEmpty')}
        />

        <Certificates
          heading={t('dashboard.certificates')}
          certificates={certificates}
          actionLabel={t('dashboard.viewCertificate')}
          emptyMessage={t('dashboard.certificatesEmpty')}
        />

        <article className="card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4 md:col-span-2 xl:col-span-3">
          <header className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">{t('dashboard.enrollments')}</h2>
            <Link href="/courses" className="text-sm font-semibold text-blue-600 hover:text-blue-500">
              {t('actions.browseCourses')}
            </Link>
          </header>

          {enrollments.length === 0 ? (
            <p className="text-sm text-slate-500">{t('dashboard.enrollmentsEmpty')}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {enrollments.map((enrollment) => {
                const statusLabel = formatStatusLabel(enrollment.status);
                return (
                  <li key={enrollment.id} className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/80 p-4">
                    <span className="text-base font-semibold text-slate-800">{pickCourseTitle(enrollment) ?? t('dashboard.untitledCourse')}</span>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      {statusLabel ? (
                        <span>
                          {t('dashboard.statusLabel')}: <strong className="font-semibold text-slate-700">{statusLabel}</strong>
                        </span>
                      ) : null}
                      {typeof enrollment.seatsLeft === 'number' ? (
                        <span>
                          {t('dashboard.seatsLabel')}: <strong className="font-semibold text-slate-700">{enrollment.seatsLeft}</strong>
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}
