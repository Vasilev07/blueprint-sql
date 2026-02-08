import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface GeminiMessage {
    role: "user" | "model" | "system";
    parts: Array<{ text: string }>;
}

interface GeminiApiResponse {
    candidates?: Array<{
        content?: {
            parts?: Array<{
                text?: string;
            }>;
        };
    }>;
    error?: {
        message: string;
        code?: number;
    };
}

@Injectable()
export class GeminiService {
    private readonly logger = new Logger(GeminiService.name);
    private readonly apiKey: string | undefined;
    private readonly apiUrl: string;
    private readonly model: string = "gemini-pro"; // Default Gemini model

    // Store conversation context per user (userId -> messages)
    private conversations = new Map<number, GeminiMessage[]>();

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>("GEMINI_API_KEY");
        this.apiUrl =
            this.configService.get<string>("GEMINI_API_URL") ||
            "https://generativelanguage.googleapis.com/v1beta/models";

        if (!this.apiKey) {
            this.logger.warn(
                "GEMINI_API_KEY is not configured. Gemini integration will not work.",
            );
        }
    }

    isConfigured(): boolean {
        return !!this.apiKey;
    }

    private getConversationContext(userId: number): GeminiMessage[] {
        if (!this.conversations.has(userId)) {
            // Initialize with system message (Gemini uses system instruction in the first user message)
            this.conversations.set(userId, []);
        }
        return this.conversations.get(userId)!;
    }

    async chat(userId: number, userMessage: string): Promise<string> {
        if (!this.isConfigured()) {
            return "Sorry, Gemini is not currently available. Please configure GEMINI_API_KEY.";
        }

        try {
            // Get conversation context
            const messages = this.getConversationContext(userId);

            // Add user message to context
            messages.push({
                role: "user",
                parts: [{ text: userMessage }],
            });

            // Build the request payload for Gemini API
            // Gemini API expects a different format than OpenAI-compatible APIs
            const requestBody = {
                contents: messages.map((msg) => ({
                    // Gemini API uses roles: "user", "model", "system"
                    // The type of msg.role does not include "assistant", so we don't need to check for it.
                    role: msg.role,
                    parts: msg.parts,
                })),
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                },
            };

            // Call Gemini API
            const apiEndpoint = `${this.apiUrl}/${this.model}:generateContent?key=${this.apiKey}`;
            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                this.logger.error(
                    `Gemini API error: ${response.status} ${response.statusText}`,
                    errorData,
                );
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data: GeminiApiResponse = await response.json();

            if (data.error) {
                this.logger.error("Gemini API error:", data.error);
                throw new Error(
                    data.error.message || "Unknown Gemini API error",
                );
            }

            // Extract assistant response
            const assistantText =
                data.candidates?.[0]?.content?.parts?.[0]?.text ||
                "Sorry, I couldn't generate a response.";

            // Add assistant response to context
            messages.push({
                role: "model",
                parts: [{ text: assistantText }],
            });

            // Limit conversation history to last 20 messages to prevent token limit issues
            if (messages.length > 20) {
                // Keep last 20 messages
                const recentMessages = messages.slice(-20);
                this.conversations.set(userId, recentMessages);
            }

            return assistantText;
        } catch (error: any) {
            this.logger.error("Error calling Gemini API:", error);
            return `Sorry, I encountered an error: ${error.message || "Unknown error"}`;
        }
    }

    clearConversation(userId: number): void {
        this.conversations.delete(userId);
        this.logger.log(`Cleared conversation history for user ${userId}`);
    }

    getConversationHistory(userId: number): GeminiMessage[] {
        return this.conversations.get(userId) || [];
    }
}
