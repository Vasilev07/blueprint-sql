import { NO_ERRORS_SCHEMA } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { RouterOutlet } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";
import { AppComponent } from "./app.component";
import { PrimeNG } from "primeng/config";
import { LayoutService } from "./layout/service/app.layout.service";
import { ThemeService } from "./services/theme.service";

describe("AppComponent", () => {
    let mockPrimeNG: jest.Mocked<PrimeNG>;
    let mockLayoutService: jest.Mocked<LayoutService>;
    let mockThemeService: jest.Mocked<ThemeService>;

    beforeEach(async () => {
        mockPrimeNG = {
            config: {} as any,
        } as unknown as jest.Mocked<PrimeNG>;

        mockLayoutService = {
            config: {
                set: jest.fn(),
            },
        } as any;

        mockThemeService = {
            applyStoredTheme: jest.fn(),
            getStoredTheme: jest.fn().mockReturnValue("light-theme"),
        } as any;

        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, AppComponent],
            providers: [
                { provide: PrimeNG, useValue: mockPrimeNG },
                { provide: LayoutService, useValue: mockLayoutService },
                { provide: ThemeService, useValue: mockThemeService },
            ],
        })
            .overrideComponent(AppComponent, {
                set: {
                    imports: [RouterOutlet],
                    schemas: [NO_ERRORS_SCHEMA],
                },
            })
            .compileComponents();
    });

    it("should create the app", () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });

    it("should have as title 'new-fe'", () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        expect(app.title).toBe("new-fe");
    });

    it("should initialize theme and layout on init", () => {
        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();

        expect(mockThemeService.applyStoredTheme).toHaveBeenCalled();
        expect(mockThemeService.getStoredTheme).toHaveBeenCalled();
        expect(mockLayoutService.config.set).toHaveBeenCalled();
    });
});
