package com.ticketmanager.service;

import com.ticketmanager.model.Ticket;
import com.ticketmanager.model.TicketAction;
import com.ticketmanager.model.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendTicketAssignedToUserEmail(Ticket ticket, User assignee) {
        try {
            Context context = new Context();
            context.setLocale(getUserLocale(assignee));
            context.setVariable("ticket", ticket);
            context.setVariable("assignee", assignee);

            String htmlContent = templateEngine.process("ticket-assigned-user", context);

            sendHtmlEmail(assignee.getEmail(), "Ticket Assigned: #" + ticket.getId(), htmlContent);
        } catch (Exception e) {
            log.error("Failed to send ticket assignment email to user: {}", assignee.getEmail(), e);
        }
    }

    @Async
    public void sendTicketAssignedToTeamEmail(Ticket ticket) {
        if (ticket.getAssignedTeam() == null)
            return;

        // In a real scenario, we might email all team members or a group alias.
        // For now, let's just log it or email the team leader if we had one.
        // Or iterate over members:
        ticket.getAssignedTeam().getMembers().forEach(member -> {
            try {
                Context context = new Context();
                context.setLocale(getUserLocale(member));
                context.setVariable("ticket", ticket);
                context.setVariable("team", ticket.getAssignedTeam());
                context.setVariable("member", member);

                String htmlContent = templateEngine.process("ticket-assigned-team", context);

                sendHtmlEmail(member.getEmail(), "New Ticket for Team " + ticket.getAssignedTeam().getName(),
                        htmlContent);
            } catch (Exception e) {
                log.error("Failed to send team assignment email to member: {}", member.getEmail(), e);
            }
        });
    }

    @Async
    public void sendActionAddedEmail(Ticket ticket, TicketAction action) {
        User creator = ticket.getCreatedBy();
        // Don't email if the creator added the action themselves
        if (creator.getId().equals(action.getActor().getId())) {
            return;
        }

        try {
            Context context = new Context();
            context.setLocale(getUserLocale(creator));
            context.setVariable("ticket", ticket);
            context.setVariable("action", action);
            context.setVariable("creator", creator);

            String htmlContent = templateEngine.process("ticket-action-added", context);

            sendHtmlEmail(creator.getEmail(), "New Action on Ticket #" + ticket.getId(), htmlContent);
        } catch (Exception e) {
            log.error("Failed to send action added email to creator: {}", creator.getEmail(), e);
        }
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        mailSender.send(message);
        log.info("Email sent to: {} with subject: {}", to, subject);
    }

    private java.util.Locale getUserLocale(User user) {
        String lang = user.getPreferredLanguage();
        if (lang == null || lang.isEmpty()) {
            lang = "pt-BR";
        }

        return java.util.Locale.forLanguageTag(lang);
    }
}
