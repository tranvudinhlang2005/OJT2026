package com.p02.training.dto.response;

import java.util.List;
import java.util.function.Function;
import org.springframework.data.domain.Page;

/** One page of a list (spec 0.1). {@code page} starts at 0. */
public record PageResponse<T>(List<T> items, int page, int size, long totalElements, int totalPages) {

    public static <E, T> PageResponse<T> of(Page<E> page, Function<? super E, ? extends T> mapper) {
        List<T> items = page.getContent().stream().<T>map(mapper).toList();
        return new PageResponse<>(items, page.getNumber(), page.getSize(), page.getTotalElements(),
                page.getTotalPages());
    }
}
