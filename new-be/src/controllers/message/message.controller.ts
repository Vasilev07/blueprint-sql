import { Body, Controller, Get, Post, Put, Param, Delete, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { MessageService } from "src/services/message.service";
import { MessageDTO, CreateMessageDTO } from "../../models/message.dto";

@Controller("/messages")
@ApiTags("Messages")
export class MessageController {
    constructor(private messageService: MessageService) {}

    @Post()
    @ApiOperation({ summary: "Create a new message" })
    @ApiResponse({ status: 201, description: "Message created successfully", type: MessageDTO })
    async create(@Body() createMessageDTO: CreateMessageDTO): Promise<MessageDTO> {
        return await this.messageService.create(createMessageDTO);
    }

    @Get("/user/:userId")
    @ApiOperation({ summary: "Get all messages for a user" })
    @ApiResponse({ status: 200, description: "Messages retrieved successfully", type: [MessageDTO] })
    async findAllByUserId(@Param("userId") userId: number): Promise<MessageDTO[]> {
        return await this.messageService.findAllByUserId(userId);
    }

    @Get("/user/:userId/inbox")
    @ApiOperation({ summary: "Get inbox messages for a user" })
    @ApiResponse({ status: 200, description: "Inbox messages retrieved successfully", type: [MessageDTO] })
    async findInboxByUserId(@Param("userId") userId: number): Promise<MessageDTO[]> {
        return await this.messageService.findInboxByUserId(userId);
    }

    @Get("/:id")
    @ApiOperation({ summary: "Get a message by ID" })
    @ApiResponse({ status: 200, description: "Message retrieved successfully", type: MessageDTO })
    async findById(@Param("id") id: number): Promise<MessageDTO | null> {
        return await this.messageService.findById(id);
    }

    @Put("/:id/read")
    @ApiOperation({ summary: "Mark a message as read" })
    @ApiResponse({ status: 200, description: "Message marked as read" })
    async markAsRead(@Param("id") id: number): Promise<void> {
        await this.messageService.markAsRead(id);
    }

    @Put("/:id/archive")
    @ApiOperation({ summary: "Archive a message" })
    @ApiResponse({ status: 200, description: "Message archived" })
    async archive(@Param("id") id: number): Promise<void> {
        await this.messageService.archive(id);
    }

    @Delete("/:id")
    @ApiOperation({ summary: "Delete a message" })
    @ApiResponse({ status: 200, description: "Message deleted" })
    async delete(@Param("id") id: number): Promise<void> {
        await this.messageService.delete(id);
    }

    @Put("/:id")
    @ApiOperation({ summary: "Update a message" })
    @ApiResponse({ status: 200, description: "Message updated successfully", type: MessageDTO })
    async update(@Param("id") id: number, @Body() updateMessageDTO: Partial<MessageDTO>): Promise<MessageDTO> {
        return await this.messageService.update(id, updateMessageDTO);
    }
}
