package com.pulsepass.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pulsepass.domain.enums.EventCategory;
import com.pulsepass.domain.enums.EventStatus;
import com.pulsepass.domain.model.Artist;
import com.pulsepass.domain.model.Event;
import com.pulsepass.domain.model.Venue;
import com.pulsepass.dto.request.CreateArtistRequest;
import com.pulsepass.dto.request.CreateVenueRequest;
import com.pulsepass.dto.response.ArtistResponse;
import com.pulsepass.dto.response.VenueResponse;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.DuplicateResourceException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.mapper.ArtistMapper;
import com.pulsepass.mapper.VenueMapper;
import com.pulsepass.repository.ArtistRepository;
import com.pulsepass.repository.VenueRepository;
import com.pulsepass.service.impl.ArtistServiceImpl;
import com.pulsepass.service.impl.VenueServiceImpl;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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

        @Test
        void findAll_usesUnfilteredQueryAndMaps() {
            Venue venue = new Venue("VEN-SMR-01", "Marina", "Santa Marta", "Calle 1", 3);
            VenueResponse dto = new VenueResponse(1L, "VEN-SMR-01", "Marina", "Santa Marta", "Calle 1", 3, false);
            when(venueRepository.findAllByOrderByNameAsc()).thenReturn(List.of(venue));
            when(venueMapper.toResponse(venue)).thenReturn(dto);

            assertThat(service.findAll()).containsExactly(dto);
            verify(venueRepository).findAllByOrderByNameAsc();
        }

        @Test
        void create_valid_savesTrimmedVenueAndReturnsDto() {
            VenueResponse dto = new VenueResponse(1L, "VEN-NEW", "Nueva Sede", "Bogotá", null, 500, true);
            when(venueRepository.existsByCode("VEN-NEW")).thenReturn(false);
            when(venueRepository.save(any(Venue.class))).thenAnswer(inv -> inv.getArgument(0));
            when(venueMapper.toResponse(any(Venue.class))).thenReturn(dto);

            VenueResponse result = service.create(new CreateVenueRequest(
                    " VEN-NEW ", " Nueva Sede ", " Bogotá ", "   ", 500));

            assertThat(result).isEqualTo(dto);
            ArgumentCaptor<Venue> captor = ArgumentCaptor.forClass(Venue.class);
            verify(venueRepository).save(captor.capture());
            Venue saved = captor.getValue();
            assertThat(saved.getCode()).isEqualTo("VEN-NEW");
            assertThat(saved.getName()).isEqualTo("Nueva Sede");
            assertThat(saved.getCity()).isEqualTo("Bogotá");
            assertThat(saved.getAddress()).isNull();
            assertThat(saved.getCapacity()).isEqualTo(500);
            assertThat(saved.isActive()).isTrue();
        }

        @Test
        void create_duplicateCode_throwsDuplicateResource() {
            when(venueRepository.existsByCode("VEN-SMR-01")).thenReturn(true);

            assertThatThrownBy(() -> service.create(new CreateVenueRequest(
                    "VEN-SMR-01", "Marina", "Santa Marta", null, 3)))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessage("Venue already exists: VEN-SMR-01");
            verify(venueRepository, never()).save(any());
        }

        @Test
        void create_nonPositiveCapacity_throwsBusinessRule() {
            assertThatThrownBy(() -> service.create(new CreateVenueRequest(
                    "VEN-NEW", "Nueva", "Bogotá", null, 0)))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessage("Capacity must be greater than or equal to 1.");
            verify(venueRepository, never()).save(any());
        }

        @Test
        void create_blankName_throwsBusinessRule() {
            assertThatThrownBy(() -> service.create(new CreateVenueRequest(
                    "VEN-NEW", " ", "Bogotá", null, 10)))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessage("name is required.");
        }

        @Test
        void delete_withoutEvents_deletesVenue() {
            Venue venue = new Venue("VEN-SMR-01", "Marina", "Santa Marta", "Calle 1", 3);
            when(venueRepository.findByCode("VEN-SMR-01")).thenReturn(Optional.of(venue));

            service.delete("VEN-SMR-01");

            verify(venueRepository).delete(venue);
        }

        @Test
        void delete_withEvents_throwsBusinessRuleAndKeepsVenue() {
            Venue venue = new Venue("VEN-SMR-01", "Marina", "Santa Marta", "Calle 1", 3);
            venue.addEvent(new Event("CMF-2026", "Caribbean Music Fest", EventCategory.MUSIC,
                    EventStatus.DRAFT, LocalDateTime.of(2026, 12, 12, 20, 0), venue));
            when(venueRepository.findByCode("VEN-SMR-01")).thenReturn(Optional.of(venue));

            assertThatThrownBy(() -> service.delete("VEN-SMR-01"))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessage("Cannot delete venue VEN-SMR-01: it has 1 associated event(s).");
            verify(venueRepository, never()).delete(any(Venue.class));
        }

        @Test
        void delete_unknown_throwsResourceNotFound() {
            when(venueRepository.findByCode("X")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.delete("X"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessage("Venue not found: X");
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

        @Test
        void findAll_usesUnfilteredQueryAndMaps() {
            when(artistRepository.findAllByOrderByStageNameAsc()).thenReturn(List.of(artist));
            when(artistMapper.toResponse(artist)).thenReturn(dto);

            assertThat(service.findAll()).containsExactly(dto);
            verify(artistRepository).findAllByOrderByStageNameAsc();
        }

        @Test
        void create_valid_savesTrimmedArtistAndReturnsDto() {
            when(artistRepository.existsByStageNameIgnoreCase("Nuevo Artista")).thenReturn(false);
            when(artistRepository.save(any(Artist.class))).thenAnswer(inv -> inv.getArgument(0));
            when(artistMapper.toResponse(any(Artist.class))).thenReturn(dto);

            ArtistResponse result = service.create(new CreateArtistRequest("  Nuevo Artista ", " CO ", "  "));

            assertThat(result).isEqualTo(dto);
            ArgumentCaptor<Artist> captor = ArgumentCaptor.forClass(Artist.class);
            verify(artistRepository).save(captor.capture());
            Artist saved = captor.getValue();
            assertThat(saved.getStageName()).isEqualTo("Nuevo Artista");
            assertThat(saved.getCountry()).isEqualTo("CO");
            assertThat(saved.getGenre()).isNull();
            assertThat(saved.isActive()).isTrue();
        }

        @Test
        void create_duplicateStageName_throwsDuplicateResource() {
            when(artistRepository.existsByStageNameIgnoreCase("Solar Beat")).thenReturn(true);

            assertThatThrownBy(() -> service.create(new CreateArtistRequest("Solar Beat", null, null)))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessage("Artist already exists: Solar Beat");
            verify(artistRepository, never()).save(any());
        }

        @Test
        void create_blankStageName_throwsBusinessRule() {
            assertThatThrownBy(() -> service.create(new CreateArtistRequest("   ", null, null)))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessage("stageName is required.");
            verify(artistRepository, never()).save(any());
        }

        @Test
        void delete_withoutEvents_deletesArtist() {
            when(artistRepository.findById(1L)).thenReturn(Optional.of(artist));
            when(artistRepository.countEventsByArtistId(1L)).thenReturn(0L);

            service.delete(1L);

            verify(artistRepository).delete(artist);
        }

        @Test
        void delete_associatedToEvents_throwsBusinessRuleAndKeepsArtist() {
            when(artistRepository.findById(1L)).thenReturn(Optional.of(artist));
            when(artistRepository.countEventsByArtistId(1L)).thenReturn(2L);

            assertThatThrownBy(() -> service.delete(1L))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessage("Cannot delete artist Solar Beat: it is associated with 2 event(s).");
            verify(artistRepository, never()).delete(any(Artist.class));
        }

        @Test
        void delete_unknown_throwsResourceNotFound() {
            when(artistRepository.findById(9L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.delete(9L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessage("Artist not found: 9");
        }
    }
}
