import { ICommunityPluginIcon } from "@src/types/types";
import addIconToPluginNavItem from "../addIconToPluginNavItem";
import { AbstractIconHandler } from "../IconHandler";

interface ICommunityPluginConfig {
	enable: boolean;
	default: ICommunityPluginIcon;
	data: Record<string, ICommunityPluginIcon>;
}

/**
 * 社区插件图标处理器
 * 负责替换社区插件设置页面中的插件图标
 */
export default class CommunityPluginIconHandler extends AbstractIconHandler<ICommunityPluginConfig> {
	readonly id = "communityPlugins";

	private mutationObserver: MutationObserver | null = null;

	apply(): void {
		if (!this.isEnabled()) {
			this.cleanup();
			return;
		}

		// 等待布局准备好
		this.app.workspace.onLayoutReady(() => {
			this.applyIconsToExistingPlugins();
			this.setupMutationObserver();
		});
	}

	cleanup(): void {
		if (this.mutationObserver) {
			this.mutationObserver.disconnect();
			this.mutationObserver = null;
		}

		// 移除所有自定义图标
		this.removeCustomIcons();
	}

	isEnabled(): boolean {
		return this.settings?.enable ?? false;
	}

	/**
	 * 为已存在的插件项添加图标
	 */
	private applyIconsToExistingPlugins(): void {
		const communityPluginTabContainer =
			this.app.setting.communityPluginTabContainer;

		const pluginNavItems = communityPluginTabContainer.querySelectorAll(
			".vertical-tab-nav-item[data-setting-id]"
		) as NodeListOf<HTMLElement>;

		pluginNavItems.forEach((navItemEl) => {
			this.applyIconToNavItem(navItemEl);
		});
	}

	/**
	 * 为单个导航项应用图标
	 */
	private applyIconToNavItem(navItemEl: HTMLElement): void {
		const pluginId = navItemEl.getAttribute("data-setting-id");
		if (!pluginId) return;

		// 优先使用插件特定的图标配置，否则使用默认配置
		const iconConfig =
			this.settings.data[pluginId] || this.settings.default;

		addIconToPluginNavItem(navItemEl, iconConfig);
	}

	/**
	 * 设置 MutationObserver 监听新添加的插件项
	 */
	private setupMutationObserver(): void {
		// 如果已存在，先清理
		if (this.mutationObserver) {
			this.mutationObserver.disconnect();
		}

		const communityPluginTabContainer =
			this.app.setting.communityPluginTabContainer;

		this.mutationObserver = new MutationObserver((mutations) => {
			// 在回调中再次检查是否启用，防止在禁用后仍然执行
			if (!this.isEnabled()) {
				return;
			}

			mutations.forEach((mutation) => {
				mutation.addedNodes.forEach((node) => {
					if (
						node instanceof HTMLElement &&
						node.classList.contains("vertical-tab-nav-item") &&
						node.hasAttribute("data-setting-id")
					) {
						this.applyIconToNavItem(node);
					}
				});
			});
		});

		// 开始观察社区插件容器的子元素变化
		this.mutationObserver.observe(communityPluginTabContainer, {
			childList: true,
			subtree: true,
		});
	}

	/**
	 * 移除所有自定义图标
	 */
	private removeCustomIcons(): void {
		const communityPluginTabContainer =
			this.app.setting.communityPluginTabContainer;

		const customIcons = communityPluginTabContainer.querySelectorAll(
			".vertical-tab-nav-item-icon.custom-icon"
		);

		customIcons.forEach((icon) => icon.remove());
	}
}
