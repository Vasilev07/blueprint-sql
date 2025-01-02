module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: ["./tsconfig.json", "./test/tsconfig.test.json"],
        tsconfigRootDir: __dirname,
        sourceType: "module",
    },
    plugins: ["@typescript-eslint/eslint-plugin", "jest"],
    extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:prettier/recommended",
    ],
    // files: ["src/**/*.ts", "test/**/*.ts"],
    root: true,
    env: {
        node: true,
        "jest/globals": true,
    },
    ignorePatterns: [".eslintrc.js"],
    rules: {
        "@typescript-eslint/interface-name-prefix": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-explicit-any": "off",
    },
};
