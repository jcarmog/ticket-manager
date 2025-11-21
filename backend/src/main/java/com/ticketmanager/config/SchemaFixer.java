package com.ticketmanager.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class SchemaFixer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public SchemaFixer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        try {
            System.out.println("Starting database schema migration for 'status' column (String -> Ordinal)...");

            // 1. Update existing values to their ordinal equivalents
            // OPEN -> 0
            jdbcTemplate.update("UPDATE tickets SET status = '0' WHERE status = 'OPEN'");
            // IN_PROGRESS -> 1
            jdbcTemplate.update("UPDATE tickets SET status = '1' WHERE status = 'IN_PROGRESS'");
            // PAUSED -> 2
            jdbcTemplate.update("UPDATE tickets SET status = '2' WHERE status = 'PAUSED'");
            // RESOLVED -> 3
            jdbcTemplate.update("UPDATE tickets SET status = '3' WHERE status = 'RESOLVED'");
            // CLOSED -> 4
            jdbcTemplate.update("UPDATE tickets SET status = '4' WHERE status = 'CLOSED'");

            System.out.println("Updated existing status values to ordinals.");

            // 2. Modify column type to INT (or TINYINT)
            jdbcTemplate.execute("ALTER TABLE tickets MODIFY COLUMN status INT");

            System.out.println("Successfully modified 'status' column to INT.");
        } catch (Exception e) {
            System.err.println("Failed to migrate 'status' column: " + e.getMessage());
            // It might fail if already migrated, which is fine.
        }
    }
}
