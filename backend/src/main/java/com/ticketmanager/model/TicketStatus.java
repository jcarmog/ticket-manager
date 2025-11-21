package com.ticketmanager.model;

import lombok.Getter;

@Getter
public enum TicketStatus {
    OPEN("Open"),
    IN_PROGRESS("In Progress"),
    PAUSED("Paused"),
    RESOLVED("Resolved"),
    CLOSED("Closed");

    private final String description;

    TicketStatus(String description) {
        this.description = description;
    }
}
