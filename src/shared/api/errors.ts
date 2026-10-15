import axios from 'axios';

export interface ApiErrorBody {
    timestamp?: string;
    status?: number;
    error?: string;
    message?: string;
    validationErrors?: Record<string, string>;
}

export class ApiError extends Error {
    readonly status: number;
    readonly code: string | undefined;
    readonly fieldErrors: Record<string, string> | undefined;

    constructor(
        status: number,
        message: string,
        code?: string,
        fieldErrors?: Record<string, string>,
    ) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
        this.fieldErrors = fieldErrors;
    }

    get isValidation(): boolean {
        return Boolean(
            this.fieldErrors && Object.keys(this.fieldErrors).length > 0
        );
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function normalizeError(err: unknown): Promise<ApiError> {

    if (!axios.isAxiosError(err)) {
        return new ApiError(0, "Unexpected error");
    }

    if (!err.response) {
        return new ApiError(0, "Không thể kết nối máy chủ");
    }

    const { status } = err.response;

    let data: unknown = err.response.data;

    if (data instanceof Blob) {
        try {
            data = JSON.parse(await data.text());
        } catch {
            data = undefined;
        }
    }

    const body = isRecord(data) ? (data as ApiErrorBody) : undefined;
    const responseMessage = typeof data === "string" ? data : undefined;

    const fallbackMessages: Record<number, string> = {
        400: "Yêu cầu không hợp lệ.",
        401: "Phiên đăng nhập đã hết hạn.",
        403: "Bạn không có quyền thực hiện thao tác này.",
        404: "Không tìm thấy dữ liệu.",
        500: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
    };

    return new ApiError(
        status,
        body?.message || responseMessage || fallbackMessages[status] || "Request failed",
        body?.error,
        body?.validationErrors,
    );
}
