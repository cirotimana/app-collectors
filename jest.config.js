const nextJest = require("next/jest")

const createJestConfig = nextJest({
  dir: "./",
})

const customJestConfig = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverage: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    // ✅ TODO el código fuente
    "src/**/*.{ts,tsx}",

    // ❌ excluir tests
    "src/**/*.spec.{ts,tsx}",
    "src/**/*.test.{ts,tsx}",

    // ❌ excluir barrels
    "!src/**/index.ts",

    // ❌ excluir tipos
    "!src/**/*.d.ts",

    // ❌ excluir config / setup
    "!src/**/types/**",
    "!src/**/constants/**",

    // ❌ excluir Next
    "!src/app/**/layout.tsx",
    "!src/app/**/page.tsx",
    "!src/app/**/loading.tsx",
    "!src/app/**/error.tsx",
    "!src/app/**/not-found.tsx",

    // ❌ excluir estilos
    "!src/**/*.css",
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/.next/",
  ],
}

module.exports = createJestConfig(customJestConfig)
