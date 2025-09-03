import { IsString, IsOptional, IsDateString } from 'class-validator';

export class BaseDto {
  @IsString()
  id: string;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;
}

export class PaginationDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  limit?: number = 20;

  @IsOptional()
  @IsString()
  orderBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  orderDirection?: 'asc' | 'desc' = 'desc';
}

export class PaginatedResponseDto<T> {
  data: T[];
  hasNextPage: boolean;
  nextCursor?: string;
  totalCount?: number;
}
