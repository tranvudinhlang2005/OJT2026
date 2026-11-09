package com.p02.training.exception;

import org.springframework.http.HttpStatus;

/**
 * Shared error codes from spec 0.4. Feature-specific codes such as CLASS_FULL are raised through
 * {@link ApiException}. The last three are protocol errors the spec table does not list.
 */
public enum ErrorCode {

    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại"),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "Tên đăng nhập hoặc mật khẩu không đúng"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này"),
    CSRF_INVALID(HttpStatus.FORBIDDEN, "Phiên thao tác không hợp lệ, vui lòng tải lại trang"),
    NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy dữ liệu yêu cầu"),
    VERSION_CONFLICT(HttpStatus.CONFLICT, "Dữ liệu đã được cập nhật bởi người khác, vui lòng tải lại"),
    VALIDATION_ERROR(HttpStatus.UNPROCESSABLE_ENTITY, "Dữ liệu chưa hợp lệ"),
    TOO_MANY_REQUESTS(HttpStatus.TOO_MANY_REQUESTS, "Bạn thao tác quá nhanh, vui lòng thử lại sau"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Có lỗi xảy ra, vui lòng thử lại"),

    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "Phương thức không được hỗ trợ"),
    NOT_ACCEPTABLE(HttpStatus.NOT_ACCEPTABLE, "Định dạng phản hồi không được hỗ trợ"),
    UNSUPPORTED_MEDIA_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Định dạng dữ liệu không được hỗ trợ");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    public HttpStatus status() {
        return status;
    }

    public String message() {
        return message;
    }
}
