package com.ticketmanager.model;

import lombok.Getter;

@Getter
public enum AuthProvider {
    GOOGLE("Google"),
    MICROSOFT("Microsoft Entra ID"),
    GITHUB("GitHub"),
    GITLAB("GitLab"),
    FACEBOOK("Facebook");

    private final String description;

    AuthProvider(String description) {
        this.description = description;
    }
}
