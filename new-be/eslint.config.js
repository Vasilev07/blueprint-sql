const js = require("@eslint/js");
const tseslintParser = require("@typescript-eslint/parser");
const tseslintPlugin = require("@typescript-eslint/eslint-plugin");
const prettier = require("eslint-plugin-prettier");
const jest = require("eslint-plugin-jest");
const prettierConfig = require("eslint-config-prettier");

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
                ...jest.environments.globals.globals,
            },
        },
        plugins: {
            "@typescript-eslint": tseslintPlugin,
            prettier: prettier,
            jest: jest,
        },
        rules: {
            ...prettierConfig.rules,
            ...tseslintPlugin.configs.recommended.rules,
            "@typescript-eslint/interface-name-prefix": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-explicit-any": "off",
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
