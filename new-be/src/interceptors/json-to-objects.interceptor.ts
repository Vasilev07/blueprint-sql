import {
    CallHandler,
    ExecutionContext,
    NestInterceptor,
    Type,
    mixin,
} from "@nestjs/common";
import { Observable } from "rxjs";

export function JsonToObjectsInterceptor(
    fields: string[],
): Type<NestInterceptor> {
    class JsonToObjectsInterceptor implements NestInterceptor {
        intercept(
            context: ExecutionContext,
            next: CallHandler,
        ): Observable<any> {
            console.log("KURWA");
            const request = context.switchToHttp().getRequest();
            console.log("request.body", request.body);
            console.log("request", request);

            if (request.body) {
                fields.forEach((field) => {
                    if (request.body[field]) {
                        request.body[field] = JSON.parse(request.body[field]);
                    }
                });
            }
            return next.handle();
        }
    }

    const Interceptor = mixin(JsonToObjectsInterceptor);
    return Interceptor as Type<NestInterceptor>;
}
