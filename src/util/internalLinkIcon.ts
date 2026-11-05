import { IFileExplorerIconOverride, IIcon } from "@src/types/types";
import {
	hasIcon,
	type IFileExplorerConfig,
	resolveFileIcon,
	toIcon,
} from "@src/util/fileExplorerIcon";
import type { IconRenderable } from "@src/util/iconRenderable";

/**
 * 内部链接图标解析工具。
 *
 * 消费 `fileExplorer` 的配置表（files / extensions / 继承 / fileDefault），
 * 为正文里的内部链接（`a.internal-link`）解析目标文件的图标——与
 * `tabHeader.inheritFromFileExplorer` 同一先例：**读的是配置表，各管各的渲染
 * 位置**，不受 `fileExplorer.enable` 约束。
 *
 * 两档解析（`resolve` 设置）：
 * - `explicit`：只认 `files[path]` 的精确映射——「这篇笔记单独配过图标」；
 * - `cascade`：`resolveFileIcon` 全级联，与文件浏览器所见一致。
 *
 * 两档都过 `canRender`：引用画不出来（包停用 / SVG 删除）视为未配置，
 * 重新启用后自动恢复（见 iconRenderable.ts）。
 *
 * 目标解析（linktext → 路径）以注入的方式提供，保持本模块纯函数、可单测——
 * 与 iconRenderable.ts 拆 build/create 是同一个套路。
 */

/** 解析档位：explicit = 仅精确映射；cascade = 文件浏览器全级联 */
export type LinkIconResolveMode = "explicit" | "cascade";

/**
 * linktext 路径段解析器。
 * 生产环境接 `metadataCache.getFirstLinkpathDest(linkPath, sourcePath)?.path`
 * （相对 md 链接与 wikilink 统一走这一条路）；返回 undefined = 未解析。
 */
export type LinkDestinationResolver = (
	linkPath: string,
	sourcePath: string,
) => string | undefined;

/**
 * 从内部链接原文里取出「路径段」。
 *
 * 输入两种形态（都只做纯文本切分，不碰 DOM）：
 * - 渲染锚点的 `data-href`：`Note` / `Note#标题` / `Note#^block`
 * - CM6 语法树切片原文：`[[Note]]` / `[[Note|别名]]` / `[[Note#标题|别名]]`
 *
 * `|`（别名）与 `#`（小节 / 块引用）之后的内容一律剥掉。
 * 同文件小节链接（`[[#标题]]`）的路径段为空串，由 `resolveLinkIcon`
 * 回落为 sourcePath 自身。
 */
export function extractLinkPath(raw: string): string {
	let text = raw.trim();
	// wikilink 原文形态：剥掉首尾括号；data-href 无括号，检查天然不命中
	if (text.startsWith("[[") && text.endsWith("]]")) {
		text = text.slice(2, -2);
	}
	const pipe = text.indexOf("|");
	if (pipe >= 0) text = text.slice(0, pipe);
	const hash = text.indexOf("#");
	if (hash >= 0) text = text.slice(0, hash);
	return text.trim();
}

/**
 * 解析内部链接的目标图标。
 *
 * @param rawLink 链接原文（data-href 或 `[[…]]` 切片，见 extractLinkPath）
 * @param sourcePath 链接所在文件的路径（相对链接的解析基准；`[[#节]]` 的回落目标）
 * @param cfg fileExplorer 配置表（只读）
 * @param mode 解析档位
 * @param canRender 「画得出来吗」判定（失效引用按未配置处理）
 * @param resolveDest linktext 路径段 → 目标文件路径
 * @returns 图标；未解析 / 无映射 / 引用失效返回 null（语义：不显示）
 */
export function resolveLinkIcon(
	rawLink: string | undefined,
	sourcePath: string,
	cfg: IFileExplorerConfig,
	mode: LinkIconResolveMode,
	canRender: IconRenderable,
	resolveDest: LinkDestinationResolver,
): IIcon | null {
	if (!rawLink) return null;
	const linkPath = extractLinkPath(rawLink);

	// 同文件小节链接（[[#节]] / data-href "#节"）：目标就是当前文件；
	// sourcePath 为空（新建未落盘 / 无名视图）则无从谈起
	const dest = linkPath
		? resolveDest(linkPath, sourcePath)
		: sourcePath || undefined;
	if (!dest) return null;

	if (mode === "cascade") {
		return resolveFileIcon(dest, cfg, canRender);
	}

	// explicit：只认 files[dest] 精确映射，但同样要过失效判定——
	// 与文件树的表现一致（画不出 = 这一级没配），包恢复后自动回来
	const override: IFileExplorerIconOverride | undefined = cfg.files?.[dest];
	return hasIcon(override, canRender) ? toIcon(dest, override) : null;
}
