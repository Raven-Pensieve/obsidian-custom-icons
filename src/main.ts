import { Plugin } from "obsidian";
import { PluginSettingTab } from "./settings/PluginSettingTab";
import SettingsStore from "./settings/SettingsStore";
import { IPluginSettings } from "./types/types";
import IconManager from "./util/IconManager";
import CommunityPluginIconHandler from "./util/handlers/CommunityPluginIconHandler";

export default class CIPlugin extends Plugin {
	settings: IPluginSettings;
	readonly settingsStore = new SettingsStore(this);
	readonly iconManager = new IconManager(this.app);

	async onload() {
		await this.settingsStore.loadSettings();

		// 注册所有图标处理器
		this.registerIconHandlers();

		this.app.workspace.onLayoutReady(() => {
			// 初始化并应用所有图标处理器
			this.iconManager.updateSettings(this.settings);
			this.iconManager.applyAll();
		});

		this.addSettingTab(new PluginSettingTab(this));
	}

	onunload() {
		// 清理所有图标处理器
		this.iconManager.cleanupAll();
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// 更新设置并重新应用所有图标
		this.iconManager.updateSettings(this.settings);
		this.iconManager.applyAll();
	}

	/**
	 * 注册所有图标处理器
	 * 在这里添加新的处理器以扩展功能
	 */
	private registerIconHandlers() {
		// 注册社区插件图标处理器
		this.iconManager.registerHandler(new CommunityPluginIconHandler());

		// 扩展示例：添加更多处理器
		// this.iconManager.registerHandler(new SidebarViewIconHandler());
		// this.iconManager.registerHandler(new FileExplorerIconHandler());
		// this.iconManager.registerHandler(new RibbonIconHandler());
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
