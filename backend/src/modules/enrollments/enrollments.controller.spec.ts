import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService, EnrollmentCreationResult, EnrollmentReportItem, MyEnrollmentSummary } from './enrollments.service';
import { EnrollmentStatus } from '@prisma/client';

describe('EnrollmentsController', () => {
  let controller: EnrollmentsController;
  let service: jest.Mocked<EnrollmentsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnrollmentsController],
      providers: [
        {
          provide: EnrollmentsService,
          useValue: {
            createEnrollment: jest.fn(),
            getMyEnrollments: jest.fn(),
            getEnrollmentReport: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EnrollmentsController>(EnrollmentsController);
    service = module.get(EnrollmentsService);
  });

  it('creates an enrollment for the authenticated user', async () => {
    const expected: EnrollmentCreationResult = {
      enrollmentId: '123',
      status: EnrollmentStatus.pending,
      seatsLeft: 4,
    };
    service.createEnrollment.mockResolvedValue(expected);

    const result = await controller.create(
      { user: { sub: '42' } } as any,
      { courseId: 10, sectionId: 3 },
    );

    expect(result).toEqual(expected);
    expect(service.createEnrollment).toHaveBeenCalledWith('42', { courseId: 10, sectionId: 3 });
  });

  it('returns enrollments for the authenticated user', async () => {
    const expected: MyEnrollmentSummary[] = [
      {
        id: '1',
        status: EnrollmentStatus.active,
        enrolledAt: new Date('2024-01-01T00:00:00.000Z'),
        course: { id: '5', code: 'JP-101', title: 'Intro' },
        section: null,
      },
    ];
    service.getMyEnrollments.mockResolvedValue(expected);

    const result = await controller.getMine({ user: { sub: '42' } } as any);

    expect(result).toEqual(expected);
    expect(service.getMyEnrollments).toHaveBeenCalledWith('42');
  });

  it('returns the enrollment report', async () => {
    const expected: EnrollmentReportItem[] = [
      {
        courseId: '10',
        code: 'JP-101',
        title: 'Intro',
        capacity: 20,
        active: 10,
        pending: 5,
        waitlisted: 2,
        completed: 1,
        cancelled: 1,
        seatsLeft: 5,
      },
    ];
    service.getEnrollmentReport.mockResolvedValue(expected);

    const result = await controller.getReport('WINTER-2024');

    expect(result).toEqual(expected);
    expect(service.getEnrollmentReport).toHaveBeenCalledWith('WINTER-2024');
  });
});
