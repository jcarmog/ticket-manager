package com.ticketmanager.service;

import com.ticketmanager.model.Notification;
import com.ticketmanager.model.Ticket;
import com.ticketmanager.model.User;
import com.ticketmanager.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void createNotification(User recipient, String message, Ticket ticket) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .message(message)
                .ticket(ticket)
                .build();
        notificationRepository.save(notification);
    }

    public List<Notification> getUnreadNotifications(User recipient) {
        return notificationRepository.findByRecipientAndReadFalseOrderByCreatedAtDesc(recipient);
    }

    @Transactional
    public void markAsRead(Long id) {
        notificationRepository.findById(id).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }
}
