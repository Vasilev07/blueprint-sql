const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const prettier = require("eslint-plugin-prettier");
const prettierConfig = require("eslint-config-prettier");

module.exports = tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: __dirname,
                sourceType: "module",
                extraFileExtensions: [".html"],
            },
            globals: {
                node: true,
            },
        },
        plugins: {
            "@typescript-eslint": tseslint.plugin,
            prettier: prettier,
        },
        rules: {
            ...prettierConfig.rules,
            "@typescript-eslint/interface-name-prefix": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
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
            "angular.json",
            "*.config.js",
            "src/typescript-api-client/**", // Auto-generated code
        ],
    }
);
