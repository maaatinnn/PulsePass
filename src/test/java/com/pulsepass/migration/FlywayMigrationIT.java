package com.pulsepass.migration;

import static org.assertj.core.api.Assertions.assertThat;

import com.pulsepass.domain.model.Artist;
import com.pulsepass.repository.ArtistRepository;
import com.pulsepass.support.AbstractPostgresIT;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;

class FlywayMigrationIT extends AbstractPostgresIT {

    @Autowired ArtistRepository artistRepository;
    @Autowired Environment environment;

    @Test
    void appliesV1V2V3FromEmptyDatabase() {
        List<String> versions = jdbc.queryForList(
                "SELECT version FROM flyway_schema_history WHERE success = true ORDER BY installed_rank",
                String.class);

        assertThat(versions).containsExactly("1", "2", "3");
    }

    @Test
    void v1CreatesAllTables() {
        List<String> tables = jdbc.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
                String.class);

        assertThat(tables).contains("venues", "events", "artists", "event_artists",
                "users", "user_profiles", "tickets");
    }

    @Test
    void v2InsertsInitialArtists() {
        assertThat(artistRepository.findAll())
                .extracting(Artist::getStageName)
                .containsExactlyInAnyOrder("Solar Beat", "Neon Waves", "Caribbean Sound",
                        "Ocean Drive", "Digital Pulse");
    }

    @Test
    void v3AddsNullableStreamingUrl() {
        Map<String, Object> column = jdbc.queryForMap("""
                SELECT is_nullable, character_maximum_length
                FROM information_schema.columns
                WHERE table_name = 'events' AND column_name = 'streaming_url'
                """);

        assertThat(column.get("is_nullable")).isEqualTo("YES");
        assertThat(((Number) column.get("character_maximum_length")).intValue()).isEqualTo(500);
    }

    @Test
    void hibernateOnlyValidatesTheSchema() {
        assertThat(environment.getProperty("spring.jpa.hibernate.ddl-auto")).isEqualTo("validate");
    }
}
