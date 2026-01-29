import { SettingsStoreContext } from "@src/context/SettingsStoreContext";
import CIPlugin from "@src/main";
import { PluginSettingTab as ObPluginSettingTab } from "obsidian";
import { StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";
import { Settings } from "./Settings";

export class PluginSettingTab extends ObPluginSettingTab {
	plugin: CIPlugin;
	root: Root;
	icon: string = "image";

	constructor(plugin: CIPlugin) {
		super(plugin.app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		this.root = createRoot(containerEl);
		this.root.render(
			<StrictMode>
				<SettingsStoreContext.Provider
					value={this.plugin.settingsStore}
				>
					<Settings />
				</SettingsStoreContext.Provider>
			</StrictMode>,
		);
	}

	hide() {
		this.root.unmount();
		this.containerEl.empty();
	}
}
