import { Injectable } from "@angular/core";

@Injectable({
    providedIn: "root",
})
export class OnlineStatusService {
    private readonly ONLINE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

    constructor() {}

    /**
     * Check if a user is online based on their lastOnline timestamp
     * A user is considered online if their lastOnline is within the last 15 minutes
     */
    isOnline(lastOnline: Date | string | undefined | null): boolean {
        if (!lastOnline) return false;

        try {
            const lastOnlineDate =
                typeof lastOnline === "string"
                    ? new Date(lastOnline)
                    : lastOnline;

            const now = new Date();
            const diffMs = now.getTime() - lastOnlineDate.getTime();

            return diffMs < this.ONLINE_THRESHOLD_MS;
        } catch (error) {
            console.error("Error checking online status:", error);
            return false;
        }
    }

    /**
     * Get the time threshold in minutes
     */
    getThresholdMinutes(): number {
        return this.ONLINE_THRESHOLD_MS / (60 * 1000);
    }

    /**
     * Get formatted last seen text
     */
    getLastSeenText(lastOnline: Date | string | undefined | null): string {
        if (!lastOnline) return "Never";

        if (this.isOnline(lastOnline)) {
            return "Online";
        }

        const lastOnlineDate =
            typeof lastOnline === "string" ? new Date(lastOnline) : lastOnline;

        const now = new Date();
        const diffMs = now.getTime() - lastOnlineDate.getTime();
        const diffMinutes = Math.floor(diffMs / (60 * 1000));
        const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
        const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

        if (diffMinutes < 60) {
            return `${diffMinutes} min ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
        } else {
            return lastOnlineDate.toLocaleDateString();
        }
    }
}
