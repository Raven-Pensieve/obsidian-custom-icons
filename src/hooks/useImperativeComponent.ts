import { useLayoutEffect, useState } from "react";

/**
 * 在 effect 生命周期内创建/销毁 Obsidian 命令式组件，而不是渲染期（useMemo）。
 *
 * 渲染期创建在 React 18 StrictMode（dev 构建启用）下不可重入：
 * - 双重渲染把 factory 执行两次，第一次的产物成为无人认领的 DOM 残留（空壳）；
 * - 模拟卸载（mount → cleanup → setup）跑一遍 cleanup，useMemo 的产物被
 *   destroy 后 setup 不会重建——界面只剩空壳。
 * 生产构建 StrictMode 为 no-op，所以这类问题只在 pnpm dev 下显形。
 *
 * 创建移进 useLayoutEffect 后：setup 创建、cleanup 销毁，StrictMode 的模拟
 * 循环会自然重建出新实例；deps 变化时先销毁旧实例再建新实例。
 *
 * @param deps 重建依赖（如 [slotEl]）。factory / destroy 是每次渲染的
 *   新闭包，不作为 effect 依赖——重建时机由 deps 显式控制
 * @returns 组件实例；创建完成前的首次渲染为 null（调用方据此挂起 JSX）
 */
export function useImperativeComponent<T>(
	deps: unknown[],
	factory: () => T,
	destroy: (component: T) => void,
): T | null {
	const [component, setComponent] = useState<T | null>(null);

	// deps 由调用方显式给出；factory/destroy 是每次渲染的内联闭包，
	// 放进依赖会让实例随每次渲染重建
	useLayoutEffect(() => {
		const instance = factory();
		setComponent(instance);
		return () => destroy(instance);
	}, deps);

	return component;
}
