import { SettingsStoreContext } from "@src/context/SettingsStoreContext";
import { LL } from "@src/i18n/i18n";
import CIPlugin from "@src/main";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { StrictMode } from "react";
import { Root, createRoot } from "react-dom/client";

export const VIEW_TYPE_CUSTOM_ICON_LIB = "custom-icon-lib-view";

export class CustomIconLibView extends ItemView {
	private root: Root;

	constructor(leaf: WorkspaceLeaf, protected plugin: CIPlugin) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_CUSTOM_ICON_LIB;
	}

	getDisplayText(): string {
		return LL.view.CustomIconLib.name();
	}

	getIcon(): string {
		return "library";
	}

	async onOpen() {
		this.root = createRoot(this.contentEl);
		this.root.render(
			<StrictMode>
				<SettingsStoreContext.Provider
					value={this.plugin.settingsStore}
				>
					<></>
				</SettingsStoreContext.Provider>
			</StrictMode>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
