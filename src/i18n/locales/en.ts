import { BaseMessage } from "@src/i18n/types";

// Remember [use sentence case in UI](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines#Use+sentence+case+in+UI)
const translations: BaseMessage = {
	settings: {
		communityPlugin: {
			name: "Community Plugins",
			desc: "Add custom icons for community plugins settings.",
			pluginList: {
				name: "Plugin List",
				desc: "Add custom icons for community plugins without icons (Fix for Obsidian v1.11.0)",
			},
		},
	},
};

export default translations;
