package com.pulsepass.support;

import com.pulsepass.domain.enums.EventCategory;
import com.pulsepass.domain.enums.EventStatus;
import com.pulsepass.domain.enums.TicketStatus;
import com.pulsepass.domain.enums.TicketType;
import com.pulsepass.domain.model.Event;
import com.pulsepass.domain.model.Ticket;
import com.pulsepass.domain.model.User;
import com.pulsepass.domain.model.Venue;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class TestData {

    private TestData() {}

    public static Venue venue() {
        return new Venue("VEN-SMR-01", "Marina Convention Center",
                "Santa Marta", "Carrera 1 #1-01", 5000);
    }

    public static Venue venue(String code, String city) {
        return new Venue(code, "Venue " + code, city, "Calle 1 #1-01", 1000);
    }

    public static Event event(Venue venue) {
        return new Event("CMF-2026", "Caribbean Music Fest 2026", EventCategory.MUSIC,
                EventStatus.PUBLISHED, LocalDateTime.of(2026, 12, 5, 19, 0), venue);
    }

    public static Event event(String eventCode, EventStatus status,
                              LocalDateTime eventDate, Venue venue) {
        return new Event(eventCode, "Evento " + eventCode, EventCategory.MUSIC,
                status, eventDate, venue);
    }

    public static User user(String username) {
        return new User(username, username + "@pulsepass.test");
    }

    public static Ticket ticket(String ticketCode, TicketType type, String price,
                                TicketStatus status, User user, Event event) {
        return new Ticket(ticketCode, type, new BigDecimal(price), status,
                LocalDateTime.of(2026, 9, 1, 10, 0), user, event);
    }
}
