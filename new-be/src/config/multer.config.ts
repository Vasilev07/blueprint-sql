import { Injectable } from "@nestjs/common";
import {
    MulterModuleOptions,
    MulterOptionsFactory,
} from "@nestjs/platform-express";

@Injectable()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class MulterConfigService implements MulterOptionsFactory {
    createMulterOptions(): Promise<MulterModuleOptions> | MulterModuleOptions {
        return {
            dest: "./uploads",
        };
    }
}
