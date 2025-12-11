import { Plugin } from "obsidian";
import { PluginSettingTab } from "./settings/PluginSettingTab";
import SettingsStore from "./settings/SettingsStore";
import { IPluginSettings } from "./types/types";
import addIconToPluginNavItem from "./util/addIconToPluginNavItem";

export default class CIPlugin extends Plugin {
	settings: IPluginSettings;
	readonly settingsStore = new SettingsStore(this);

	async onload() {
		await this.settingsStore.loadSettings();

		this.app.workspace.onLayoutReady(() => {
			this.addIconsToCommunityPlugin();
		});

		this.addSettingTab(new PluginSettingTab(this));
	}

	onunload() {}

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
