package com.ticketmanager.controller;

import com.ticketmanager.model.ApplicationParameter;
import com.ticketmanager.repository.ApplicationParameterRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/parameters")
@RequiredArgsConstructor
@Tag(name = "Application Parameters", description = "API for retrieving application configuration parameters")
public class ApplicationParameterController {

    private final ApplicationParameterRepository applicationParameterRepository;

    @GetMapping("/{name}")
    @Operation(summary = "Get parameter by name")
    public ResponseEntity<ApplicationParameter> getParameterByName(@PathVariable String name) {
        return applicationParameterRepository.findByName(name)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
