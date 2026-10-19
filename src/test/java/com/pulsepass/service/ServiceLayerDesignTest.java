package com.pulsepass.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.pulsepass.service.impl.ArtistServiceImpl;
import com.pulsepass.service.impl.AuthServiceImpl;
import com.pulsepass.service.impl.EventServiceImpl;
import com.pulsepass.service.impl.TicketServiceImpl;
import com.pulsepass.service.impl.UserServiceImpl;
import com.pulsepass.service.impl.VenueServiceImpl;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Verifica por reflexión los principios SRV-001..SRV-004 sin levantar Spring. */
class ServiceLayerDesignTest {

    private static final List<Class<?>> INTERFACES = List.of(
            VenueService.class, ArtistService.class, EventService.class, UserService.class, TicketService.class,
            AuthService.class);
    private static final List<Class<?>> IMPLEMENTATIONS = List.of(
            VenueServiceImpl.class, ArtistServiceImpl.class, EventServiceImpl.class,
            UserServiceImpl.class, TicketServiceImpl.class, AuthServiceImpl.class);
    private static final Set<String> WRITE_METHODS =
            Set.of("create", "publish", "addArtist", "register", "purchase", "cancel", "markAsUsed");

    @Test
    void SRV_001_noServiceContractExposesJpaEntities() {
        for (Class<?> type : INTERFACES) {
            for (Method method : type.getMethods()) {
                assertThat(method.getReturnType().getPackageName())
                        .as("%s.%s return type", type.getSimpleName(), method.getName())
                        .doesNotContain("domain.model");
                assertThat(method.getGenericReturnType().getTypeName())
                        .as("%s.%s generic return type", type.getSimpleName(), method.getName())
                        .doesNotContain("domain.model");
                Arrays.stream(method.getGenericParameterTypes()).forEach(p ->
                        assertThat(p.getTypeName()).doesNotContain("domain.model"));
            }
        }
    }

    @Test
    void SRV_002_implementationsUseFinalFieldsAndAreServices() {
        for (Class<?> impl : IMPLEMENTATIONS) {
            assertThat(impl.isAnnotationPresent(Service.class)).as(impl.getSimpleName()).isTrue();
            for (Field field : impl.getDeclaredFields()) {
                assertThat(Modifier.isFinal(field.getModifiers()))
                        .as("%s.%s must be final", impl.getSimpleName(), field.getName()).isTrue();
            }
        }
    }

    @Test
    void SRV_004_writesAreTransactional_readsAreReadOnly() {
        for (Class<?> impl : IMPLEMENTATIONS) {
            for (Method method : impl.getDeclaredMethods()) {
                if (!Modifier.isPublic(method.getModifiers())) {
                    continue;
                }
                Transactional tx = method.getAnnotation(Transactional.class);
                assertThat(tx).as("%s.%s", impl.getSimpleName(), method.getName()).isNotNull();
                boolean write = WRITE_METHODS.contains(method.getName());
                assertThat(tx.readOnly())
                        .as("%s.%s readOnly", impl.getSimpleName(), method.getName())
                        .isEqualTo(!write);
            }
        }
    }
}
