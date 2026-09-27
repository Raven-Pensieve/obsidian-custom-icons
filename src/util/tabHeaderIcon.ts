import { ITabHeaderIconOverride, IIcon } from "@src/types/types";
import {
	alwaysRenderable,
	type IconRenderable,
} from "@src/util/iconRenderable";

/**
 * 标签页头图标解析工具（三级）。
 *
 * 级联优先级（自顶向下覆盖）：
 * - 单标签：tabs[`${data-type}::${aria-label}`]（aria-label 为标签显示名：
 *   文件标签=文件名、视图标签=本地化显示名，原生截断 100 字符）
 * - 类型：  data[data-type]（兜底层，同一类型全部标签共享）
 * - 继承：  fileFallback（调用方按文件路径复用文件浏览器的解析结果，
 *   仅文件标签且开关开启时提供，见 TabHeaderIconHandler）
 *
 * 任一级 icon 为空视为「未设置」，级联继续向下；全部未设置返回 null
 * （不改动，保留原生图标）。
 *
 * 键格式 `${data-type}::${aria-label}`：data-type 为机器标识不含 `:`，
 * 解析取**首个** `::`，标签名自身含 `::` 也不歧义。
 *
 * 已知限制（权衡接受，见 dev/260820/标签页图标方案.md 修订记录）：
 * - 文件标签 aria-label 仅文件名（不含路径），不同目录的同名文件共享图标；
 *   继承层按路径查找，不受此限制；
 * - 视图标签 aria-label 随界面语言本地化，切换语言后单标签条目失效（不迁移）。
 */

/** 单标签覆盖键的分隔符 */
const TAB_KEY_SEPARATOR = "::";

/** 拼接单标签覆盖键；label 为空返回空串（调用方回落类型级） */
export function buildTabKey(dataType: string, label: string): string {
	const type = dataType.trim();
	const title = label.trim();
	if (!type || !title) return "";
	return `${type}${TAB_KEY_SEPARATOR}${title}`;
}

/** 拆分单标签覆盖键（首个 `::`），非法键返回 null */
export function parseTabKey(key: string): {
	dataType: string;
	label: string;
} | null {
	const sep = key.indexOf(TAB_KEY_SEPARATOR);
	if (sep <= 0 || sep === key.length - TAB_KEY_SEPARATOR.length) return null;
	return {
		dataType: key.slice(0, sep),
		label: key.slice(sep + TAB_KEY_SEPARATOR.length),
	};
}

/**
 * 三级解析：单标签 > 类型 > 文件浏览器继承 > null。
 * label 缺失（极端时序下 aria-label 未就绪）时仅走类型级及以下。
 * fileFallback 由调用方解析（保持本函数纯：不接触 workspace/fileExplorer 配置），
 * 仅作兜底传入——前两级命中则轮不到它。
 */
export function resolveTabIcon(
	tabs: Record<string, ITabHeaderIconOverride> | undefined,
	data: Record<string, ITabHeaderIconOverride> | undefined,
	dataType: string,
	label: string | null | undefined,
	canRender: IconRenderable = alwaysRenderable,
	fileFallback: IIcon | null = null,
): IIcon | null {
	if (label) {
		const key = buildTabKey(dataType, label);
		const tabOverride = key ? tabs?.[key] : undefined;
		// 画不出来就当这一级没配，落到类型级（见 util/iconRenderable.ts）
		if (
			tabOverride?.icon &&
			tabOverride.type &&
			canRender(tabOverride.icon, tabOverride.type)
		) {
			return {
				id: key,
				icon: tabOverride.icon,
				type: tabOverride.type,
				color: tabOverride.color,
			};
		}
	}

	const typeOverride = data?.[dataType];
	if (typeOverride?.icon && typeOverride.type) {
		if (canRender(typeOverride.icon, typeOverride.type)) {
			return {
				id: dataType,
				icon: typeOverride.icon,
				type: typeOverride.type,
				color: typeOverride.color,
			};
		}
	}

	// 继承层：调用方已用同一 canRender 过滤过（resolveFileIcon 画不出返回 null），
	// 无需重复校验；为空继续落原生
	if (fileFallback?.icon && fileFallback.type) return fileFallback;
	return null;
}
