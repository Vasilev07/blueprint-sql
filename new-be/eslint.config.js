const js = require("@eslint/js");
const tseslintParser = require("@typescript-eslint/parser");
const tseslintPlugin = require("@typescript-eslint/eslint-plugin");
const prettier = require("eslint-plugin-prettier");
const jest = require("eslint-plugin-jest");
const prettierConfig = require("eslint-config-prettier");
const globals = require("globals");

module.exports = [
    js.configs.recommended,
    {
        files: ["src/**/*.ts", "test/**/*.ts"],
        languageOptions: {
            parser: tseslintParser,
            parserOptions: {
                project: ["./tsconfig.json", "./test/tsconfig.test.json"],
                tsconfigRootDir: __dirname,
                sourceType: "module",
            },
            globals: {
                ...globals.node,
                ...jest.environments.globals.globals,
                Express: "readonly",
                Buffer: "readonly",
            },
        },
        plugins: {
            "@typescript-eslint": tseslintPlugin,
            prettier: prettier,
            jest: jest,
        },
        rules: {
            ...prettierConfig.rules,
            "no-unused-vars": "off", // Turn off base rule as it conflicts with TypeScript version
            "@typescript-eslint/interface-name-prefix": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/no-require-imports": "off", // Allow require() for dynamic imports
            "prettier/prettier": "error",
        },
    },
    {
        ignores: [
            ".eslintrc.js",
            "dist/**",
            "node_modules/**",
            "*.js",
            "!eslint.config.js",
        ],
    },
];
