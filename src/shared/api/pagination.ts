import type { Page } from "../types/common"

export interface BackendPage<T> {
    content: T[]
    page: {
        number: number;
        size: number;
        totalElements: number;
        totalPages: number;
    };
}

export function normalizePage<T>(
    response: BackendPage<T>
): Page<T> {
    return {
        items: response.content,
        page: response.page.number,
        size: response.page.size,
        totalItems: response.page.totalElements,
        totalPages: response.page.totalPages,
    }
}