import { Plugin } from "obsidian";
import { PluginSettingTab } from "./settings/PluginSettingTab";
import SettingsStore from "./settings/SettingsStore";
import { DEFAULT_SETTINGS, IPluginSettings } from "./types/types";
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

			const communityPlugin =
				this.settings.communityPlugins[pluginId] ||
				DEFAULT_SETTINGS.communityPlugins.default;

			addIconToPluginNavItem(navItemEl, communityPlugin);
		});
	}
}
