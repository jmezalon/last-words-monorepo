import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/base.dto';

export abstract class BaseRepository<T, CreateDto, UpdateDto> {
  constructor(protected prisma: PrismaService) {}

  abstract create(data: CreateDto, userId?: string): Promise<T>;
  abstract findById(id: string, userId?: string): Promise<T | null>;
  abstract update(id: string, data: UpdateDto, userId?: string): Promise<T>;
  abstract delete(id: string, userId?: string): Promise<void>;
  abstract findMany(
    pagination: PaginationDto,
    userId?: string,
    filters?: Record<string, any>
  ): Promise<PaginatedResponseDto<T>>;

  protected buildPaginationQuery(pagination: PaginationDto) {
    const { cursor, limit, orderBy, orderDirection } = pagination;

    const query: any = {
      take: limit,
      orderBy: { [orderBy]: orderDirection },
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1; // Skip the cursor item
    }

    return query;
  }

  protected buildPaginatedResponse<T>(
    data: T[],
    pagination: PaginationDto,
    totalCount?: number
  ): PaginatedResponseDto<T> {
    const hasNextPage = data.length === pagination.limit;
    const nextCursor =
      hasNextPage && data.length > 0
        ? (data[data.length - 1] as any).id
        : undefined;

    return {
      data,
      hasNextPage,
      nextCursor,
      totalCount,
    };
  }
}
