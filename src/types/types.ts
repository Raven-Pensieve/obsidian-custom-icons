export interface IPluginSettings {
	communityPlugins: {
		enable: boolean;
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
		enable: false,
		default: { id: "", icon: "puzzle", type: "lucide" },
		data: {},
	},
};
