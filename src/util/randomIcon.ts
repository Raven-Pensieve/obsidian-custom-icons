import { getLucideIconNames } from "./getLucideIcons";

/**
 * 从数组中随机获取指定数量的不重复元素
 */
const getRandomElements = <T>(arr: T[], count: number): T[] => {
	const pool = [...arr];
	const result: T[] = [];
	for (let i = 0; i < count && i < pool.length; i++) {
		const idx = i + Math.floor(Math.random() * (pool.length - i));
		[pool[i], pool[idx]] = [pool[idx], pool[i]];
		result.push(pool[i]);
	}
	return result;
};

/**
 * 获取单个随机图标
 * @param exclude - 需要排除的图标（例如当前图标）
 * @returns 随机图标名称，如果没有可用图标则返回 undefined
 */
export const getRandomIcon = (
	exclude?: string | string[],
): string | undefined => {
	const icons = getLucideIconNames();
	let pool = icons;

	if (exclude) {
		const excludeSet = new Set(
			Array.isArray(exclude) ? exclude : [exclude],
		);
		pool = icons.filter((icon) => !excludeSet.has(icon));
	}

	if (pool.length === 0) return undefined;

	return pool[Math.floor(Math.random() * pool.length)];
};

/**
 * 获取多个不重复的随机图标
 * @param count - 需要获取的数量
 * @param exclude - 全局需要排除的图标（可选）
 * @returns 随机图标名称数组
 */
export const getUniqueRandomIcons = (
	count: number,
	exclude?: string | string[],
): string[] => {
	const icons = getLucideIconNames();
	let pool = icons;

	if (exclude) {
		const excludeSet = new Set(
			Array.isArray(exclude) ? exclude : [exclude],
		);
		pool = icons.filter((icon) => !excludeSet.has(icon));
	}

	return getRandomElements(pool, count);
};
