import { Plugin } from "obsidian";
import { PluginSettingTab } from "./settings/PluginSettingTab";
import SettingsStore from "./settings/SettingsStore";
import { IPluginSettings } from "./types/types";
import addIconToPluginNavItem from "./util/addIconToPluginNavItem";

export default class CIPlugin extends Plugin {
	settings: IPluginSettings;
	readonly settingsStore = new SettingsStore(this);
	private mutationObserver: MutationObserver | null = null;

	async onload() {
		await this.settingsStore.loadSettings();

		this.app.workspace.onLayoutReady(() => {
			this.addIconsToCommunityPlugin();
			this.setupMutationObserver();
		});

		this.addSettingTab(new PluginSettingTab(this));
	}

	onunload() {
		// 清理 MutationObserver
		if (this.mutationObserver) {
			this.mutationObserver.disconnect();
			this.mutationObserver = null;
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
		await this.addIconsToCommunityPlugin();
	}

	private async addIconsToCommunityPlugin() {
		const communityPluginTabContainer =
			this.app.setting.communityPluginTabContainer;

		const pluginNavItems = communityPluginTabContainer.querySelectorAll(
			".vertical-tab-nav-item[data-setting-id]"
		) as NodeListOf<HTMLElement>;

		pluginNavItems.forEach((navItemEl) => {
			const pluginId = navItemEl.getAttribute("data-setting-id");
			if (!pluginId) return;

			// 优先使用插件特定的图标配置，否则使用默认配置
			const communityPlugin =
				this.settings.communityPlugins.data[pluginId] ||
				this.settings.communityPlugins.default;

			addIconToPluginNavItem(navItemEl, communityPlugin);
		});
	}

	private setupMutationObserver() {
		const communityPluginTabContainer =
			this.app.setting.communityPluginTabContainer;

		// 创建 MutationObserver 来监听新添加的插件项
		this.mutationObserver = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				mutation.addedNodes.forEach((node) => {
					// 检查添加的节点是否是插件导航项
					if (
						node instanceof HTMLElement &&
						node.classList.contains("vertical-tab-nav-item") &&
						node.hasAttribute("data-setting-id")
					) {
						const pluginId = node.getAttribute("data-setting-id");
						if (!pluginId) return;

						// 处理新添加的插件项
						const communityPlugin =
							this.settings.communityPlugins.data[pluginId] ||
							this.settings.communityPlugins.default;

						addIconToPluginNavItem(node, communityPlugin);
					}
				});
			});
		});

		// 开始观察社区插件容器的子元素变化
		this.mutationObserver.observe(communityPluginTabContainer, {
			childList: true, // 监听直接子节点的添加/删除
			subtree: true, // 监听所有后代节点
		});
	}

	// private manageLeaf(leaf: WorkspaceLeaf) {
	// 	const leafType = leaf.getViewState().type;
	// 	const leafContainerEl = leaf.view.containerEl;

	// 	switch (leafType) {
	// 		case "markdown":
	// 			break;
	// 		case "empty":
	// 			break;
	// 		case "file-explorer":
	// 			break;
	// 		case "search":
	// 			break;
	// 		case "bookmarks":
	// 			break;
	// 		case "tag":
	// 			break;
	// 		case "outline":
	// 			break;
	// 		case "all-properties":
	// 			break;
	// 		case "file-properties":
	// 			break;
	// 		case "outgoing-link":
	// 			break;
	// 		case "backlink":
	// 			break;
	// 		case "footnotes":
	// 			break;
	// 		default:
	// 			break;
	// 	}
	// }
}
