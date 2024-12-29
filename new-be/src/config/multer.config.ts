import { Injectable } from "@nestjs/common";
import {
    MulterModuleOptions,
    MulterOptionsFactory,
} from "@nestjs/platform-express";

@Injectable()
class MulterConfigService implements MulterOptionsFactory {
    createMulterOptions(): Promise<MulterModuleOptions> | MulterModuleOptions {
        return {
            dest: "./uploads",
        };
    }
}
