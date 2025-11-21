package com.ticketmanager.service;

import com.ticketmanager.model.User;
import com.ticketmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        log.info("Loading user from OAuth2 provider: {}", userRequest.getClientRegistration().getRegistrationId());
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String avatarUrl = oAuth2User.getAttribute("picture");

        log.info("User email: {}", email);

        userRepository.findByEmail(email).ifPresentOrElse(
                user -> {
                    if (!user.isActive()) {
                        log.warn("User {} is inactive. Blocking login.", email);
                        throw new org.springframework.security.oauth2.core.OAuth2AuthenticationException(
                                new org.springframework.security.oauth2.core.OAuth2Error("account_inactive"),
                                "User account is inactive");
                    }
                    user.setAvatarUrl(avatarUrl);
                    userRepository.save(user);
                },
                () -> {
                    log.info("Creating new user: {}", email);
                    User newUser = User.builder()
                            .email(email)
                            .name(name)
                            .avatarUrl(avatarUrl)
                            .role(User.Role.USER) // Default role
                            .active(true)
                            .build();
                    userRepository.save(newUser);
                });

        return oAuth2User;
    }
}
