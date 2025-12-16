import { IconType } from "@src/types/types";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { getLucideIcon } from "./getLucideIcons";

// 存储已创建的 React root，用于清理
const rootMap = new WeakMap<HTMLElement, Root>();
// 存储元素当前的图标信息，用于避免不必要的重新渲染
const iconStateMap = new WeakMap<
	HTMLElement,
	{ type: IconType; icon: string }
>();

/**
 * 在指定元素中渲染图标
 * @param el - 目标元素
 * @param iconType - 图标类型
 * @param icon - 图标名称
 * @param options - 配置选项
 * @param options.append - 如果为 true，将图标作为子元素追加；否则替换元素内容
 * @returns 渲染图标的容器元素（仅当 append 为 true 时）
 */
export default function (
	el: HTMLElement,
	iconType: IconType,
	icon: string,
	options?: { append?: boolean }
): HTMLElement | void {
	// 检查图标是否已经是目标图标，如果是则跳过渲染（仅对非 append 模式）
	if (!options?.append) {
		const currentState = iconStateMap.get(el);
		if (
			currentState &&
			currentState.type === iconType &&
			currentState.icon === icon
		) {
			return; // 图标没有变化，跳过渲染
		}
	}

	// 支持 lucide-react (v0.561.0) 图标
	if (iconType === "lucide") {
		const IconComponent = getLucideIcon(icon);

		if (IconComponent) {
			try {
				if (options?.append) {
					// 使用 renderToStaticMarkup 将 React 组件渲染为静态 HTML 字符串
					const svgString = renderToStaticMarkup(
						React.createElement(IconComponent, {
							size: 16,
							strokeWidth: 2,
							className: "lucide-icon",
						})
					);

					// 创建一个临时容器来解析 HTML
					const tempContainer = document.createElement("div");
					tempContainer.innerHTML = svgString;

					// 获取 SVG 元素并直接插入到目标元素中
					const svgElement = tempContainer.firstChild as SVGElement;
					if (svgElement) {
						el.appendChild(svgElement);
						return svgElement as any;
					}
				} else {
					// 替换元素内容（原有逻辑，使用 React root）
					const existingRoot = rootMap.get(el);
					if (existingRoot) {
						existingRoot.unmount();
						rootMap.delete(el);
					}
					el.empty();

					const root = createRoot(el);
					rootMap.set(el, root);

					root.render(
						React.createElement(IconComponent, {
							size: 16,
							strokeWidth: 2,
							className: "lucide-icon",
						})
					);

					// 更新图标状态
					iconStateMap.set(el, { type: iconType, icon });
				}
			} catch (error) {
				console.error(`Error rendering Lucide icon "${icon}":`, error);
				if (!options?.append) {
					const root = rootMap.get(el);
					if (root) {
						root.unmount();
						rootMap.delete(el);
					}
					// 清理图标状态
					iconStateMap.delete(el);
				}
			}
		} else {
			console.warn(`Lucide icon "${icon}" not found`);
		}
	}
}

export function cleanupIcon(el: HTMLElement) {
	const existingRoot = rootMap.get(el);
	if (existingRoot) {
		existingRoot.unmount();
		rootMap.delete(el);
	}
	iconStateMap.delete(el);
	el.empty();
}
