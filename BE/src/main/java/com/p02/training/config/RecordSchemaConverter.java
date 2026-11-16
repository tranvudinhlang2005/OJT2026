package com.p02.training.config;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JavaType;
import io.swagger.v3.core.converter.AnnotatedType;
import io.swagger.v3.core.converter.ModelConverter;
import io.swagger.v3.core.converter.ModelConverterContext;
import io.swagger.v3.core.util.Json;
import io.swagger.v3.oas.models.media.ComposedSchema;
import io.swagger.v3.oas.models.media.Schema;
import java.lang.reflect.Method;
import java.lang.reflect.RecordComponent;
import java.util.Iterator;
import java.util.Map;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;

/**
 * Makes the OpenAPI schemas of the record DTOs say what the JSON really looks like. Only the
 * document changes; serialization does not.
 *
 * <ul>
 *   <li><b>Responses</b> ({@code dto.response}, nested records included): every component is
 *       {@code required}, because Jackson always writes it, as {@code null} when empty. Components
 *       marked {@link Nullable} are {@code nullable: true}. A component with
 *       {@code @JsonInclude(NON_NULL)} or {@code NON_EMPTY} may be left out, so it stays optional.</li>
 *   <li><b>Requests</b> ({@code dto.request}): {@code required} still comes from Bean Validation;
 *       every other property is {@code nullable: true}, since the API accepts {@code null} for it.</li>
 * </ul>
 *
 * <p>A nullable {@code $ref} property (an enum or nested record) is written as
 * {@code allOf: [$ref]} with {@code nullable: true}, the OpenAPI 3.0 form that generators read.
 * Registered with springdoc as a bean.
 */
@Component
public class RecordSchemaConverter implements ModelConverter {

    private static final String RESPONSE_PACKAGE = "com.p02.training.dto.response.";
    private static final String REQUEST_PACKAGE = "com.p02.training.dto.request.";
    private static final String REF_PREFIX = "#/components/schemas/";

    @Override
    @SuppressWarnings({"rawtypes", "unchecked"})
    public Schema resolve(AnnotatedType type, ModelConverterContext context, Iterator<ModelConverter> chain) {
        Schema schema = chain.hasNext() ? chain.next().resolve(type, context, chain) : null;
        if (schema == null || type.getType() == null) {
            return schema;
        }
        JavaType javaType = Json.mapper().constructType(type.getType());
        Class<?> raw = javaType.getRawClass();
        boolean response = raw.getName().startsWith(RESPONSE_PACKAGE);
        boolean request = raw.getName().startsWith(REQUEST_PACKAGE);
        if (!raw.isRecord() || !(response || request)) {
            return schema;
        }

        Schema model = schema;
        if (schema.get$ref() != null) {
            model = context.getDefinedModels().get(schema.get$ref().substring(REF_PREFIX.length()));
        }
        if (model == null || model.getProperties() == null) {
            return schema;
        }

        Map<String, Schema> properties = model.getProperties();
        for (RecordComponent component : raw.getRecordComponents()) {
            String name = component.getName();
            Schema property = properties.get(name);
            if (property == null) {
                continue;
            }
            Method accessor = component.getAccessor();
            if (response) {
                if (!mayBeOmitted(accessor) && (model.getRequired() == null || !model.getRequired().contains(name))) {
                    model.addRequiredItem(name);
                }
                if (accessor.isAnnotationPresent(Nullable.class)) {
                    properties.put(name, nullable(property));
                }
            } else if (model.getRequired() == null || !model.getRequired().contains(name)) {
                properties.put(name, nullable(property));
            }
        }
        return schema;
    }

    private static boolean mayBeOmitted(Method accessor) {
        JsonInclude include = accessor.getAnnotation(JsonInclude.class);
        if (include == null) {
            return false;
        }
        JsonInclude.Include value = include.value();
        return value != JsonInclude.Include.ALWAYS && value != JsonInclude.Include.USE_DEFAULTS;
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private static Schema nullable(Schema property) {
        if (property.get$ref() == null) {
            property.setNullable(true);
            return property;
        }
        ComposedSchema wrapper = new ComposedSchema();
        wrapper.addAllOfItem(new Schema<>().$ref(property.get$ref()));
        wrapper.setNullable(true);
        wrapper.setDescription(property.getDescription());
        return wrapper;
    }
}
