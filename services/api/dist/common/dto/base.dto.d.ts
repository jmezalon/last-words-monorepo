export declare class BaseDto {
    id: string;
    createdAt: string;
    updatedAt: string;
}
export declare class PaginationDto {
    cursor?: string;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
}
export declare class PaginatedResponseDto<T> {
    data: T[];
    hasNextPage: boolean;
    nextCursor?: string;
    totalCount?: number;
}
