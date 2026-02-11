module.exports = {
    preset: 'jest-preset-angular',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/src'],
    testMatch: ['**/+(*.)+(spec).+(ts|js)'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.spec.ts',
        '!src/**/*.d.ts',
        '!src/main.ts',
        '!src/polyfills.ts',
        '!src/**/*.module.ts',
        '!src/**/*.interface.ts',
        '!src/**/*.enum.ts',
        '!src/**/*.type.ts',
    ],
    coverageReporters: ['html', 'text', 'text-summary', 'lcov'],
    coverageDirectory: 'coverage',
    moduleNameMapper: {
        '.*typescript-api-client.*': '<rootDir>/src/__mocks__/typescript-api-client.ts',
        '^src/(.*)$': '<rootDir>/src/$1',
    },
    transformIgnorePatterns: [
        'node_modules/(?!.*\\.mjs$|@angular|@primeuix|primeng|rxjs)',
    ],
    transform: {
        '^.+\\.(ts|mjs|js|html)$': [
            'jest-preset-angular',
            {
                tsconfig: '<rootDir>/tsconfig.spec.json',
                stringifyContentPathRegex: '\\.html$',
            },
        ],
    },
    moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
    snapshotSerializers: [
        'jest-preset-angular/build/serializers/no-ng-attributes',
        'jest-preset-angular/build/serializers/ng-snapshot',
        'jest-preset-angular/build/serializers/html-comment',
    ],
};
