import { IIcon } from "@src/types/types";
import setIcon from "@src/util/setIcon";
import { syntaxTree } from "@codemirror/language";
import { EditorSelection, RangeSetBuilder } from "@codemirror/state";
import {
	Decoration,
	type DecorationSet,
	type EditorView,
	type ViewUpdate,
	ViewPlugin,
	WidgetType,
} from "@codemirror/view";
import { editorInfoField, editorLivePreviewField } from "obsidian";

/**
 * 实时预览的内部链接图标装饰（CM6）。
 *
 * 姿势来自本机 Meta Bind 编译产物的实证（dev/ecosystem/正文内联图标插件联动方案.md §3.3）：
 * 语法树 token 判节点、光标让位、只扫 visibleRanges、widget 用编辑器所在 document。
 * 与那篇方案的差异：这里是 **additive widget**（链接起点前插一个图标 span），
 * 不 replace 原文——链接本体的渲染仍完全归 Obsidian 自己的装饰管。
 *
 * 注册后无法反注册（registerEditorExtension 随插件 unload 回收），行为由
 * ctx.isEnabled() 每次重算时门控；开关切换后由 handler 派发空事务强制重算。
 */

/** 与 styles/fix.css 的 .custom-icon-internal-link-icon 对应（阅读模式管线共用） */
export const LINK_ICON_CLASS = "custom-icon-internal-link-icon";

/** handler 注入的运行时上下文（均为活引用，重算时读到的是最新设置） */
export interface LinkIconExtensionCtx {
	isEnabled(): boolean;
	/** 链接原文（`[[Note|别名]]` 切片）→ 图标；null = 不装饰 */
	resolve(rawLink: string, sourcePath: string): IIcon | null;
}

/** 链接首部图标。eq 按三元组比对，避免每次 update 重建 DOM。 */
class LinkIconWidget extends WidgetType {
	constructor(readonly icon: IIcon) {
		super();
	}

	eq(other: LinkIconWidget): boolean {
		return (
			other.icon.type === this.icon.type &&
			other.icon.icon === this.icon.icon &&
			(other.icon.color ?? "") === (this.icon.color ?? "")
		);
	}

	toDOM(view: EditorView): HTMLElement {
		// popout 窗口：必须用编辑器所在的 document（与 setIcon 的 ownerDocument 约定同源）
		const span = view.dom.ownerDocument.createElement("span");
		span.className = LINK_ICON_CLASS;
		// size:null = 不写 width/height，尺寸交给 CSS 的 1em 盒子
		setIcon(span, this.icon.type, this.icon.icon, {
			color: this.icon.color || undefined,
			size: null,
		});
		return span;
	}

	/** 纯装饰：不让 widget 上的事件触发视图更新 */
	ignoreEvent(): boolean {
		return true;
	}
}

/** 选区与 [from, to] 有交叠（含贴边）。光标让位判定用 */
function overlapsSelection(
	sel: EditorSelection,
	from: number,
	to: number,
): boolean {
	for (const range of sel.ranges) {
		if (range.to >= from && range.from <= to) return true;
	}
	return false;
}

function buildDecorations(
	view: EditorView,
	ctx: LinkIconExtensionCtx,
): DecorationSet {
	if (!ctx.isEnabled()) return Decoration.none;
	// 源码模式不渲染：露出的就是 [[..]] 原文，再贴图标就成了孤儿
	if (!view.state.field(editorLivePreviewField)) return Decoration.none;

	const sourcePath = view.state.field(editorInfoField, false)?.file?.path ?? "";
	const builder = new RangeSetBuilder<Decoration>();

	for (const { from, to } of view.visibleRanges) {
		syntaxTree(view.state).iterate({
			from,
			to,
			enter: (node) => {
				/*
				 * 节点判定（Obsidian 1.13 实测，dev/261106 方案）：
				 *
				 * HyperMD 把「所有适用类型」的 token 下划线拼进**同一个节点名**，
				 * 上下文（标题/加粗/列表/引用/表格…）不是祖先嵌套而是名字前缀——
				 * `header_header-1_hmd-internal-link`、`hmd-internal-link_strong`、
				 * `hmd-internal-link_list-1`、`hmd-internal-link_quote_quote-1`。
				 * 故只能按 token 判定，**精确名匹配只命中裸段落**（首版 bug）。
				 *
				 * - wikilink href 节点：token `hmd-internal-link`；排除
				 *   `link-alias` / `link-alias-pipe`（别名链接的别名段与管道符，
				 *   href 段带 `link-has-alias` 不受排除影响）；
				 * - md 链接标签节点：token `link`；排除 `formatting`（括号）、
				 *   `hmd-barelink`（裸链 / 脚注引用 / 标注徽章 `[!note]`）、
				 *   `hmd-footnote`、`hmd-internal-link`（wikilink 不走 md 提取）；
				 * - 嵌入（![[..]] / ![..](..)）：token `hmd-embed` 一律不装饰
				 *   （HyperMD 里嵌入没有独立祖先节点，token 就在自身名字里）。
				 */
				const name = node.type.name ?? "";
				const tokens = name.split("_");
				const has = (token: string) => tokens.includes(token);
				const isEmbed = has("hmd-embed") || has("embed");
				if (isEmbed) return;
				const isWikiHref =
					has("hmd-internal-link") ||
					name === "internal-link"; // 旧版树名兜底
				const isMdLink =
					has("link") &&
					!isWikiHref &&
					!has("formatting") &&
					!has("hmd-barelink") &&
					!has("hmd-footnote");
				if (!isWikiHref && !isMdLink) return;
				// 别名 wikilink 的别名段与管道符：同 token 但不是 href
				if (isWikiHref && (has("link-alias") || has("link-alias-pipe"))) {
					return;
				}
				if (
					node.from > 0 &&
					view.state.sliceDoc(node.from - 1, node.from) === "!"
				) {
					return;
				}
				if (
					node.from > 0 &&
					view.state.sliceDoc(node.from - 1, node.from) === "!"
				) {
					return;
				}
				/*
				 * 让位窗口取**整个链接跨度**而非 href 节点：`[[`/`]]` 括号是独立
				 * formatting 节点，光标进入链接时 Obsidian 会把选区弹到 `[[`
				 * 之前（实测被弹到 node.from-2），只查节点区间会让「露源码 +
				 * 孤儿图标」同时出现。
				 */
				let fullFrom: number;
				let fullTo: number;
				let raw = view.state.sliceDoc(node.from, node.to);
				if (isMdLink) {
					// [文本](target)：标签节点之后紧跟 ](target)，向后截一段再匹配；
					// 裸 URL 自动链接等无此形态，url 落空即跳过
					const tail = view.state.sliceDoc(
						node.to,
						Math.min(node.to + 500, view.state.doc.length),
					);
					const m = tail.match(/^]?\(([^()\s]*)\)/);
					if (!m) return;
					raw = m[1];
					fullFrom = Math.max(0, node.from - 1); // 前面的 [
					fullTo = node.to + m[0].length; // 含 ](…)
				} else {
					// wikilink：前面恒为 [[（嵌入已被排除）；向后扫到 ]]
					const after = view.state.sliceDoc(
						node.to,
						Math.min(node.to + 256, view.state.doc.length),
					);
					const close = after.indexOf("]]");
					fullFrom = Math.max(0, node.from - 2);
					fullTo = close >= 0 ? node.to + close + 2 : node.to + 2;
				}
				if (overlapsSelection(view.state.selection, fullFrom, fullTo)) {
					return;
				}
				const icon = ctx.resolve(raw, sourcePath);
				if (!icon) return;
				// 负 side：与 Obsidian 自己的链接 widget 同位时排在它前面
				builder.add(
					node.from,
					node.from,
					Decoration.widget({
						widget: new LinkIconWidget(icon),
						side: -20,
					}),
				);
			},
		});
	}

	return builder.finish();
}

/**
 * 建一个 ViewPlugin 扩展。update 无条件重算（可见区很小，且设置变更/空事务
 * 都不改变 doc/selection/viewport，按条件跳过会漏掉开关切换）。
 */
export function buildLinkIconExtension(
	ctx: LinkIconExtensionCtx,
): ViewPlugin<{ decorations: DecorationSet }> {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = buildDecorations(view, ctx);
			}

			update(update: ViewUpdate) {
				this.decorations = buildDecorations(update.view, ctx);
			}
		},
		{
			decorations: (plugin) => plugin.decorations,
		},
	);
}
