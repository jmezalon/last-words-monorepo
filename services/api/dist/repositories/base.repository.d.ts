import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/base.dto';
export declare abstract class BaseRepository<T, CreateDto, UpdateDto> {
    protected prisma: PrismaService;
    constructor(prisma: PrismaService);
    abstract create(data: CreateDto, userId?: string): Promise<T>;
    abstract findById(id: string, userId?: string): Promise<T | null>;
    abstract update(id: string, data: UpdateDto, userId?: string): Promise<T>;
    abstract delete(id: string, userId?: string): Promise<void>;
    abstract findMany(pagination: PaginationDto, userId?: string, filters?: Record<string, any>): Promise<PaginatedResponseDto<T>>;
    protected buildPaginationQuery(pagination: PaginationDto): any;
    protected buildPaginatedResponse<T>(data: T[], pagination: PaginationDto, totalCount?: number): PaginatedResponseDto<T>;
}
