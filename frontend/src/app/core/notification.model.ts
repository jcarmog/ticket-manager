import { Ticket } from './ticket.service';
import { User } from './auth.service';

export interface Notification {
    id: number;
    recipient: User;
    message: string;
    read: boolean;
    ticket: Ticket;
    createdAt: string;
}
