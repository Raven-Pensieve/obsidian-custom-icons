import { IconType } from "@src/types/types";
import { setIcon as obsidianSetIcon } from "obsidian";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { getLucideIcon } from "./getLucideIcons";

// 存储已创建的 React root，用于清理
const rootMap = new WeakMap<HTMLElement, Root>();
// 存储元素当前的图标信息，用于避免不必要的重新渲染
const iconStateMap = new WeakMap<
	HTMLElement,
	{ type: IconType; icon: string; color?: string }
>();

function normalizeColor(color?: string): string | undefined {
	const trimmed = color?.trim();
	return trimmed ? trimmed : undefined;
}

function applyIconColor(
	el: HTMLElement | SVGElement,
	color?: string,
): void {
	const resolvedColor = normalizeColor(color);
	if (resolvedColor) {
		el.style.color = resolvedColor;
		return;
	}

	el.style.removeProperty("color");
}

/**
 * 在指定元素中渲染图标
 * @param el - 目标元素
 * @param iconType - 图标类型
 * @param icon - 图标名称
 * @param options - 配置选项
 * @param options.append - 如果为 true，将图标作为子元素追加；否则替换元素内容
 * @param options.color - 图标颜色，留空时继承默认颜色
 * @returns 渲染图标的容器元素（仅当 append 为 true 时）
 */
export default function (
	el: HTMLElement,
	iconType: IconType,
	icon: string,
	options?: { append?: boolean; color?: string },
): HTMLElement | void {
	const resolvedColor = normalizeColor(options?.color);

	// 检查图标是否已经是目标图标，如果是则跳过渲染（仅对非 append 模式）
	if (!options?.append) {
		const currentState = iconStateMap.get(el);
		if (
			currentState &&
			currentState.type === iconType &&
			currentState.icon === icon &&
			currentState.color === resolvedColor
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
							color: resolvedColor,
							className: "lucide-icon",
						}),
					);

					// 创建一个临时容器来解析 HTML
					const tempContainer = document.createElement("div");
					tempContainer.innerHTML = svgString;

					// 获取 SVG 元素并直接插入到目标元素中
					const svgElement = tempContainer.firstChild as SVGElement;
					if (svgElement) {
						applyIconColor(svgElement, resolvedColor);
						el.appendChild(svgElement);
						return svgElement as unknown as HTMLElement;
					}
				} else {
					// 替换元素内容（原有逻辑，使用 React root）
					const existingRoot = rootMap.get(el);
					if (existingRoot) {
						existingRoot.unmount();
						rootMap.delete(el);
					}
					el.empty();
					applyIconColor(el, resolvedColor);

					const root = createRoot(el);
					rootMap.set(el, root);

					root.render(
						React.createElement(IconComponent, {
							size: 16,
							strokeWidth: 2,
							color: resolvedColor,
							className: "svg-icon",
						}),
					);

					// 更新图标状态
					iconStateMap.set(el, {
						type: iconType,
						icon,
						color: resolvedColor,
					});
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
	} else if (iconType === "svg") {
		if (options?.append) {
			const tempContainer = document.createElement("div");
			obsidianSetIcon(tempContainer, icon);
			if (tempContainer.children.length === 0) {
				obsidianSetIcon(tempContainer, `CI-${icon}`);
			}

			const svgElement = tempContainer.querySelector("svg");
			if (svgElement) {
				if (!svgElement.getAttribute("width")) {
					svgElement.setAttribute("width", "16");
				}
				if (!svgElement.getAttribute("height")) {
					svgElement.setAttribute("height", "16");
				}
				svgElement.classList.add("svg-icon");
				applyIconColor(svgElement, resolvedColor);

				el.appendChild(svgElement);
				return svgElement as unknown as HTMLElement;
			}
		} else {
			const existingRoot = rootMap.get(el);
			if (existingRoot) {
				existingRoot.unmount();
				rootMap.delete(el);
			}

			el.empty();
			obsidianSetIcon(el, icon);
			if (el.children.length === 0) {
				obsidianSetIcon(el, `CI-${icon}`);
			}
			iconStateMap.set(el, {
				type: iconType,
				icon,
				color: resolvedColor,
			});

			const svgElement = el.querySelector("svg");
			if (svgElement) {
				if (!svgElement.getAttribute("width")) {
					svgElement.setAttribute("width", "16");
				}
				if (!svgElement.getAttribute("height")) {
					svgElement.setAttribute("height", "16");
				}
				svgElement.classList.add("svg-icon");
				applyIconColor(svgElement, resolvedColor);
			}
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
