package com.pulsepass.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pulsepass.domain.model.Artist;
import com.pulsepass.domain.model.Venue;
import com.pulsepass.dto.response.ArtistResponse;
import com.pulsepass.dto.response.VenueResponse;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.mapper.ArtistMapper;
import com.pulsepass.mapper.VenueMapper;
import com.pulsepass.repository.ArtistRepository;
import com.pulsepass.repository.VenueRepository;
import com.pulsepass.service.impl.ArtistServiceImpl;
import com.pulsepass.service.impl.VenueServiceImpl;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

class VenueArtistServicesTest {

    @Nested
    @ExtendWith(MockitoExtension.class)
    class VenueServiceTests {

        @Mock VenueRepository venueRepository;
        @Mock VenueMapper venueMapper;
        @InjectMocks VenueServiceImpl service;

        @Test
        void findByCode_existing_returnsDto() {
            Venue venue = new Venue("VEN-SMR-01", "Marina Convention Center", "Santa Marta", "Calle 1", 3);
            VenueResponse expected = new VenueResponse(1L, "VEN-SMR-01", "Marina Convention Center",
                    "Santa Marta", "Calle 1", 3, true);
            when(venueRepository.findByCode("VEN-SMR-01")).thenReturn(Optional.of(venue));
            when(venueMapper.toResponse(venue)).thenReturn(expected);

            assertThat(service.findByCode("VEN-SMR-01")).isEqualTo(expected);
        }

        @Test
        void findByCode_unknown_throwsResourceNotFound() {
            when(venueRepository.findByCode("X")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.findByCode("X"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessage("Venue not found: X");
        }

        @Test
        void findActiveVenues_usesActiveQueryAndMaps() {
            Venue venue = new Venue("VEN-SMR-01", "Marina", "Santa Marta", "Calle 1", 3);
            VenueResponse dto = new VenueResponse(1L, "VEN-SMR-01", "Marina", "Santa Marta", "Calle 1", 3, true);
            when(venueRepository.findByActiveTrueOrderByNameAsc()).thenReturn(List.of(venue));
            when(venueMapper.toResponse(venue)).thenReturn(dto);

            assertThat(service.findActiveVenues()).containsExactly(dto);
            verify(venueRepository).findByActiveTrueOrderByNameAsc();
        }
    }

    @Nested
    @ExtendWith(MockitoExtension.class)
    class ArtistServiceTests {

        @Mock ArtistRepository artistRepository;
        @Mock ArtistMapper artistMapper;
        @InjectMocks ArtistServiceImpl service;

        private final Artist artist = new Artist("Solar Beat", "CO", "Pop");
        private final ArtistResponse dto = new ArtistResponse(1L, "Solar Beat", "CO", "Pop", true);

        @Test
        void findById_existing_returnsDto() {
            when(artistRepository.findById(1L)).thenReturn(Optional.of(artist));
            when(artistMapper.toResponse(artist)).thenReturn(dto);

            assertThat(service.findById(1L)).isEqualTo(dto);
        }

        @Test
        void findById_unknown_throwsResourceNotFound() {
            when(artistRepository.findById(9L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.findById(9L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessage("Artist not found: 9");
        }

        @Test
        void findByStageName_isCaseInsensitive() {
            when(artistRepository.findByStageNameIgnoreCase("solar beat")).thenReturn(Optional.of(artist));
            when(artistMapper.toResponse(artist)).thenReturn(dto);

            assertThat(service.findByStageName("solar beat")).isEqualTo(dto);
        }

        @Test
        void findByStageName_unknown_throwsResourceNotFound() {
            when(artistRepository.findByStageNameIgnoreCase("Ghost")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.findByStageName("Ghost"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        void findActiveArtists_usesActiveQueryAndMaps() {
            when(artistRepository.findByActiveTrueOrderByStageNameAsc()).thenReturn(List.of(artist));
            when(artistMapper.toResponse(artist)).thenReturn(dto);

            assertThat(service.findActiveArtists()).containsExactly(dto);
            verify(artistRepository).findByActiveTrueOrderByStageNameAsc();
        }
    }
}
