package com.pulsepass.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pulsepass.domain.enums.EventCategory;
import com.pulsepass.domain.enums.EventStatus;
import com.pulsepass.domain.enums.TicketStatus;
import com.pulsepass.domain.enums.TicketType;
import com.pulsepass.domain.model.Event;
import com.pulsepass.domain.model.Ticket;
import com.pulsepass.domain.model.User;
import com.pulsepass.domain.model.UserProfile;
import com.pulsepass.domain.model.Venue;
import com.pulsepass.dto.request.PurchaseTicketRequest;
import com.pulsepass.dto.response.TicketResponse;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.mapper.TicketMapper;
import com.pulsepass.repository.EventRepository;
import com.pulsepass.repository.TicketRepository;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.service.impl.TicketServiceImpl;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TicketServiceImplTest {

    private static final ZoneId ZONE = ZoneId.of("UTC");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 11, 10, 0);
    private static final LocalDateTime EVENT_DATE = LocalDateTime.of(2026, 12, 5, 19, 0);
    private static final int CAPACITY = 3;

    @Mock private TicketRepository ticketRepository;
    @Mock private UserRepository userRepository;
    @Mock private EventRepository eventRepository;
    @Mock private TicketMapper ticketMapper;

    private TicketServiceImpl service;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(NOW.atZone(ZONE).toInstant(), ZONE);
        service = new TicketServiceImpl(ticketRepository, userRepository, eventRepository, ticketMapper,
                new TicketPricingPolicy(new BigDecimal("100.00")), new TicketCodeGenerator(), clock);
    }

    // ------------------------------------------------------------------ helpers
    private static User user(String username, String email, boolean active, LocalDate birthDate) {
        User user = new User(username, email);
        user.setActive(active);
        UserProfile profile = new UserProfile(username, "Test");
        profile.setBirthDate(birthDate);
        user.setProfile(profile);
        return user;
    }

    private static Event event(EventStatus status, int minimumAge, LocalDateTime date) {
        Venue venue = new Venue("VEN-SMR-01", "Marina Convention Center", "Santa Marta", "Calle 1", CAPACITY);
        Event event = new Event("CMF-2026", "Caribbean Music Fest 2026", EventCategory.MUSIC, status, date, venue);
        event.setMinimumAge(minimumAge);
        return event;
    }

    private static Ticket ticket(TicketStatus status, Event event) {
        return new Ticket("TKT-1", TicketType.GENERAL, new BigDecimal("100.00"), status,
                NOW.minusDays(5), user("andrea", "andrea@email.com", true, LocalDate.of(2001, 1, 1)), event);
    }

    private static PurchaseTicketRequest request(String email, TicketType type) {
        return new PurchaseTicketRequest(email, "CMF-2026", type);
    }

    private static TicketResponse dto() {
        return new TicketResponse(1L, "TKT-1", TicketType.VIP, new BigDecimal("250.00"), TicketStatus.PAID,
                NOW, "andrea@email.com", "CMF-2026", "Caribbean Music Fest 2026");
    }

    private void givenUserAndEvent(User user, Event event) {
        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));
    }

    private void givenPaidTickets(long paid) {
        when(ticketRepository.countByEventEventCodeAndStatus("CMF-2026", TicketStatus.PAID)).thenReturn(paid);
    }

    private void givenSaveReturnsArgument() {
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(inv -> inv.getArgument(0));
        when(ticketMapper.toResponse(any(Ticket.class))).thenReturn(dto());
    }

    private void assertNothingPersisted() {
        verify(ticketRepository, never()).save(any());
        verify(eventRepository, never()).save(any());
    }

    // ------------------------------------------------------------------ purchase
    @Test
    void TEST_TICKET_001_purchase_validRequest_createsPaidTicketWithSystemPrice() {
        // ARRANGE
        User andrea = user("andrea", "andrea@email.com", true, LocalDate.of(2001, 1, 1));
        Event event = event(EventStatus.PUBLISHED, 18, EVENT_DATE);
        givenUserAndEvent(andrea, event);
        givenPaidTickets(0);
        givenSaveReturnsArgument();

        // ACT
        TicketResponse result = service.purchase(request("andrea@email.com", TicketType.VIP));

        // ASSERT
        ArgumentCaptor<Ticket> captor = ArgumentCaptor.forClass(Ticket.class);
        verify(ticketRepository).save(captor.capture());
        Ticket saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(TicketStatus.PAID);
        assertThat(saved.getType()).isEqualTo(TicketType.VIP);
        assertThat(saved.getPrice()).isEqualByComparingTo("250.00");
        assertThat(saved.getTicketCode()).startsWith("TKT-");
        assertThat(saved.getPurchaseDate()).isEqualTo(NOW);
        assertThat(saved.getUser()).isSameAs(andrea);
        assertThat(saved.getEvent()).isSameAs(event);
        assertThat(result).isEqualTo(dto());
        assertThat(event.getStatus()).isEqualTo(EventStatus.PUBLISHED);
        verify(eventRepository, never()).save(any());
    }

    @Test
    void TEST_TICKET_002_purchase_unknownUser_throwsResourceNotFound() {
        when(userRepository.findByEmailIgnoreCase("ghost@email.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.purchase(request("ghost@email.com", TicketType.GENERAL)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("ghost@email.com");

        assertNothingPersisted();
        verify(eventRepository, never()).findByEventCode(any());
    }

    @Test
    void TEST_TICKET_003_purchase_inactiveUser_throwsBusinessRule() { // AC-007
        User miguel = user("miguel", "miguel@email.com", false, LocalDate.of(1996, 1, 1));
        when(userRepository.findByEmailIgnoreCase("miguel@email.com")).thenReturn(Optional.of(miguel));

        assertThatThrownBy(() -> service.purchase(request("miguel@email.com", TicketType.GENERAL)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("inactive");

        assertNothingPersisted();
    }

    @Test
    void purchase_unknownEvent_throwsResourceNotFound() {
        User andrea = user("andrea", "andrea@email.com", true, LocalDate.of(2001, 1, 1));
        when(userRepository.findByEmailIgnoreCase("andrea@email.com")).thenReturn(Optional.of(andrea));
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.purchase(request("andrea@email.com", TicketType.GENERAL)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Event not found: CMF-2026");

        assertNothingPersisted();
    }

    @Test
    void TEST_TICKET_004_purchase_draftEvent_throwsBusinessRule() {
        User andrea = user("andrea", "andrea@email.com", true, LocalDate.of(2001, 1, 1));
        givenUserAndEvent(andrea, event(EventStatus.DRAFT, 18, EVENT_DATE));

        assertThatThrownBy(() -> service.purchase(request("andrea@email.com", TicketType.GENERAL)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("DRAFT");

        assertNothingPersisted();
    }

    @Test
    void TEST_TICKET_005_purchase_cancelledEvent_throwsBusinessRule() {
        User andrea = user("andrea", "andrea@email.com", true, LocalDate.of(2001, 1, 1));
        givenUserAndEvent(andrea, event(EventStatus.CANCELLED, 18, EVENT_DATE));

        assertThatThrownBy(() -> service.purchase(request("andrea@email.com", TicketType.GENERAL)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("CANCELLED");

        assertNothingPersisted();
    }

    @Test
    void purchase_soldOutOrFinishedEvent_throwsBusinessRule() { // BR-TICKET-004
        User andrea = user("andrea", "andrea@email.com", true, LocalDate.of(2001, 1, 1));
        when(userRepository.findByEmailIgnoreCase("andrea@email.com")).thenReturn(Optional.of(andrea));

        for (EventStatus status : List.of(EventStatus.SOLD_OUT, EventStatus.FINISHED)) {
            when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event(status, 18, EVENT_DATE)));

            assertThatThrownBy(() -> service.purchase(request("andrea@email.com", TicketType.GENERAL)))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining(status.name());
        }
        assertNothingPersisted();
    }

    @Test
    void purchase_eventAlreadyHappened_throwsBusinessRule() { // BR-TICKET-005
        User andrea = user("andrea", "andrea@email.com", true, LocalDate.of(2001, 1, 1));
        givenUserAndEvent(andrea, event(EventStatus.PUBLISHED, 18, NOW.minusDays(1)));

        assertThatThrownBy(() -> service.purchase(request("andrea@email.com", TicketType.GENERAL)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("already taken place");

        assertNothingPersisted();
    }

    @Test
    void TEST_TICKET_006_purchase_underageUser_throwsBusinessRule() { // AC-006
        User laura = user("laura", "laura@email.com", true, LocalDate.of(2009, 6, 15)); // 17 en el evento
        givenUserAndEvent(laura, event(EventStatus.PUBLISHED, 18, EVENT_DATE));

        assertThatThrownBy(() -> service.purchase(request("laura@email.com", TicketType.GENERAL)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("minimum age");

        assertNothingPersisted();
    }

    @Test
    void purchase_ageIsEvaluatedOnEventDate_notOnPurchaseDate() { // BR-TICKET-006
        // Hoy (2026-10-11) tiene 17, pero cumple 18 el 2026-11-01, antes del evento (2026-12-05).
        User almostAdult = user("ana", "ana@email.com", true, LocalDate.of(2008, 11, 1));
        givenUserAndEvent(almostAdult, event(EventStatus.PUBLISHED, 18, EVENT_DATE));
        givenPaidTickets(0);
        givenSaveReturnsArgument();

        assertThat(service.purchase(request("ana@email.com", TicketType.GENERAL))).isNotNull();
    }

    @Test
    void purchase_turnsEighteenOneDayAfterEvent_isRejected() {
        User user = user("bob", "bob@email.com", true, LocalDate.of(2008, 12, 6));
        givenUserAndEvent(user, event(EventStatus.PUBLISHED, 18, EVENT_DATE));

        assertThatThrownBy(() -> service.purchase(request("bob@email.com", TicketType.GENERAL)))
                .isInstanceOf(BusinessRuleException.class);

        assertNothingPersisted();
    }

    @Test
    void purchase_eventWithoutAgeRestriction_doesNotRequireBirthDate() {
        User noBirthDate = user("nobd", "nobd@email.com", true, null);
        givenUserAndEvent(noBirthDate, event(EventStatus.PUBLISHED, 0, EVENT_DATE));
        givenPaidTickets(0);
        givenSaveReturnsArgument();

        assertThat(service.purchase(request("nobd@email.com", TicketType.GENERAL))).isNotNull();
    }

    @Test
    void purchase_restrictedEventAndNoBirthDate_throwsBusinessRule() {
        User noBirthDate = user("nobd", "nobd@email.com", true, null);
        givenUserAndEvent(noBirthDate, event(EventStatus.PUBLISHED, 18, EVENT_DATE));

        assertThatThrownBy(() -> service.purchase(request("nobd@email.com", TicketType.GENERAL)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("birth date");

        assertNothingPersisted();
    }

    @Test
    void TEST_TICKET_007_purchase_noCapacityLeft_throwsBusinessRule() { // AC-009
        User andrea = user("andrea", "andrea@email.com", true, LocalDate.of(2001, 1, 1));
        Event event = event(EventStatus.PUBLISHED, 18, EVENT_DATE);
        givenUserAndEvent(andrea, event);
        givenPaidTickets(CAPACITY);

        assertThatThrownBy(() -> service.purchase(request("andrea@email.com", TicketType.GENERAL)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("no capacity");

        assertNothingPersisted();
    }

    @Test
    void TEST_TICKET_008_purchase_lastTicket_savesTicketAndMarksEventSoldOut() { // AC-008
        User carlos = user("carlos", "carlos@email.com", true, LocalDate.of(2005, 3, 1));
        Event event = event(EventStatus.PUBLISHED, 18, EVENT_DATE);
        givenUserAndEvent(carlos, event);
        givenPaidTickets(CAPACITY - 1);
        givenSaveReturnsArgument();

        service.purchase(request("carlos@email.com", TicketType.GENERAL));

        verify(ticketRepository).save(any(Ticket.class));
        verify(eventRepository).save(event);
        assertThat(event.getStatus()).isEqualTo(EventStatus.SOLD_OUT);
    }

    @Test
    void purchase_notTheLastTicket_keepsEventPublished() {
        User carlos = user("carlos", "carlos@email.com", true, LocalDate.of(2005, 3, 1));
        Event event = event(EventStatus.PUBLISHED, 18, EVENT_DATE);
        givenUserAndEvent(carlos, event);
        givenPaidTickets(CAPACITY - 2);
        givenSaveReturnsArgument();

        service.purchase(request("carlos@email.com", TicketType.GENERAL));

        assertThat(event.getStatus()).isEqualTo(EventStatus.PUBLISHED);
        verify(eventRepository, never()).save(any());
    }

    @Test
    void purchase_missingType_throwsBusinessRule() {
        assertThatThrownBy(() -> service.purchase(request("andrea@email.com", null)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("type");

        verify(userRepository, never()).findByEmailIgnoreCase(any());
        assertNothingPersisted();
    }

    @Test
    void purchase_failureWhileMarkingSoldOut_propagatesSoTransactionRollsBack() {
        User carlos = user("carlos", "carlos@email.com", true, LocalDate.of(2005, 3, 1));
        Event event = event(EventStatus.PUBLISHED, 18, EVENT_DATE);
        givenUserAndEvent(carlos, event);
        givenPaidTickets(CAPACITY - 1);
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(inv -> inv.getArgument(0));
        when(eventRepository.save(event)).thenThrow(new IllegalStateException("db down"));

        assertThatThrownBy(() -> service.purchase(request("carlos@email.com", TicketType.GENERAL)))
                .isInstanceOf(IllegalStateException.class);
    }

    // ------------------------------------------------------------------ escenario de aceptación
    @Test
    void acceptanceScenario_cmf2026_andreaCarlosLauraMiguelAndSoldOut() {
        Event event = event(EventStatus.PUBLISHED, 18, EVENT_DATE);
        User andrea = user("andrea", "andrea@email.com", true, LocalDate.of(2001, 1, 1));   // 25
        User carlos = user("carlos", "carlos@email.com", true, LocalDate.of(2005, 3, 1));   // 21
        User laura = user("laura", "laura@email.com", true, LocalDate.of(2009, 6, 15));     // 17
        User miguel = user("miguel", "miguel@email.com", false, LocalDate.of(1996, 1, 1));  // inactivo
        User adult = user("diana", "diana@email.com", true, LocalDate.of(1990, 5, 5));
        for (User u : List.of(andrea, carlos, laura, miguel, adult)) {
            when(userRepository.findByEmailIgnoreCase(u.getEmail())).thenReturn(Optional.of(u));
        }
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));
        when(ticketRepository.countByEventEventCodeAndStatus("CMF-2026", TicketStatus.PAID))
                .thenReturn(0L, 1L, 2L, 3L);
        givenSaveReturnsArgument();

        service.purchase(request("andrea@email.com", TicketType.VIP));                       // AC-004
        service.purchase(request("carlos@email.com", TicketType.GENERAL));                   // AC-005
        assertThatThrownBy(() -> service.purchase(request("laura@email.com", TicketType.GENERAL)))
                .isInstanceOf(BusinessRuleException.class);                                  // AC-006
        assertThatThrownBy(() -> service.purchase(request("miguel@email.com", TicketType.GENERAL)))
                .isInstanceOf(BusinessRuleException.class);                                  // AC-007
        assertThat(event.getStatus()).isEqualTo(EventStatus.PUBLISHED);

        service.purchase(request("diana@email.com", TicketType.GENERAL));                    // AC-008
        assertThat(event.getStatus()).isEqualTo(EventStatus.SOLD_OUT);

        assertThatThrownBy(() -> service.purchase(request("andrea@email.com", TicketType.GENERAL)))
                .isInstanceOf(BusinessRuleException.class);                                  // AC-009
    }

    // ------------------------------------------------------------------ cancel
    @Test
    void TEST_TICKET_009_cancel_paidTicket_becomesCancelled() {
        Ticket ticket = ticket(TicketStatus.PAID, event(EventStatus.PUBLISHED, 0, EVENT_DATE));
        when(ticketRepository.findByTicketCode("TKT-1")).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(ticket)).thenReturn(ticket);
        when(ticketMapper.toResponse(ticket)).thenReturn(dto());

        service.cancel("TKT-1");

        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.CANCELLED);
        verify(ticketRepository).save(ticket);
    }

    @Test
    void TEST_TICKET_010_cancel_usedTicket_throwsBusinessRule() { // AC-011
        Ticket ticket = ticket(TicketStatus.USED, event(EventStatus.PUBLISHED, 0, EVENT_DATE));
        when(ticketRepository.findByTicketCode("TKT-1")).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> service.cancel("TKT-1"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("USED");

        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.USED);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void cancel_alreadyCancelledTicket_throwsBusinessRule() { // BR-TICKET-011
        Ticket ticket = ticket(TicketStatus.CANCELLED, event(EventStatus.PUBLISHED, 0, EVENT_DATE));
        when(ticketRepository.findByTicketCode("TKT-1")).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> service.cancel("TKT-1")).isInstanceOf(BusinessRuleException.class);

        verify(ticketRepository, never()).save(any());
    }

    @Test
    void cancel_afterEventDate_throwsBusinessRule() { // BR-TICKET-012
        Ticket ticket = ticket(TicketStatus.PAID, event(EventStatus.PUBLISHED, 0, NOW.minusHours(1)));
        when(ticketRepository.findByTicketCode("TKT-1")).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> service.cancel("TKT-1"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("event date");

        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.PAID);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void cancel_unknownTicket_throwsResourceNotFound() {
        when(ticketRepository.findByTicketCode("NOPE")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.cancel("NOPE"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Ticket not found: NOPE");
    }

    // ------------------------------------------------------------------ markAsUsed
    @Test
    void TEST_TICKET_011_markAsUsed_paidTicket_becomesUsed() { // AC-010
        Ticket ticket = ticket(TicketStatus.PAID, event(EventStatus.PUBLISHED, 0, EVENT_DATE));
        when(ticketRepository.findByTicketCode("TKT-1")).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(ticket)).thenReturn(ticket);
        when(ticketMapper.toResponse(ticket)).thenReturn(dto());

        service.markAsUsed("TKT-1");

        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.USED);
        verify(ticketRepository).save(ticket);
    }

    @Test
    void TEST_TICKET_012_markAsUsed_cancelledTicket_throwsBusinessRule() { // BR-TICKET-014
        Ticket ticket = ticket(TicketStatus.CANCELLED, event(EventStatus.PUBLISHED, 0, EVENT_DATE));
        when(ticketRepository.findByTicketCode("TKT-1")).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> service.markAsUsed("TKT-1"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("CANCELLED");

        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.CANCELLED);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void markAsUsed_alreadyUsedTicket_throwsBusinessRule() { // BR-TICKET-013
        Ticket ticket = ticket(TicketStatus.USED, event(EventStatus.PUBLISHED, 0, EVENT_DATE));
        when(ticketRepository.findByTicketCode("TKT-1")).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> service.markAsUsed("TKT-1")).isInstanceOf(BusinessRuleException.class);

        verify(ticketRepository, never()).save(any());
    }

    @Test
    void markAsUsed_reservedTicket_throwsBusinessRule() {
        Ticket ticket = ticket(TicketStatus.RESERVED, event(EventStatus.PUBLISHED, 0, EVENT_DATE));
        when(ticketRepository.findByTicketCode("TKT-1")).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> service.markAsUsed("TKT-1")).isInstanceOf(BusinessRuleException.class);

        verify(ticketRepository, never()).save(any());
    }

    // ------------------------------------------------------------------ queries
    @Test
    void findByCode_existing_returnsDto() {
        Ticket ticket = ticket(TicketStatus.PAID, event(EventStatus.PUBLISHED, 0, EVENT_DATE));
        when(ticketRepository.findByTicketCode("TKT-1")).thenReturn(Optional.of(ticket));
        when(ticketMapper.toResponse(ticket)).thenReturn(dto());

        assertThat(service.findByCode("TKT-1")).isEqualTo(dto());
    }

    @Test
    void findByCode_unknown_throwsResourceNotFound() {
        when(ticketRepository.findByTicketCode("NOPE")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findByCode("NOPE")).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void findByUserEmail_returnsMappedTickets() {
        Ticket ticket = ticket(TicketStatus.PAID, event(EventStatus.PUBLISHED, 0, EVENT_DATE));
        when(ticketRepository.findByUserEmailIgnoreCaseOrderByPurchaseDateDesc("andrea@email.com"))
                .thenReturn(List.of(ticket));
        when(ticketMapper.toResponse(ticket)).thenReturn(dto());

        assertThat(service.findByUserEmail("andrea@email.com")).containsExactly(dto());
    }

    @Test
    void findPaidTicketsByEvent_returnsOnlyPaidTickets() {
        Ticket ticket = ticket(TicketStatus.PAID, event(EventStatus.PUBLISHED, 0, EVENT_DATE));
        when(eventRepository.existsByEventCode("CMF-2026")).thenReturn(true);
        when(ticketRepository.findByEventEventCodeAndStatus(eq("CMF-2026"), eq(TicketStatus.PAID)))
                .thenReturn(List.of(ticket));
        when(ticketMapper.toResponse(ticket)).thenReturn(dto());

        assertThat(service.findPaidTicketsByEvent("CMF-2026")).containsExactly(dto());
    }

    @Test
    void findPaidTicketsByEvent_unknownEvent_throwsResourceNotFound() {
        when(eventRepository.existsByEventCode("NOPE")).thenReturn(false);

        assertThatThrownBy(() -> service.findPaidTicketsByEvent("NOPE"))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(ticketRepository, never()).findByEventEventCodeAndStatus(any(), any());
    }
}
