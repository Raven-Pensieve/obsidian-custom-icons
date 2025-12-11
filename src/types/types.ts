export interface IPluginSettings {
	communityPlugins: {
		default: ICommunityPluginIcon;
		data: Record<string, ICommunityPluginIcon>;
	};
}

export interface ICommunityPluginIcon extends IIcon {}

export type IconType = "lucide";

interface IIcon {
	id: string;
	icon: string;
	type: IconType;
}

export const DEFAULT_SETTINGS: IPluginSettings = {
	communityPlugins: {
		default: { id: "", icon: "code", type: "lucide" },
		data: {},
	},
};
