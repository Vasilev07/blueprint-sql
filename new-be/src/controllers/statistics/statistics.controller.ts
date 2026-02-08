import {
    Controller,
    Get,
    UseGuards,
    Query,
    BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { StatisticsService } from "./statistics.service";
import { AuthGuard } from "../../guards/auth.guard";

@ApiTags("Statistics")
@Controller("statistics")
@UseGuards(AuthGuard)
export class StatisticsController {
    constructor(private readonly statisticsService: StatisticsService) {}

    @Get("dashboard")
    @ApiOperation({ summary: "Get dashboard statistics" })
    @ApiQuery({
        name: "timeRange",
        required: false,
        description:
            "Time range (e.g., '20h', '7d'). If omitted, defaults to Gifts Today only.",
    })
    @ApiResponse({ status: 200, description: "Return dashboard statistics." })
    async getDashboardStatistics(@Query("timeRange") timeRange?: string) {
        try {
            return await this.statisticsService.getDashboardStatistics(
                timeRange,
            );
        } catch (error: any) {
            if (error.message && error.message.includes("Invalid time range")) {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }
}
