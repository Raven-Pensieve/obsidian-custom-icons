import { ICommunityPluginIcon } from "@src/types/types";
import { AbstractIconHandler } from "@src/util/IconHandler";
import setIcon from "@src/util/setIcon";

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
			this.addContainerClassName();
			this.applyIconsToExistingPlugins();
			this.setupMutationObserver();
		});
	}

	cleanup(): void {
		if (this.mutationObserver) {
			this.mutationObserver.disconnect();
			this.mutationObserver = null;
		}

		// 移除容器类名
		this.removeContainerClassName();

		// 移除所有自定义图标
		this.removeCustomIcons();
	}

	isEnabled(): boolean {
		return this.settings?.enable ?? false;
	}

	/**
	 * 为容器添加自定义类名
	 */
	private addContainerClassName(): void {
		const container = document.querySelector(
			'.vertical-tab-header-group-items[data-section="community-plugins"]',
		);
		if (container) {
			container.classList.add("custom-icon-community-plugins");
		}
	}

	/**
	 * 移除容器的自定义类名
	 */
	private removeContainerClassName(): void {
		const container = document.querySelector(
			'.vertical-tab-header-group-items[data-section="community-plugins"]',
		);
		if (container) {
			container.classList.remove("custom-icon-community-plugins");
		}
	}

	/**
	 * 为已存在的插件项添加图标
	 */
	private applyIconsToExistingPlugins(): void {
		const communityPluginTabContainer =
			this.app.setting.communityPluginTabContainer;

		const pluginNavItems = communityPluginTabContainer.querySelectorAll(
			".vertical-tab-nav-item[data-setting-id]",
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

		this.addIconToPluginNavItem(navItemEl, iconConfig);
	}

	private addIconToPluginNavItem(
		navItemEl: HTMLElement,
		communityPlugin: ICommunityPluginIcon,
	) {
		// 检查是否存在原生图标（没有 custom-icon 类的）
		const nativeIcon = navItemEl.querySelector(
			".vertical-tab-nav-item-icon:not(.custom-icon)",
		);
		if (nativeIcon) return; // 如果是原生图标，不做修改

		// 查找或创建自定义图标容器
		let iconContainer = navItemEl.querySelector(
			".vertical-tab-nav-item-icon.custom-icon",
		) as HTMLElement;

		if (!iconContainer) {
			// 如果不存在自定义图标容器，创建一个
			iconContainer = navItemEl.createDiv({
				cls: ["vertical-tab-nav-item-icon", "custom-icon"],
			});

			const firstChild = navItemEl.children[0];
			if (firstChild) {
				navItemEl.insertBefore(iconContainer, firstChild);
			} else {
				navItemEl.appendChild(iconContainer);
			}
		} else {
			// 检查图标是否需要更新（通过数据属性）
			const currentType = iconContainer.getAttribute("data-icon-type");
			const currentIcon = iconContainer.getAttribute("data-icon-name");

			if (
				currentType === communityPlugin.type &&
				currentIcon === communityPlugin.icon
			) {
				return; // 图标没有变化，跳过更新
			}
		}

		// 更新图标（无论是新创建的还是已存在但需要更新的）
		setIcon(iconContainer, communityPlugin.type, communityPlugin.icon);

		// 保存图标信息到数据属性
		iconContainer.setAttribute("data-icon-type", communityPlugin.type);
		iconContainer.setAttribute("data-icon-name", communityPlugin.icon);
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
			".vertical-tab-nav-item-icon.custom-icon",
		);

		customIcons.forEach((icon) => icon.remove());
	}
}
