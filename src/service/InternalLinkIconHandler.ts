import type { EditorView } from "@codemirror/view";
import type CIPlugin from "@src/main";
import { IIcon } from "@src/types/types";
import { createIconRenderable } from "@src/util/createIconRenderable";
import type { IFileExplorerConfig } from "@src/util/fileExplorerIcon";
import { AbstractIconHandler } from "@src/util/IconHandler";
import type { IconRenderable } from "@src/util/iconRenderable";
import {
	LinkDestinationResolver,
	LinkIconResolveMode,
	resolveLinkIcon,
} from "@src/util/internalLinkIcon";
import setIcon, { cleanupIcon } from "@src/util/setIcon";
import {
	EventRef,
	MarkdownPostProcessorContext,
	MarkdownView,
	WorkspaceLeaf,
} from "obsidian";
import { buildLinkIconExtension } from "./internal-links/linkIconExtension";

export interface IInternalLinksConfig {
	enable: boolean;
	resolve: LinkIconResolveMode;
}

/**
 * 正文内部链接图标处理器（插入型，方案见 dev/261105/内部链接内联图标方案.md）。
 *
 * 为正文里指向「已配图标文件」的内部链接（a.internal-link）在锚点内、文本前
 * 插入图标。数据源复用 fileExplorer 配置表（tabHeader.inheritFromFileExplorer
 * 同款先例：读的是配置表，各管各的渲染位置，不受 fileExplorer.enable 约束）。
 *
 * 两条渲染管线，注册常驻、行为由 isEnabled() 门控——两条注册 API 都无法反注册
 * （随插件 unload 自动回收），开关切换 = 翻转 flag + 全量重扫/强制重算：
 * - 阅读模式：registerMarkdownPostProcessor（hover 预览 / 嵌入 / Canvas / 导出
 *   同管线自动覆盖）；
 * - 实时预览：registerEditorExtension + CM6 ViewPlugin（internal-links/）。
 *
 * 源码模式不渲染（露出 [[..]] 原文是正确行为）；未解析链接与无映射目标
 * 一律不显示。Dataview / Bases 等绕过 post-processor 的第三方渲染表面
 * 属 M2 兜底范围，M1 不做。
 */
export default class InternalLinkIconHandler extends AbstractIconHandler<IInternalLinksConfig> {
	readonly id = "internalLinks";

	private readonly iconClass = "custom-icon-internal-link-icon";
	private readonly anchorSelector = "a.internal-link:not(.is-unresolved)";

	/** 两条管线的注册只做一次（不可反注册，见类注释） */
	private registered = false;
	private renameEventRef: EventRef | null = null;
	private deleteEventRef: EventRef | null = null;
	/** vault 事件合并 → 下一帧一次全量重扫（同 FileExplorerIconHandler 模式） */
	private rescanHandle: number | null = null;

	constructor(private plugin: CIPlugin) {
		super();
	}

	apply(): void {
		if (!this.isEnabled()) {
			this.cleanup();
			return;
		}

		this.ensureRegistered();
		this.registerVaultEvents();

		this.app.workspace.onLayoutReady(() => this.resweepAll());
	}

	cleanup(): void {
		if (this.renameEventRef) {
			this.app.vault.offref(this.renameEventRef);
			this.renameEventRef = null;
		}
		if (this.deleteEventRef) {
			this.app.vault.offref(this.deleteEventRef);
			this.deleteEventRef = null;
		}
		if (this.rescanHandle !== null) {
			window.cancelAnimationFrame(this.rescanHandle);
			this.rescanHandle = null;
		}

		this.removeAllIcons();
		// 装饰重算一次（isEnabled 已为 false → 空集），否则编辑器里的图标
		// 要等到下一次按键才消失
		this.refreshEditors();
	}

	isEnabled(): boolean {
		return this.settings?.enable ?? false;
	}

	// ---------------------------------------------------------------------
	// 常驻注册（onload 一次，之后只靠 flag 门控）
	// ---------------------------------------------------------------------

	private ensureRegistered(): void {
		if (this.registered) return;
		this.registered = true;

		// 阅读模式管线：el 为单个 section 的容器，按 section 调用、成本与
		// 该 section 的链接数成正比。ctx.sourcePath 即相对链接的解析基准
		this.plugin.registerMarkdownPostProcessor(
			(el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
				if (!this.isEnabled()) return;
				this.decorateAnchors(el, ctx.sourcePath);
			},
		);

		// 实时预览管线：门控与解析都在 ctx 回调里读最新状态
		this.plugin.registerEditorExtension(
			buildLinkIconExtension({
				isEnabled: () => this.isEnabled(),
				resolve: (rawLink, sourcePath) => this.resolveIcon(rawLink, sourcePath),
			}),
		);
	}

	/** 链接原文 → 图标。每条管线各自建一次 canRender（惰性快照，一轮一个） */
	private resolveIcon(rawLink: string, sourcePath: string): IIcon | null {
		return resolveLinkIcon(
			rawLink,
			sourcePath,
			this.plugin.settings.fileExplorer,
			this.settings?.resolve ?? "explicit",
			createIconRenderable(),
			this.resolveDest,
		);
	}

	/** metadataCache 接线：linktext 路径段 + 解析基准 → 目标文件路径 */
	private readonly resolveDest: LinkDestinationResolver = (
		linkPath,
		sourcePath,
	): string | undefined =>
		this.app.metadataCache.getFirstLinkpathDest(linkPath, sourcePath)?.path ??
		undefined;

	// ---------------------------------------------------------------------
	// DOM 定位与渲染（阅读模式 + 重扫共用）
	// ---------------------------------------------------------------------

	private decorateAnchors(root: HTMLElement, sourcePath: string): void {
		const canRender = createIconRenderable();
		const cfg = this.plugin.settings.fileExplorer;
		const mode = this.settings?.resolve ?? "explicit";

		root
			.querySelectorAll<HTMLAnchorElement>(this.anchorSelector)
			.forEach((anchor) => {
				// 编辑器容器内的链接由 CM6 装饰扩展管理（widget 随更新重建），
				// DOM 扫描不得插手，否则插入的节点会随 widget 重建泄漏成孤儿
				if (anchor.closest(".cm-editor")) return;
				this.applyToAnchor(anchor, sourcePath, cfg, mode, canRender);
			});
	}

	private applyToAnchor(
		anchor: HTMLAnchorElement,
		sourcePath: string,
		cfg: IFileExplorerConfig,
		mode: LinkIconResolveMode,
		canRender: IconRenderable,
	): void {
		const icon = resolveLinkIcon(
			anchor.dataset.href,
			sourcePath,
			cfg,
			mode,
			canRender,
			this.resolveDest,
		);

		const existing = anchor.querySelector<HTMLElement>(
			`:scope > .${this.iconClass}`,
		);

		// 无图标（含映射被清空 / 级联档不再命中）：移除此前插入的
		if (!icon) {
			if (existing) {
				cleanupIcon(existing);
				existing.remove();
			}
			return;
		}

		let iconEl = existing;
		if (!iconEl) {
			iconEl = anchor.createSpan({ cls: this.iconClass });
			// 锚点内、文本前：随链接点击/悬停，无游离孤儿
			anchor.insertBefore(iconEl, anchor.firstChild);
		} else if (this.isSameIcon(iconEl, icon)) {
			return; // 幂等：无变化跳过
		}

		// size 不传像素：1em 跟随字号（标题里的链接自动放大），尺寸交给 CSS
		setIcon(iconEl, icon.type, icon.icon, {
			color: icon.color || undefined,
			size: null,
		});

		// 仅当实际渲染出 svg 时记录 data-icon-*，渲染失败留待下一轮重试
		if (iconEl.querySelector("svg")) {
			iconEl.setAttribute("data-icon-type", icon.type);
			iconEl.setAttribute("data-icon-name", icon.icon);
			iconEl.setAttribute("data-icon-color", icon.color ?? "");
		}
	}

	private isSameIcon(iconEl: HTMLElement, icon: IIcon): boolean {
		return (
			iconEl.getAttribute("data-icon-type") === icon.type &&
			iconEl.getAttribute("data-icon-name") === icon.icon &&
			iconEl.getAttribute("data-icon-color") === (icon.color ?? "")
		);
	}

	// ---------------------------------------------------------------------
	// 全量重扫：设置变更 / vault 事件后的既存内容刷新
	// ---------------------------------------------------------------------

	/**
	 * 重扫全部 markdown 视图。apply()（含设置保存后的 applyAll）与 vault
	 * rename/delete 都走这里：preview 侧幂等重扫，编辑器侧强制重算装饰。
	 */
	private resweepAll(): void {
		this.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
			const view = leaf.view;
			if (!(view instanceof MarkdownView)) return;
			const container = view.containerEl;
			if (!container) return;
			this.decorateAnchors(container, this.leafSourcePath(view));
		});
		this.refreshEditors();
	}

	/** 后台未加载标签的 view.file 为空（deferred view），回落 viewState（同 TabHeaderIconHandler） */
	private leafSourcePath(view: MarkdownView): string {
		if (view.file) return view.file.path;
		const state = view.leaf
			.getViewState()
			?.state as ({ file?: string } | undefined) ?? undefined;
		return state?.file ?? "";
	}

	/** 向全部 markdown 编辑器派发空事务，触发装饰按当前设置重算 */
	private refreshEditors(): void {
		this.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
			const view = leaf.view;
			if (!(view instanceof MarkdownView)) return;
			// Editor.cm 无官方类型（obsidian.d.ts 未声明）；@obsidian-typings 亦无，
			// 与社区通行做法一致：窄化断言取内部 EditorView
			const cm = (view.editor as unknown as { cm?: EditorView }).cm;
			if (cm) {
				cm.dispatch({});
			}
		});
	}

	private removeAllIcons(): void {
		// iterateAllLeaves 覆盖主窗口 + popout；hover 预览弹层不是 leaf，但它
		// 由 post-processor 门控渲染且随关闭销毁，无需在此清理
		this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
			leaf.view.containerEl
				?.querySelectorAll<HTMLElement>(`.${this.iconClass}`)
				.forEach((el) => {
					cleanupIcon(el);
					el.remove();
				});
		});
	}

	// ---------------------------------------------------------------------
	// vault 事件：目标改名/删除后，既存链接的解析结果已变
	// ---------------------------------------------------------------------

	private registerVaultEvents(): void {
		if (!this.renameEventRef) {
			this.renameEventRef = this.app.vault.on("rename", () => {
				if (!this.isEnabled()) return;
				this.scheduleRescan();
			});
		}
		if (!this.deleteEventRef) {
			this.deleteEventRef = this.app.vault.on("delete", () => {
				if (!this.isEnabled()) return;
				this.scheduleRescan();
			});
		}
	}

	private scheduleRescan(): void {
		if (this.rescanHandle !== null) return;
		this.rescanHandle = window.requestAnimationFrame(() => {
			this.rescanHandle = null;
			if (!this.isEnabled()) return;
			this.resweepAll();
		});
	}
}
