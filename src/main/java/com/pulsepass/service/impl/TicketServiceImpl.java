package com.pulsepass.service.impl;

import static com.pulsepass.service.impl.Validations.requireNonNull;
import static com.pulsepass.service.impl.Validations.requireText;

import com.pulsepass.domain.enums.EventStatus;
import com.pulsepass.domain.enums.TicketStatus;
import com.pulsepass.domain.model.Event;
import com.pulsepass.domain.model.Ticket;
import com.pulsepass.domain.model.User;
import com.pulsepass.domain.model.UserProfile;
import com.pulsepass.dto.request.PurchaseTicketRequest;
import com.pulsepass.dto.response.TicketResponse;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.mapper.TicketMapper;
import com.pulsepass.repository.EventRepository;
import com.pulsepass.repository.TicketRepository;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.service.TicketCodeGenerator;
import com.pulsepass.service.TicketPricingPolicy;
import com.pulsepass.service.TicketService;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final TicketMapper ticketMapper;
    private final TicketPricingPolicy pricingPolicy;
    private final TicketCodeGenerator codeGenerator;
    private final Clock clock;

    public TicketServiceImpl(TicketRepository ticketRepository,
                             UserRepository userRepository,
                             EventRepository eventRepository,
                             TicketMapper ticketMapper,
                             TicketPricingPolicy pricingPolicy,
                             TicketCodeGenerator codeGenerator,
                             Clock clock) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.ticketMapper = ticketMapper;
        this.pricingPolicy = pricingPolicy;
        this.codeGenerator = codeGenerator;
        this.clock = clock;
    }

    @Override
    @Transactional
    public TicketResponse purchase(PurchaseTicketRequest request) {
        requireNonNull(request, "request");
        requireText(request.userEmail(), "userEmail");
        requireText(request.eventCode(), "eventCode");
        requireNonNull(request.type(), "type");

        User user = userRepository.findByEmailIgnoreCase(request.userEmail())
                .orElseThrow(() -> ResourceNotFoundException.of("User", request.userEmail()));
        if (!user.isActive()) {
            throw new BusinessRuleException("User is inactive and cannot purchase tickets: "
                    + user.getEmail());
        }

        Event event = eventRepository.findByEventCode(request.eventCode())
                .orElseThrow(() -> ResourceNotFoundException.of("Event", request.eventCode()));

        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new BusinessRuleException("Tickets can only be purchased for PUBLISHED events. Event "
                    + event.getEventCode() + " is " + event.getStatus() + ".");
        }

        if (!event.getEventDate().isAfter(now())) {
            throw new BusinessRuleException("Event " + event.getEventCode() + " has already taken place.");
        }

        validateMinimumAge(user, event);

        int capacity = event.getVenue().getCapacity();
        long paidTickets = ticketRepository
                .countByEventEventCodeAndStatus(event.getEventCode(), TicketStatus.PAID);
        if (paidTickets >= capacity) {
            throw new BusinessRuleException("Event " + event.getEventCode()
                    + " has no capacity left (" + capacity + ").");
        }

        BigDecimal price = pricingPolicy.priceFor(request.type());

        Ticket ticket = new Ticket(codeGenerator.generate(), request.type(), price,
                TicketStatus.PAID, now(), user, event);
        Ticket saved = ticketRepository.save(ticket);

        if (paidTickets + 1 == capacity) {
            event.setStatus(EventStatus.SOLD_OUT);
            eventRepository.save(event);
        }

        return ticketMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public TicketResponse findByCode(String ticketCode) {
        return ticketMapper.toResponse(getTicket(ticketCode));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketResponse> findByUserEmail(String email) {
        return ticketRepository.findByUserEmailIgnoreCaseOrderByPurchaseDateDesc(email)
                .stream()
                .map(ticketMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketResponse> findPaidTicketsByEvent(String eventCode) {
        if (!eventRepository.existsByEventCode(eventCode)) {
            throw ResourceNotFoundException.of("Event", eventCode);
        }
        return ticketRepository.findByEventEventCodeAndStatus(eventCode, TicketStatus.PAID)
                .stream()
                .map(ticketMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public TicketResponse cancel(String ticketCode) {
        Ticket ticket = getTicket(ticketCode);

        if (ticket.getStatus() != TicketStatus.PAID) {
            throw new BusinessRuleException("Only PAID tickets can be cancelled. Ticket "
                    + ticketCode + " is " + ticket.getStatus() + ".");
        }

        if (!ticket.getEvent().getEventDate().isAfter(now())) {
            throw new BusinessRuleException("Ticket " + ticketCode
                    + " cannot be cancelled after the event date.");
        }

        ticket.setStatus(TicketStatus.CANCELLED);
        return ticketMapper.toResponse(ticketRepository.save(ticket));
    }

    @Override
    @Transactional
    public TicketResponse markAsUsed(String ticketCode) {
        Ticket ticket = getTicket(ticketCode);

        if (ticket.getStatus() == TicketStatus.CANCELLED) {
            throw new BusinessRuleException("Ticket " + ticketCode + " is CANCELLED and cannot be used.");
        }

        if (ticket.getStatus() != TicketStatus.PAID) {
            throw new BusinessRuleException("Only PAID tickets can be marked as used. Ticket "
                    + ticketCode + " is " + ticket.getStatus() + ".");
        }

        ticket.setStatus(TicketStatus.USED);
        return ticketMapper.toResponse(ticketRepository.save(ticket));
    }

    private void validateMinimumAge(User user, Event event) {
        int minimumAge = event.getMinimumAge() == null ? 0 : event.getMinimumAge();
        if (minimumAge <= 0) {
            return;
        }
        LocalDate birthDate = Optional.ofNullable(user.getProfile())
                .map(UserProfile::getBirthDate)
                .orElseThrow(() -> new BusinessRuleException("User " + user.getEmail()
                        + " has no birth date; cannot verify minimum age for event "
                        + event.getEventCode() + "."));

        int ageAtEvent = Period.between(birthDate, event.getEventDate().toLocalDate()).getYears();
        if (ageAtEvent < minimumAge) {
            throw new BusinessRuleException("User does not meet minimum age: event "
                    + event.getEventCode() + " requires " + minimumAge + " but user will be "
                    + ageAtEvent + " on the event date.");
        }
    }

    private Ticket getTicket(String ticketCode) {
        return ticketRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> ResourceNotFoundException.of("Ticket", ticketCode));
    }

    private LocalDateTime now() {
        return LocalDateTime.now(clock);
    }
}
