import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { Observable } from "rxjs";

@Injectable()
export class JsonToDtoInterceptor<T> implements NestInterceptor {
    constructor(
        private readonly dto: new () => T,
        private readonly fields: string[],
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();

        this.fields.forEach((field) => {
            if (request.body[field]) {
                try {
                    // Parse the JSON string and transform into the DTO
                    request.body[field] = plainToInstance(
                        this.dto,
                        JSON.parse(request.body[field]),
                    );
                } catch (_error) {
                    throw new Error(
                        `Failed to parse and transform field '${field}'`,
                    );
                }
            }
        });

        return next.handle();
    }
}
