import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class CreateEnrollmentDto {
  @ApiProperty({ description: 'Identifier of the course to enroll in', minimum: 1, example: 101 })
  @IsInt()
  @Min(1)
  courseId!: number;

  @ApiPropertyOptional({ description: 'Specific section to join', minimum: 1, example: 12 })
  @IsOptional()
  @IsInt()
  @Min(1)
  sectionId?: number;
}
