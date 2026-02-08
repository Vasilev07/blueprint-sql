import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { WebsocketService } from "./websocket.service";

@Injectable({ providedIn: "root" })
export class PresenceService {
    private onlineEmailsSubject = new BehaviorSubject<Set<string>>(new Set());
    onlineEmails$: Observable<Set<string>> =
        this.onlineEmailsSubject.asObservable();

    constructor(private ws: WebsocketService) {
        this.ws.onPresenceSnapshot().subscribe((emails) => {
            this.onlineEmailsSubject.next(new Set(emails || []));
        });
        this.ws.onPresenceOnline().subscribe((email) => {
            const next = new Set(this.onlineEmailsSubject.value);
            if (email) next.add(email);
            this.onlineEmailsSubject.next(next);
        });
        this.ws.onPresenceOffline().subscribe((email) => {
            const next = new Set(this.onlineEmailsSubject.value);
            if (email) next.delete(email);
            this.onlineEmailsSubject.next(next);
        });
    }

    isOnline(email?: string | null): boolean {
        if (!email) return false;
        return this.onlineEmailsSubject.value.has(email);
    }
}
