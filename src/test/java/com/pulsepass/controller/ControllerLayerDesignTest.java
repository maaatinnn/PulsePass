package com.pulsepass.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

/** Verifica por reflexión CTRL-001..CTRL-004 (AC-CTRL015 y AC-CTRL016) sin levantar Spring. */
class ControllerLayerDesignTest {

    private static final List<Class<?>> CONTROLLERS = List.of(
            VenueController.class, EventController.class, ArtistController.class,
            UserController.class, TicketController.class, AuthController.class);

    @Test
    void AC_CTRL_015_noControllerDependsOnARepository() {
        for (Class<?> controller : CONTROLLERS) {
            for (Field field : controller.getDeclaredFields()) {
                assertThat(field.getType().getPackageName())
                        .as("%s.%s", controller.getSimpleName(), field.getName())
                        .doesNotContain("repository");
                assertThat(Modifier.isFinal(field.getModifiers()))
                        .as("%s.%s must be final", controller.getSimpleName(), field.getName()).isTrue();
            }
        }
    }

    @Test
    void AC_CTRL_016_noEndpointExposesJpaEntitiesAndAllReturnResponseEntity() {
        for (Class<?> controller : CONTROLLERS) {
            assertThat(controller.isAnnotationPresent(RestController.class)).isTrue();
            for (Method method : controller.getDeclaredMethods()) {
                if (!Modifier.isPublic(method.getModifiers())) {
                    continue;
                }
                assertThat(method.getReturnType())
                        .as("%s.%s", controller.getSimpleName(), method.getName())
                        .isEqualTo(ResponseEntity.class);
                assertThat(method.getGenericReturnType().getTypeName())
                        .as("%s.%s", controller.getSimpleName(), method.getName())
                        .doesNotContain("domain.model");
            }
        }
    }
}
