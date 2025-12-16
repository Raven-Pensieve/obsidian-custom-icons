import * as icons from "lucide-react";

/**
 * 获取所有可用的 Lucide 图标名称列表
 * 从 lucide-react 包中提取所有图标组件名称
 */
export function getLucideIconNames(): string[] {
	const iconNames: string[] = [];

	for (const key in icons) {
		const value = icons[key as keyof typeof icons];

		// lucide-react 导出三种格式：
		// 1. PascalCase (如 Apple)
		// 2. PascalCaseIcon (如 AppleIcon)
		// 3. LucidePascalCase (如 LucideApple)
		// 我们只使用第一种 PascalCase 格式
		if (
			key !== "default" &&
			key !== "createLucideIcon" &&
			!key.startsWith("Lucide") && // 过滤掉 Lucide 前缀的版本
			!key.endsWith("Icon") && // 过滤掉 Icon 后缀的版本
			/^[A-Z]/.test(key) &&
			value !== undefined
		) {
			// 将 PascalCase 转换为 kebab-case
			const iconName = key
				.replace(/([A-Z])/g, "-$1")
				.toLowerCase()
				.slice(1);

			// 过滤掉空字符串
			if (iconName) {
				iconNames.push(iconName);
			}
		}
	}

	return iconNames.sort();
}

/**
 * 将 kebab-case 图标名称转换为 PascalCase 组件名称
 * 例如：arrow-right -> ArrowRight
 */
export function iconNameToComponentName(iconName: string): string {
	const pascalCase = iconName
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join("");

	return pascalCase;
}

/**
 * 获取 Lucide 图标组件
 * @param iconName - kebab-case 格式的图标名称（例如：'arrow-right'）
 * @returns 图标组件或 undefined
 */
export function getLucideIcon(
	iconName: string
): React.ComponentType<any> | undefined {
	if (!iconName) {
		console.warn("getLucideIcon: iconName is empty");
		return undefined;
	}

	const componentName = iconNameToComponentName(iconName);

	// 直接获取 PascalCase 格式的图标组件
	const component = icons[componentName as keyof typeof icons] as
		| React.ComponentType<any>
		| undefined;

	if (!component) {
		console.warn(`Lucide icon "${iconName}" (${componentName}) not found`);
	}

	return component;
}
