export enum SessionStatus {
    PENDING = "pending",      // For 1-to-1 calls: initiated, waiting for answer
    RINGING = "ringing",      // For 1-to-1 calls: actively ringing recipient
    ACTIVE = "active",        // For both: session/stream is live and active
    ENDED = "ended",          // For both: session/stream finished normally
    REJECTED = "rejected",    // For 1-to-1 calls: recipient declined
    MISSED = "missed",        // For 1-to-1 calls: timed out without answer
    FAILED = "failed",        // For both: technical issues caused failure
    SCHEDULED = "scheduled",  // For future: scheduled streams
}
