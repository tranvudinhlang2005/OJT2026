package com.p02.training.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.p02.training.dto.request.ChangeRoleRequest;
import com.p02.training.dto.request.ClassRequest;
import com.p02.training.dto.request.CreateUserRequest;
import com.p02.training.dto.request.UpdateStudentRequest;
import com.p02.training.dto.response.AttendanceSheetResponse;
import com.p02.training.dto.response.ClassResultsResponse;
import com.p02.training.dto.response.ClassSummaryResponse;
import com.p02.training.dto.response.ClassView;
import com.p02.training.dto.response.SecurityAlertsResponse;
import com.p02.training.dto.response.UserResponse;
import io.swagger.v3.core.converter.AnnotatedType;
import io.swagger.v3.core.converter.ModelConverters;
import io.swagger.v3.oas.models.media.Schema;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AssignableTypeFilter;

/**
 * The OpenAPI schemas springdoc builds from the record DTOs, checked without a database: Bean
 * Validation becomes required / maxLength / pattern, enums are shared named schemas, response
 * records list every field as required with the nullable ones marked, and no two records share a
 * schema name. Uses its own ModelConverters with {@link RecordSchemaConverter}, as springdoc does.
 */
class OpenApiSchemaTest {

    private static final ModelConverters CONVERTERS = new ModelConverters();

    @BeforeAll
    static void configureLikeSpringdoc() {
        OpenApiConfig.enableEnumsAsRef();
        CONVERTERS.addConverter(new RecordSchemaConverter());
    }

    @SuppressWarnings("rawtypes")
    private static Map<String, Schema> schemasOf(Class<?> type) {
        return CONVERTERS.readAll(new AnnotatedType(type));
    }

    @Test
    @SuppressWarnings("rawtypes")
    void validationAnnotationsOnRecordComponentsBecomeSchemaConstraints() {
        Map<String, Schema> schemas = schemasOf(CreateUserRequest.class);
        Schema request = schemas.get("CreateUserRequest");
        Map<String, Schema> properties = request.getProperties();

        // @NotNull / @NotBlank → required; optional profile codes are not required
        assertThat(request.getRequired()).containsExactlyInAnyOrder("username", "email", "password", "fullName", "role");
        // @Size(max) → maxLength, @Pattern → pattern
        assertThat(properties.get("email").getMaxLength()).isEqualTo(255);
        assertThat(properties.get("fullName").getMaxLength()).isEqualTo(255);
        assertThat(properties.get("studentCode").getMaxLength()).isEqualTo(30);
        assertThat(properties.get("username").getPattern()).isEqualTo("^[a-z0-9._]{4,50}$");
    }

    @Test
    @SuppressWarnings("rawtypes")
    void enumsAreNamedSchemasReferencedFromDtos() {
        Map<String, Schema> schemas = schemasOf(CreateUserRequest.class);

        Schema role = (Schema) schemas.get("CreateUserRequest").getProperties().get("role");
        assertThat(role.get$ref())
                .isEqualTo("#/components/schemas/UserRole");
        assertThat(schemas.get("UserRole").getEnum())
                .containsExactlyInAnyOrder("TRAINING_ADMIN", "TRAINING_MANAGER", "INSTRUCTOR", "STUDENT");
        assertThat(schemasOf(ChangeRoleRequest.class).get("ChangeRoleRequest").getRequired()).containsExactly("role");
    }

    @Test
    @SuppressWarnings("rawtypes")
    void classRequestKeepsSemesterLimitAndRequiredDates() {
        Schema request = schemasOf(ClassRequest.class).get("ClassRequest");

        assertThat(request.getRequired()).contains("semester", "startDate", "endDate", "cancelDeadline", "maxCapacity");
        Schema semester = (Schema) request.getProperties().get("semester");
        assertThat(semester.getMaxLength()).isEqualTo(20);
        Schema capacity = (Schema) request.getProperties().get("maxCapacity");
        assertThat(capacity.getMinimum()).isEqualByComparingTo("1");
        assertThat(capacity.getMaximum()).isEqualByComparingTo("500");
    }

    @Test
    @SuppressWarnings("rawtypes")
    void responseRecordsListTheirFieldsAndClassViewIsOneOfBothVariants() {
        Schema user = schemasOf(UserResponse.class).get("UserResponse");
        assertThat(user.getProperties()).containsKeys("id", "username", "role", "isActive", "createdAt", "failedLoginCount");

        Schema classView = schemasOf(ClassView.class).get("ClassView");
        assertThat(classView.getOneOf()).extracting(s -> ((Schema) s).get$ref()).containsExactlyInAnyOrder(
                "#/components/schemas/ClassResponse", "#/components/schemas/ClassSummaryResponse");
    }

    @Test
    @SuppressWarnings("rawtypes")
    void everyResponseFieldIsRequiredAndOnlyNullableOnesAreMarked() {
        Schema user = schemasOf(UserResponse.class).get("UserResponse");

        assertThat(user.getRequired()).containsExactlyInAnyOrder("id", "username", "email", "fullName", "role",
                "isActive", "lockedUntil", "createdAt", "failedLoginCount");
        assertThat(((Schema) user.getProperties().get("lockedUntil")).getNullable()).isTrue();
        assertThat(((Schema) user.getProperties().get("username")).getNullable()).isNull();
    }

    @Test
    @SuppressWarnings("rawtypes")
    void nestedRecordsHaveTheirOwnNamesAndNullableEnumsKeepTheirReference() {
        Map<String, Schema> results = schemasOf(ClassResultsResponse.class);
        Map<String, Schema> attendance = schemasOf(AttendanceSheetResponse.class);

        assertThat(results).containsKey("ClassResultItem").doesNotContainKey("Item");
        assertThat(attendance).containsKey("AttendanceItem").doesNotContainKey("Item");

        Schema item = results.get("ClassResultItem");
        assertThat(item.getRequired()).contains("midtermScore", "finalStatus", "studentId");
        assertThat(((Schema) item.getProperties().get("midtermScore")).getNullable()).isTrue();
        Schema finalStatus = (Schema) item.getProperties().get("finalStatus");
        assertThat(finalStatus.getNullable()).isTrue();
        assertThat(finalStatus.getAllOf()).extracting(s -> ((Schema) s).get$ref())
                .containsExactly("#/components/schemas/FinalStatus");
    }

    @Test
    @SuppressWarnings("rawtypes")
    void fieldsLeftOutOfTheJsonStayOptional() {
        Schema alerts = schemasOf(SecurityAlertsResponse.class).get("SecurityAlertsResponse");

        // recentEvents is omitted for Managers (@JsonInclude NON_NULL), so it is not required
        assertThat(alerts.getRequired()).containsExactlyInAnyOrder("from", "to", "counts");

        // A-21: an event may have no username or IP; its time is always set
        Schema event = schemasOf(SecurityAlertsResponse.class).get("Event");
        assertThat(((Schema) event.getProperties().get("username")).getNullable()).isTrue();
        assertThat(((Schema) event.getProperties().get("ipAddress")).getNullable()).isTrue();
        assertThat(((Schema) event.getProperties().get("createdAt")).getNullable()).isNull();
    }

    @Test
    @SuppressWarnings("rawtypes")
    void classSummaryGradingStatusIsOptionalAndNullable() {
        Schema summary = schemasOf(ClassSummaryResponse.class).get("ClassSummaryResponse");

        // gradingStatus is omitted unless the viewer is the assigned Instructor (@JsonInclude NON_NULL)
        assertThat(summary.getProperties()).containsKey("gradingStatus");
        assertThat(summary.getRequired()).doesNotContain("gradingStatus").contains("classCode", "status");
        assertThat(((Schema) summary.getProperties().get("gradingStatus")).getNullable()).isTrue();
        assertThat(summary.getProperties()).doesNotContainKeys("cancelReason", "createdBy", "midtermWeight",
                "finalWeight");
    }

    @Test
    @SuppressWarnings("rawtypes")
    void optionalRequestFieldsAcceptNull() {
        Schema request = schemasOf(UpdateStudentRequest.class).get("UpdateStudentRequest");

        assertThat(request.getRequired()).containsExactly("studentCode");
        assertThat(((Schema) request.getProperties().get("dateOfBirth")).getNullable()).isTrue();
        assertThat(((Schema) request.getProperties().get("homeroomClass")).getNullable()).isTrue();
        assertThat(((Schema) request.getProperties().get("studentCode")).getNullable()).isNull();
    }

    @Test
    @SuppressWarnings("rawtypes")
    void noTwoDtoRecordsShareASchemaName() {
        ClassPathScanningCandidateComponentProvider scanner = new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AssignableTypeFilter(Record.class));
        List<Class<?>> records = new ArrayList<>();
        for (BeanDefinition definition : scanner.findCandidateComponents("com.p02.training.dto")) {
            try {
                records.add(Class.forName(definition.getBeanClassName()));
            } catch (ClassNotFoundException ex) {
                throw new IllegalStateException(ex);
            }
        }
        assertThat(records).hasSizeGreaterThan(40);

        Map<String, Class<?>> owners = new HashMap<>();
        for (Class<?> type : records) {
            io.swagger.v3.oas.annotations.media.Schema annotation =
                    type.getAnnotation(io.swagger.v3.oas.annotations.media.Schema.class);
            String name = annotation != null && !annotation.name().isEmpty() ? annotation.name() : type.getSimpleName();
            Class<?> previous = owners.putIfAbsent(name, type);
            assertThat(previous).as("schema name %s used by %s and %s", name, previous, type).isNull();
        }
        assertThat(owners).doesNotContainKey("Item");
    }
}
