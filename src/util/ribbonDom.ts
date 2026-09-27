import type { App } from "obsidian";

/** 旧版（≤1.12）ribbon 按钮容器选择器；1.13+ DOM 重构后可能失配 */
const RIBBON_CONTAINER_SELECTOR =
	".workspace-ribbon.mod-left .side-dock-actions";

/** ribbon 按钮本身的类名（addRibbonIcon 产物） */
export const RIBBON_ACTION_SELECTOR = ".side-dock-ribbon-action";

/** nodeType 1 = ELEMENT_NODE，比 instanceof 更稳（跨窗口也成立） */
function isElementLike(el: unknown): el is HTMLElement {
	return !!el && (el as Node).nodeType === 1;
}

function getLeftRibbonContainerEl(app: App): unknown {
	return (app.workspace.leftRibbon as { containerEl?: unknown } | undefined)
		?.containerEl;
}

/**
 * ribbon 按钮容器：DOM 选择器优先，`workspace.leftRibbon.containerEl` 兜底。
 *
 * ribbon 仅存在于主窗口；workspace.containerEl 恒在主窗口，
 * 其 .doc 即主窗口 document，不受 popout 聚焦影响。
 */
export function getRibbonActionContainers(app: App): HTMLElement[] {
	const doc = app.workspace.containerEl.doc;
	const selectorHits = Array.from(
		doc.querySelectorAll<HTMLElement>(RIBBON_CONTAINER_SELECTOR),
	);
	if (selectorHits.length > 0) {
		return selectorHits;
	}

	/*
	 * 1.13+ 类型里 WorkspaceRibbon 已无公开成员（DOM 重构），
	 * 但运行时实例仍持有 containerEl——按钮容器的权威入口，
	 * 不随选择器失配。
	 */
	const apiContainer = getLeftRibbonContainerEl(app);
	return isElementLike(apiContainer) ? [apiContainer] : [];
}
