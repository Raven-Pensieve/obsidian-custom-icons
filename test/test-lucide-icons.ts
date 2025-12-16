/**
 * 测试脚本：验证 Lucide 图标获取逻辑
 *
 * 用于验证：
 * 1. 是否正确去重了不同格式的导出（PascalCase, PascalCaseIcon, LucidePascalCase）
 * 2. 所有图标是否都能被正确提取
 */

import * as icons from "lucide-react";
import { getLucideIcon, getLucideIconNames } from "../src/util/getLucideIcons";

// 分析 lucide-react 的所有导出
function analyzeLucideExports() {
	const allKeys: string[] = [];
	const specialKeys: string[] = [];
	const iconKeys: string[] = [];
	const lucideKeys: string[] = [];
	const baseKeys: string[] = [];
	const functionKeys: string[] = [];

	for (const key in icons) {
		allKeys.push(key);
		const value = icons[key as keyof typeof icons];

		if (typeof value === "function") {
			functionKeys.push(key);
		}

		if (
			key === "default" ||
			key === "createLucideIcon" ||
			key === "icons"
		) {
			specialKeys.push(key);
		} else if (key.startsWith("Lucide")) {
			lucideKeys.push(key);
		} else if (key.endsWith("Icon")) {
			iconKeys.push(key);
		} else if (/^[A-Z]/.test(key)) {
			baseKeys.push(key);
		}
	}

	console.log("=== Lucide 导出分析 ===");
	console.log(`总导出数量: ${allKeys.length}`);
	console.log(`函数类型: ${functionKeys.length}`);
	console.log(`特殊键: ${specialKeys.length} (${specialKeys.join(", ")})`);
	console.log(`以 Lucide 开头: ${lucideKeys.length}`);
	console.log(`以 Icon 结尾: ${iconKeys.length}`);
	console.log(`基础 PascalCase: ${baseKeys.length}`);

	// 检查前几个函数键
	console.log(`前5个函数键: ${functionKeys.slice(0, 5).join(", ")}`);
	console.log();

	// 示例：显示某些图标的不同格式
	console.log("=== 示例：不同导出格式 ===");
	const exampleIcon = "Activity";
	const formats = [exampleIcon, `${exampleIcon}Icon`, `Lucide${exampleIcon}`];

	formats.forEach((format) => {
		const exists = format in icons;
		const value = icons[format as keyof typeof icons];
		const isFunction = typeof value === "function";
		console.log(
			`${format}: ${exists ? "✓" : "✗"} (函数: ${isFunction ? "✓" : "✗"})`
		);
	});
	console.log();
}

// 测试我们的图标提取函数
function testGetLucideIconNames() {
	console.log("=== 测试 getLucideIconNames() ===");

	// 手动测试处理逻辑
	console.log("测试名称处理逻辑:");
	const testKeys = [
		"Activity",
		"ActivityIcon",
		"LucideActivity",
		"Icon",
		"default",
		"createLucideIcon",
	];

	testKeys.forEach((key) => {
		let baseName = key;

		// 先去除 "Lucide" 前缀
		if (baseName.startsWith("Lucide")) {
			baseName = baseName.slice(6);
		}

		// 再去除 "Icon" 后缀
		if (baseName.endsWith("Icon")) {
			baseName = baseName.slice(0, -4);
		}

		const isValid = baseName && /^[A-Z]/.test(baseName);
		const iconName = isValid
			? baseName
					.replace(/([A-Z])/g, "-$1")
					.toLowerCase()
					.slice(1)
			: "";

		console.log(
			`  ${key} -> baseName: "${baseName}", valid: ${isValid}, iconName: "${iconName}"`
		);
	});
	console.log();

	const iconNames = getLucideIconNames();
	console.log(`提取的唯一图标数量: ${iconNames.length}`);
	console.log(`前10个图标: ${iconNames.slice(0, 10).join(", ")}`);
	console.log();

	// 验证几个已知图标
	const testIcons = ["activity", "apple", "arrow-right", "check", "x"];
	console.log("验证已知图标:");
	testIcons.forEach((iconName) => {
		const exists = iconNames.includes(iconName);
		const component = getLucideIcon(iconName);
		console.log(
			`  ${iconName}: ${exists ? "✓" : "✗"} (组件: ${
				component ? "✓" : "✗"
			})`
		);
	});
	console.log();
}

// 主测试函数
function runTests() {
	console.log("开始测试 Lucide 图标提取...\n");

	analyzeLucideExports();
	testGetLucideIconNames();

	// 验证数量
	console.log("=== 验证去重效果 ===");
	const iconNames = getLucideIconNames();
	const totalExports = Object.keys(icons).length - 3; // 减去 default, createLucideIcon, icons
	console.log(`总导出数（不含特殊键）: ${totalExports}`);
	console.log(`唯一图标数: ${iconNames.length}`);
	console.log(`理论上每个图标有3个导出，去重后应该是: ${totalExports / 3}`);
	console.log(`实际唯一图标数: ${iconNames.length}`);
	console.log(
		`匹配: ${
			Math.abs(iconNames.length - totalExports / 3) < 10 ? "✓" : "✗"
		}`
	);
	console.log();

	console.log("测试完成!");
}

runTests();
