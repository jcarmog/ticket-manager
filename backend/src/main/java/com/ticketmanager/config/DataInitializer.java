package com.ticketmanager.config;

import com.ticketmanager.model.ApplicationParameter;
import com.ticketmanager.model.AuthProvider;
import com.ticketmanager.repository.ApplicationParameterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final ApplicationParameterRepository applicationParameterRepository;

    @Override
    public void run(String... args) throws Exception {
        initializeAuthProviders();
    }

    private void initializeAuthProviders() {
        if (applicationParameterRepository.findByName("AUTH_PROVIDERS").isEmpty()) {
            ApplicationParameter authProvidersParam = new ApplicationParameter();
            authProvidersParam.setName("AUTH_PROVIDERS");
            authProvidersParam.setDescription("List of enabled authentication providers");
            authProvidersParam.setValue(AuthProvider.GOOGLE.name());
            applicationParameterRepository.save(authProvidersParam);
        }
    }
}
