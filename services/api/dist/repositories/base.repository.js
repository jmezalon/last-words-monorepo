"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
class BaseRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    buildPaginationQuery(pagination) {
        const { cursor, limit, orderBy, orderDirection } = pagination;
        const query = {
            take: limit,
            orderBy: { [orderBy]: orderDirection },
        };
        if (cursor) {
            query.cursor = { id: cursor };
            query.skip = 1;
        }
        return query;
    }
    buildPaginatedResponse(data, pagination, totalCount) {
        const hasNextPage = data.length === pagination.limit;
        const nextCursor = hasNextPage && data.length > 0
            ? data[data.length - 1].id
            : undefined;
        return {
            data,
            hasNextPage,
            nextCursor,
            totalCount,
        };
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=base.repository.js.map