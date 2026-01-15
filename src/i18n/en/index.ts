import type { BaseTranslation } from "../i18n-types";

const en = {
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
				resetTooltip: "Reset",
				dicesTooltip: "Random",
			},
			search: {
				placeholder: "Enter plugin name or ID...",
				noneFound: "No matching plugins found",
				resetTooltip: "Reset all to default icon",
				dicesTooltip: "Random all icons",
			},
			pluginList: {
				name: "Plugin list",
				desc: "Add custom icons for community plugins without icons (fix for Obsidian v1.11.0)",
				resetTooltip: "Reset to default icon",
				dicesTooltip: "Random icon",
			},
		},
	},
	view: {
		CustomIconLib: {
			name: "Custom icon library",
			command: "Open custom icon library",
			add: "Add",
			delete: "Delete",
			cancel: "Cancel",
			searchPlaceholder: "Search icon...",
			svg: {
				tabName: "SVG",
				addForm: {
					idPlaceholder: "Icon ID (e.g: my-icon)",
					contentPlaceholder: "SVG content (<svg>...</svg>)",
				},
			},
		},
	},
} satisfies BaseTranslation;

export default en;
