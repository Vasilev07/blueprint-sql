import { Observable, Subject } from "rxjs";
import { UserDTO } from "src/typescript-api-client/src/model/models";

/**
 * PrimeNG ConfirmationService mock that satisfies ConfirmDialog's constructor.
 * ConfirmDialog subscribes to requireConfirmation$, so it must be an Observable.
 */
export function mockConfirmationService(): {
    confirm: (opts?: { accept?: () => void }) => void;
    requireConfirmation$: ReturnType<Subject<unknown>["asObservable"]>;
} {
    const requireConfirmation$ = new Subject().asObservable();
    return {
        confirm: (opts?: { accept?: () => void }) => opts?.accept?.(),
        requireConfirmation$,
    };
}

/**
 * PrimeNG MessageService mock for toasts.
 * Toast's ngOnInit subscribes to messageObserver and clearObserver, so they must be Observables.
 */
export function mockMessageService(): {
    add: jest.Mock;
    messageObserver: Observable<unknown>;
    clearObserver: Observable<unknown>;
} {
    return {
        add: jest.fn(),
        messageObserver: new Subject().asObservable(),
        clearObserver: new Subject().asObservable(),
    };
}

/**
 * Default mock user for profile and auth-related tests.
 */
export function createMockUser(
    overrides: Partial<UserDTO> = {},
): UserDTO & { balance?: string } {
    return {
        id: 1,
        email: "user@test.com",
        fullName: "Test User",
        password: "",
        confirmPassword: "",
        gender: "male" as UserDTO.GenderEnum,
        city: "Sofia",
        balance: "100",
        ...overrides,
    } as UserDTO & { balance?: string };
}

/**
 * Default mock user profile for profile component tests.
 */
export function createMockProfile(overrides: Record<string, unknown> = {}): {
    bio: string;
    city: string;
    location: string;
    interests: string[];
    appearsInSearches: boolean;
    dateOfBirth: string;
} {
    return {
        bio: "Hello",
        city: "Sofia",
        location: "Sofia, Bulgaria",
        interests: ["music", "travel"],
        appearsInSearches: true,
        dateOfBirth: "1990-01-01",
        ...overrides,
    };
}
