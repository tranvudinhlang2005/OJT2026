package com.p02.training.entity;

import static org.assertj.core.api.Assertions.assertThat;

import com.p02.training.entity.enums.AttendanceStatus;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.EnrollmentStatus;
import com.p02.training.entity.enums.FinalStatus;
import com.p02.training.entity.enums.GradingStatus;
import com.p02.training.entity.enums.ScoreType;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.entity.enums.StudentStatus;
import com.p02.training.entity.enums.UserRole;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.metamodel.mapping.SelectableConsumer;
import org.hibernate.persister.entity.EntityPersister;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Compares entities with the live catalog of the test database, read-only. ddl-auto=validate only
 * checks columns an entity maps, so it cannot notice a database column that no entity maps, or a
 * wrong nullability, length, precision or scale. Those are checked here.
 */
@SpringBootTest
@EnabledIfEnvironmentVariable(named = "DB_PASSWORD", matches = ".+")
class EntitySchemaMappingTest {

    private static final Map<Class<?>, String> ENTITIES = expectedEntities();

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static Map<Class<?>, String> expectedEntities() {
        Map<Class<?>, String> entities = new LinkedHashMap<>();
        entities.put(User.class, "users");
        entities.put(Student.class, "student");
        entities.put(Instructor.class, "instructor");
        entities.put(Course.class, "course");
        entities.put(InstructorCourse.class, "instructor_course");
        entities.put(Room.class, "room");
        entities.put(ClassOffering.class, "class_offering");
        entities.put(Session.class, "session");
        entities.put(Enrollment.class, "enrollment");
        entities.put(Attendance.class, "attendance");
        entities.put(AssessmentResult.class, "assessment_result");
        entities.put(GradeAuditLog.class, "grade_audit_log");
        entities.put(AppSecurityLog.class, "app_security_log");
        return entities;
    }

    private static List<Class<?>> entityClasses() {
        return new ArrayList<>(ENTITIES.keySet());
    }

    @Test
    void hibernateManagesExactlyTheThirteenEntities() {
        Set<Class<?>> managed = new HashSet<>();
        entityManagerFactory.getMetamodel().getEntities().forEach(type -> managed.add(type.getJavaType()));

        assertThat(managed).containsExactlyInAnyOrderElementsOf(ENTITIES.keySet());
    }

    @Test
    void entitiesAndDatabaseHaveExactlyTheSameTablesWithNoJoinTables() {
        List<String> tables = jdbcTemplate.queryForList(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'flyway_schema_history'",
                String.class);

        assertThat(tables).containsExactlyInAnyOrderElementsOf(ENTITIES.values());
    }

    @ParameterizedTest
    @MethodSource("entityClasses")
    void tableNameIsExplicitAndCorrect(Class<?> entity) {
        assertThat(entity.isAnnotationPresent(Entity.class)).isTrue();
        assertThat(entity.getAnnotation(Table.class).name()).isEqualTo(ENTITIES.get(entity));
    }

    @ParameterizedTest
    @MethodSource("entityClasses")
    void columnsMatchTheCatalogInBothDirections(Class<?> entity) {
        Map<String, String> database = databaseColumns(ENTITIES.get(entity));
        Map<String, String> mapped = mappedColumns(entity);

        assertThat(mapped).containsExactlyInAnyOrderEntriesOf(database);
    }

    @Test
    void mapsAllColumnsInTheSchema() {
        int total = ENTITIES.keySet().stream().mapToInt(entity -> mappedColumns(entity).size()).sum();

        assertThat(total).isEqualTo(137);
    }

    @ParameterizedTest
    @MethodSource("entityClasses")
    void associationsAreLazyWithNoCascadeOrInverseCollection(Class<?> entity) {
        for (Field field : allFields(entity)) {
            assertThat(field.isAnnotationPresent(OneToMany.class)).as(field.toString()).isFalse();
            assertThat(field.isAnnotationPresent(ManyToMany.class)).as(field.toString()).isFalse();
            ManyToOne manyToOne = field.getAnnotation(ManyToOne.class);
            if (manyToOne != null) {
                assertThat(manyToOne.fetch()).as(field.toString()).isEqualTo(FetchType.LAZY);
                assertThat(manyToOne.cascade()).as(field.toString()).isEmpty();
            }
            OneToOne oneToOne = field.getAnnotation(OneToOne.class);
            if (oneToOne != null) {
                assertThat(oneToOne.fetch()).as(field.toString()).isEqualTo(FetchType.LAZY);
                assertThat(oneToOne.cascade()).as(field.toString()).isEmpty();
                assertThat(oneToOne.mappedBy()).as(field.toString()).isEmpty();
            }
        }
    }

    @Test
    void onlyClassOfferingVersionIsAJpaVersion() {
        List<String> versions = new ArrayList<>();
        for (Class<?> entity : ENTITIES.keySet()) {
            for (Field field : allFields(entity)) {
                if (field.isAnnotationPresent(Version.class)) {
                    versions.add(entity.getSimpleName() + "." + field.getName());
                }
            }
        }

        assertThat(versions).containsExactly("ClassOffering.version");
    }

    @Test
    void softDeleteColumnCannotBeSetByApplicationCode() {
        assertThat(Arrays.stream(ClassOffering.class.getMethods()).map(java.lang.reflect.Method::getName))
                .doesNotContain("setDeletedAt");
    }

    @Test
    void enumValuesMatchDatabaseCheckConstraintsExactly() {
        assertEnumMatches("ck_users_role", UserRole.class);
        assertEnumMatches("ck_student_status", StudentStatus.class);
        assertEnumMatches("ck_co_status", ClassStatus.class);
        assertEnumMatches("ck_co_grading_status", GradingStatus.class);
        assertEnumMatches("ck_enrollment_status", EnrollmentStatus.class);
        assertEnumMatches("ck_attendance_status", AttendanceStatus.class);
        assertEnumMatches("ck_ar_final_status", FinalStatus.class);
        assertEnumMatches("ck_gal_score_type", ScoreType.class);
    }

    @Test
    void securityActionsHaveNoDatabaseCheckAndAllFitTheColumn() {
        Integer checks = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM pg_constraint WHERE conrelid = 'app_security_log'::regclass AND contype = 'c'",
                Integer.class);

        assertThat(checks).isZero();
        assertThat(SecurityAction.values()).hasSize(24);
        assertThat(SecurityAction.values()).allSatisfy(action -> assertThat(action.name().length()).isLessThanOrEqualTo(30));
    }

    private void assertEnumMatches(String constraint, Class<? extends Enum<?>> enumType) {
        String definition = jdbcTemplate.queryForObject(
                "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = ?", String.class, constraint);
        Set<String> allowed = new TreeSet<>();
        Matcher matcher = Pattern.compile("'([A-Z_]+)'").matcher(definition);
        while (matcher.find()) {
            allowed.add(matcher.group(1));
        }
        Set<String> values = new TreeSet<>();
        for (Enum<?> constant : enumType.getEnumConstants()) {
            values.add(constant.name());
        }

        assertThat(values).as(constraint).isEqualTo(allowed);
    }

    private Map<String, String> databaseColumns(String table) {
        Map<String, String> columns = new TreeMap<>();
        jdbcTemplate.query(
                """
                SELECT column_name, is_nullable, character_maximum_length, numeric_precision, numeric_scale, data_type
                FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ?
                """,
                rs -> {
                    boolean numeric = "numeric".equals(rs.getString("data_type"));
                    Integer length = rs.getObject("character_maximum_length", Integer.class);
                    columns.put(rs.getString("column_name"), describe(
                            "YES".equals(rs.getString("is_nullable")),
                            length == null ? null : length.longValue(),
                            numeric ? rs.getObject("numeric_precision", Integer.class) : null,
                            numeric ? rs.getObject("numeric_scale", Integer.class) : null));
                },
                table);
        return columns;
    }

    private Map<String, String> mappedColumns(Class<?> entity) {
        EntityPersister persister = entityManagerFactory.unwrap(SessionFactoryImplementor.class)
                .getMappingMetamodel().getEntityDescriptor(entity);
        Map<String, String> columns = new TreeMap<>();
        SelectableConsumer collector = (index, column) -> {
            Class<?> javaType = column.getJdbcMapping().getJavaTypeDescriptor().getJavaTypeClass();
            boolean numeric = javaType == BigDecimal.class;
            boolean character = !"text".equals(column.getColumnDefinition()) && isCharacter(javaType);
            columns.put(column.getSelectionExpression(), describe(
                    column.isNullable(),
                    character ? column.getLength() : null,
                    numeric ? column.getPrecision() : null,
                    numeric ? column.getScale() : null));
        };
        // Hibernate lists identifier columns separately from attribute columns.
        persister.getIdentifierMapping().forEachSelectable(collector);
        persister.forEachSelectable(collector);
        return columns;
    }

    private static boolean isCharacter(Class<?> javaType) {
        return javaType == String.class || javaType.isEnum();
    }

    private static String describe(boolean nullable, Long length, Integer precision, Integer scale) {
        return "nullable=" + nullable + " length=" + length + " precision=" + precision + " scale=" + scale;
    }

    private static List<Field> allFields(Class<?> type) {
        List<Field> fields = new ArrayList<>();
        for (Class<?> current = type; current != null && current != Object.class; current = current.getSuperclass()) {
            fields.addAll(Arrays.asList(current.getDeclaredFields()));
        }
        return fields;
    }
}
