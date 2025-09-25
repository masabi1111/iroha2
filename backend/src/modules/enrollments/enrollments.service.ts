import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus, Prisma, seasons } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto';

export interface EnrollmentCreationResult {
  enrollmentId: string;
  status: EnrollmentStatus;
  seatsLeft: number;
}

export interface MyEnrollmentSummary {
  id: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
  course: {
    id: string;
    code: string;
    title: string;
  };
  section?: {
    id: string;
    title?: string | null;
  } | null;
}

export interface EnrollmentReportItem {
  courseId: string;
  code: string;
  title: string;
  capacity: number;
  active: number;
  pending: number;
  waitlisted: number;
  completed: number;
  cancelled: number;
  seatsLeft: number;
}

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createEnrollment(userId: string, dto: CreateEnrollmentDto): Promise<EnrollmentCreationResult> {
    const courseId = BigInt(dto.courseId);
    const sectionId = dto.sectionId ? BigInt(dto.sectionId) : undefined;
    const userIdNumeric = BigInt(userId);

    return this.prisma.$transaction(
      async (tx) => {
        const course = await tx.courses.findUnique({
          where: { id: courseId },
          include: { season: true },
        });

        if (!course) {
          throw new NotFoundException('Course not found');
        }

        if (!this.canEnrollWindow(course.season)) {
          throw new HttpException('Enrollment window is closed for this course', 423);
        }

        if (sectionId) {
          const section = await tx.sections.findUnique({
            where: { id: sectionId },
            select: { course_id: true },
          });

          if (!section || section.course_id !== courseId) {
            throw new BadRequestException('Section does not belong to the selected course');
          }
        }

        const existing = await tx.enrollments.findUnique({
          where: {
            user_id_course_id: {
              user_id: userIdNumeric,
              course_id: courseId,
            },
          },
        });

        if (existing) {
          const blockingStatuses: EnrollmentStatus[] = [
            EnrollmentStatus.active,
            EnrollmentStatus.pending,
            EnrollmentStatus.waitlisted,
            EnrollmentStatus.completed,
          ];

          if (blockingStatuses.includes(existing.status)) {
            throw new ConflictException('User is already enrolled in this course');
          }

          if (existing.status === EnrollmentStatus.cancelled) {
            await tx.enrollments.delete({ where: { id: existing.id } });
          }
        }

        const activePendingCount = await tx.enrollments.count({
          where: {
            course_id: courseId,
            status: { in: [EnrollmentStatus.active, EnrollmentStatus.pending] },
          },
        });

        const seatsLeftBefore = course.capacity - activePendingCount;
        const status =
          seatsLeftBefore > 0 ? EnrollmentStatus.pending : EnrollmentStatus.waitlisted;

        const enrollment = await tx.enrollments.create({
          data: {
            user_id: userIdNumeric,
            course_id: courseId,
            section_id: sectionId ?? null,
            status,
          },
        });

        const seatsLeft = await this.computeSeatsLeft(courseId, tx);

        return {
          enrollmentId: enrollment.id.toString(),
          status,
          seatsLeft,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async getMyEnrollments(userId: string): Promise<MyEnrollmentSummary[]> {
    const enrollments = await this.prisma.enrollments.findMany({
      where: { user_id: BigInt(userId) },
      include: {
        course: { select: { id: true, code: true, title: true } },
        section: { select: { id: true, title: true } },
      },
      orderBy: { enrolled_at: 'desc' },
    });

    return enrollments.map((enrollment) => ({
      id: enrollment.id.toString(),
      status: enrollment.status,
      enrolledAt: enrollment.enrolled_at,
      course: {
        id: enrollment.course.id.toString(),
        code: enrollment.course.code,
        title: enrollment.course.title,
      },
      section: enrollment.section
        ? {
            id: enrollment.section.id.toString(),
            title: enrollment.section.title,
          }
        : null,
    }));
  }

  async getEnrollmentReport(seasonCode: string): Promise<EnrollmentReportItem[]> {
    const season = await this.prisma.seasons.findUnique({
      where: { code: seasonCode },
      select: { id: true },
    });

    if (!season) {
      throw new NotFoundException('Season not found');
    }

    const courses = await this.prisma.courses.findMany({
      where: { season_id: season.id },
      select: { id: true, code: true, title: true, capacity: true },
      orderBy: { code: 'asc' },
    });

    if (courses.length === 0) {
      return [];
    }

    const courseIds = courses.map((course) => course.id);

    const grouped = await this.prisma.enrollments.groupBy({
      by: ['course_id', 'status'],
      where: { course_id: { in: courseIds } },
      _count: { _all: true },
    });

    const statuses = Object.values(EnrollmentStatus) as EnrollmentStatus[];

    const result: EnrollmentReportItem[] = courses.map((course) => {
      const counts = Object.fromEntries(statuses.map((status) => [status, 0])) as Record<EnrollmentStatus, number>;

      for (const item of grouped) {
        if (item.course_id === course.id) {
          counts[item.status] = item._count._all;
        }
      }

      const seatsLeft = Math.max(
        0,
        course.capacity - (counts[EnrollmentStatus.active] + counts[EnrollmentStatus.pending]),
      );

      return {
        courseId: course.id.toString(),
        code: course.code,
        title: course.title,
        capacity: course.capacity,
        active: counts[EnrollmentStatus.active],
        pending: counts[EnrollmentStatus.pending],
        waitlisted: counts[EnrollmentStatus.waitlisted],
        completed: counts[EnrollmentStatus.completed],
        cancelled: counts[EnrollmentStatus.cancelled],
        seatsLeft,
      };
    });

    return result;
  }

  async computeSeatsLeft(courseId: bigint, tx?: TransactionClient): Promise<number> {
    const client = tx ?? this.prisma;
    const course = await client.courses.findUnique({
      where: { id: courseId },
      select: { capacity: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const activePending = await client.enrollments.count({
      where: {
        course_id: courseId,
        status: { in: [EnrollmentStatus.active, EnrollmentStatus.pending] },
      },
    });

    return Math.max(0, course.capacity - activePending);
  }

  canEnrollWindow(season: Pick<seasons, 'enrollment_open' | 'enrollment_close'>): boolean {
    const now = new Date();
    return now >= season.enrollment_open && now <= season.enrollment_close;
  }
}
