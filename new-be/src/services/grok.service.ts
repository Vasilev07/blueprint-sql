import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface GrokMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

interface GrokApiResponse {
    choices?: Array<{
        message?: {
            content?: string;
        };
    }>;
    error?: {
        message: string;
    };
}

@Injectable()
export class GrokService {
    private readonly logger = new Logger(GrokService.name);
    private readonly apiKey: string | undefined;
    private readonly apiUrl: string;
    private readonly model: string = "grok-beta"; // Default Grok model

    // Store conversation context per user (userId -> messages)
    private conversations = new Map<number, GrokMessage[]>();

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>("GROK_API_KEY");
        this.apiUrl =
            this.configService.get<string>("GROK_API_URL") ||
            "https://api.x.ai/v1/chat/completions";

        if (!this.apiKey) {
            this.logger.warn(
                "GROK_API_KEY is not configured. Grok integration will not work.",
            );
        }
    }

    isConfigured(): boolean {
        return !!this.apiKey;
    }

    private getConversationContext(userId: number): GrokMessage[] {
        if (!this.conversations.has(userId)) {
            // Initialize with system message
            this.conversations.set(userId, [
                {
                    role: "system",
                    content:
                        "You are Grok, a helpful and friendly AI assistant. Be concise, helpful, and engaging in your responses.",
                },
            ]);
        }
        return this.conversations.get(userId)!;
    }

    async chat(userId: number, userMessage: string): Promise<string> {
        if (!this.isConfigured()) {
            return "Sorry, Grok is not currently available. Please configure GROK_API_KEY.";
        }

        try {
            // Get conversation context
            const messages = this.getConversationContext(userId);

            // Add user message to context
            messages.push({
                role: "user",
                content: userMessage,
            });

            // Call Grok API
            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1000,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                this.logger.error(
                    `Grok API error: ${response.status} ${response.statusText}`,
                    errorData,
                );
                throw new Error(`Grok API error: ${response.status}`);
            }

            const data: GrokApiResponse = await response.json();

            if (data.error) {
                this.logger.error("Grok API error:", data.error);
                throw new Error(data.error.message || "Unknown Grok API error");
            }

            // Extract assistant response
            const assistantMessage =
                data.choices?.[0]?.message?.content ||
                "Sorry, I couldn't generate a response.";

            // Add assistant response to context
            messages.push({
                role: "assistant",
                content: assistantMessage,
            });

            // Limit conversation history to last 20 messages to prevent token limit issues
            if (messages.length > 21) {
                // Keep system message and last 20 messages
                const systemMsg = messages[0];
                const recentMessages = messages.slice(-20);
                this.conversations.set(userId, [systemMsg, ...recentMessages]);
            }

            return assistantMessage;
        } catch (error: any) {
            this.logger.error("Error calling Grok API:", error);
            return `Sorry, I encountered an error: ${error.message || "Unknown error"}`;
        }
    }

    clearConversation(userId: number): void {
        this.conversations.delete(userId);
        this.logger.log(`Cleared conversation history for user ${userId}`);
    }

    getConversationHistory(userId: number): GrokMessage[] {
        return this.conversations.get(userId) || [];
    }
}
