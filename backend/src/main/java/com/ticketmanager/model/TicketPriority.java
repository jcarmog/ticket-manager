package com.ticketmanager.model;

import lombok.Getter;

@Getter
public enum TicketPriority {
    CRITICAL("Critical"),
    HIGH("High"),
    MEDIUM("Medium"),
    LOW("Low");

    private final String description;

    TicketPriority(String description) {
        this.description = description;
    }
}
