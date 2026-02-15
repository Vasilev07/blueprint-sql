import { Pipe, PipeTransform } from "@angular/core";
import { Message } from "./chat.service";

export interface ParsedGift {
    emoji: string;
    amount: string;
    giftMessage: string;
}

@Pipe({ name: "parseGiftMessage", standalone: true, pure: true })
export class ParseGiftMessagePipe implements PipeTransform {
    transform(message: Message): ParsedGift | null {
        if (!message.content?.includes("🎁 Gift Sent:")) return null;

        const content = message.content || "";
        const giftMatch = content.match(
            /🎁 Gift Sent:\s*([^\s]+)\s*\(([^)]+)\s*tokens\)(?:\s*-\s*"([^"]*)")?/,
        );

        if (giftMatch) {
            return {
                emoji: giftMatch[1] || "🎁",
                amount: giftMatch[2] || "0",
                giftMessage: giftMatch[3] || "",
            };
        }

        const emojiMatch = content.match(/🎁 Gift Sent:\s*([^\s]+)/);
        const amountMatch = content.match(/\(([^)]+)\s*tokens\)/);
        const messageMatch = content.match(/-\s*"([^"]*)"/);

        return {
            emoji: emojiMatch?.[1] || "🎁",
            amount: amountMatch?.[1] || "0",
            giftMessage: messageMatch?.[1] || "",
        };
    }
}
