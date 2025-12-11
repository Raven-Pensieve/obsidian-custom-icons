export interface IPluginSettings {
	communityPlugins: {
		[pluginId: string]: ICommunityPluginIcon;
	};
}

export interface ICommunityPluginIcon extends IIcon {}
export const COMMUNITY_PLUGIN_ICON_DEFAULT: ICommunityPluginIcon = {
	id: "",
	icon: "code",
	type: "lucide",
};

export type IconType = "lucide";

interface IIcon {
	id: string;
	icon: string;
	type: IconType;
}

export const DEFAULT_SETTINGS: IPluginSettings = {
	communityPlugins: {},
};
