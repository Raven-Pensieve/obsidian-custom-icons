module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>"],
	testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
	transform: {
		"^.+\\.ts$": "ts-jest",
	},
	moduleFileExtensions: ["ts", "js", "json"],
	moduleNameMapper: {
		"^@src/(.*)$": "<rootDir>/src/$1",
		"^@styles/(.*)$": "<rootDir>/styles/$1",
		// obsidian npm 包只有 .d.ts（main 为空串），jest 解析不到可运行模块，
		// 统一映射到 test/mocks/obsidian.ts 的最小实现
		"^obsidian$": "<rootDir>/test/mocks/obsidian.ts",
	},
	collectCoverageFrom: [
		"src/**/*.ts",
		"!src/**/*.d.ts",
		"!**/*.test.ts",
		"!**/*.spec.ts",
	],
	coverageDirectory: "coverage",
	coverageReporters: ["text", "lcov", "html"],
};
