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
		this.addIconsToCommunityPlugin();
	}

	private addIconsToCommunityPlugin() {
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
}
