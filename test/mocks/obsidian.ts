/**
 * `obsidian` npm 包只有类型声明（package.json 的 main 是空串），
 * jest 解析不到可运行模块——单测里凡 import 了 obsidian 的源码模块
 * （如 getLucideIcons 的 `getIconIds`）都靠 jest.config 的 moduleNameMapper
 * 映射到这份最小实现。
 *
 * 个别用例需要自定义行为时，用 `jest.doMock("obsidian", () => ({ ... }))`
 * 整体覆盖（见 src/util/getLucideIcons.test.ts）。
 */

export const getIconIds = (): string[] => [];
export const addIcon = (): void => {};
export const removeIcon = (): void => {};
export const getIcon = (): null => null;
export const setIcon = (): void => {};
