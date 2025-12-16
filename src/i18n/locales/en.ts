import { BaseMessage } from "@src/i18n/types";

// Remember [use sentence case in UI](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines#Use+sentence+case+in+UI)
const translations: BaseMessage = {
	settings: {
		communityPlugin: {
			name: "Community plugins",
			enable: {
				name: "Enable feature",
				desc: "Add icons for community plugins without icons",
			},
			default: {
				name: "Default icon",
				desc: "Set a default icon for community plugins without icons",
			},
			search: {
				placeholder: "Enter plugin name or ID...",
				noneFound: "No matching plugins found",
			},
			pluginList: {
				name: "Plugin list",
				desc: "Add custom icons for community plugins without icons (fix for Obsidian v1.11.0)",
			},
		},
	},
};

export default translations;
