import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiQuery,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateEnrollmentDto } from './dto';
import { EnrollmentsService, EnrollmentCreationResult, EnrollmentReportItem, MyEnrollmentSummary } from './enrollments.service';
import { JwtPayload } from '../../auth/jwt-payload.interface';
import { EnrollmentStatus } from '@prisma/client';

class EnrollmentResponseDto implements EnrollmentCreationResult {
  @ApiProperty({ description: 'Identifier of the created enrollment', example: '123' })
  enrollmentId!: string;

  @ApiProperty({ enum: EnrollmentStatus, example: EnrollmentStatus.pending })
  status!: EnrollmentStatus;

  @ApiProperty({ description: 'Seats remaining for the course', example: 12 })
  seatsLeft!: number;
}

class EnrollmentCourseDto {
  @ApiProperty({ example: '42' })
  id!: string;

  @ApiProperty({ example: 'JP-101' })
  code!: string;

  @ApiProperty({ example: 'Introduction to Japanese' })
  title!: string;
}

class EnrollmentSectionDto {
  @ApiProperty({ example: '17' })
  id!: string;

  @ApiPropertyOptional({ example: 'Evening Section' })
  title?: string | null;
}

class MyEnrollmentDto implements MyEnrollmentSummary {
  @ApiProperty({ example: '501' })
  id!: string;

  @ApiProperty({ enum: EnrollmentStatus, example: EnrollmentStatus.waitlisted })
  status!: EnrollmentStatus;

  @ApiProperty({ type: String, format: 'date-time', example: '2024-06-01T12:00:00.000Z' })
  enrolledAt!: Date;

  @ApiProperty({ type: EnrollmentCourseDto })
  course!: EnrollmentCourseDto;

  @ApiPropertyOptional({ type: EnrollmentSectionDto })
  section?: EnrollmentSectionDto | null;
}

class EnrollmentReportItemDto implements EnrollmentReportItem {
  @ApiProperty({ example: '88' })
  courseId!: string;

  @ApiProperty({ example: 'JP-201' })
  code!: string;

  @ApiProperty({ example: 'Intermediate Japanese' })
  title!: string;

  @ApiProperty({ example: 25 })
  capacity!: number;

  @ApiProperty({ example: 18 })
  active!: number;

  @ApiProperty({ example: 3 })
  pending!: number;

  @ApiProperty({ example: 5 })
  waitlisted!: number;

  @ApiProperty({ example: 2 })
  completed!: number;

  @ApiProperty({ example: 1 })
  cancelled!: number;

  @ApiProperty({ example: 4 })
  seatsLeft!: number;
}

@ApiTags('enrollments')
@ApiExtraModels(EnrollmentResponseDto)
@Controller()
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post('enrollments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a new enrollment for the authenticated user' })
  @ApiCreatedResponse({
    description: 'Enrollment outcome',
    content: {
      'application/json': {
        schema: { $ref: getSchemaPath(EnrollmentResponseDto) },
        examples: {
          pending: {
            summary: 'Pending enrollment when seats are available',
            value: { enrollmentId: '321', status: EnrollmentStatus.pending, seatsLeft: 9 },
          },
          waitlisted: {
            summary: 'Waitlisted enrollment when the course is full',
            value: { enrollmentId: '654', status: EnrollmentStatus.waitlisted, seatsLeft: 0 },
          },
        },
      },
    },
  })
  async create(@Req() req: Request, @Body() dto: CreateEnrollmentDto): Promise<EnrollmentResponseDto> {
    const payload = req.user as JwtPayload | undefined;
    const userId = payload?.sub;

    if (!userId) {
      throw new UnauthorizedException('Missing authenticated user identifier');
    }

    return this.enrollmentsService.createEnrollment(userId, dto);
  }

  @Get('enrollments/mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List enrollments for the authenticated user' })
  @ApiOkResponse({ type: MyEnrollmentDto, isArray: true })
  async getMine(@Req() req: Request): Promise<MyEnrollmentDto[]> {
    const payload = req.user as JwtPayload | undefined;
    const userId = payload?.sub;

    if (!userId) {
      throw new UnauthorizedException('Missing authenticated user identifier');
    }

    return this.enrollmentsService.getMyEnrollments(userId);
  }

  @Get('reports/enrollment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin enrollment report aggregated by course' })
  @ApiQuery({ name: 'season', description: 'Season code to filter courses', example: 'SPRING-2024' })
  @ApiOkResponse({ type: EnrollmentReportItemDto, isArray: true })
  async getReport(@Query('season') seasonCode: string): Promise<EnrollmentReportItemDto[]> {
    const normalized = seasonCode?.trim();

    if (!normalized) {
      throw new BadRequestException('Query parameter "season" is required');
    }

    return this.enrollmentsService.getEnrollmentReport(normalized);
  }
}
