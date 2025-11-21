package com.ticketmanager.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@lombok.extern.slf4j.Slf4j
public class CustomAuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException exception) throws IOException, ServletException {

        log.error("Authentication failed: ", exception);
        String errorMessage = "error";
        if (exception instanceof org.springframework.security.oauth2.core.OAuth2AuthenticationException) {
            org.springframework.security.oauth2.core.OAuth2Error error = ((org.springframework.security.oauth2.core.OAuth2AuthenticationException) exception)
                    .getError();
            log.error("OAuth2 Error Code: {}", error.getErrorCode());
            if ("account_inactive".equals(error.getErrorCode())) {
                errorMessage = "inactive";
            }
        }

        String redirectUrl = "http://localhost:4200/landing?error=" + errorMessage;
        log.info("Redirecting to: {}", redirectUrl);
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
