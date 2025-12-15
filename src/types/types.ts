export interface IPluginSettings {
	communityPlugins: {
		enable: boolean;
		default: ICommunityPluginIcon;
		data: Record<string, ICommunityPluginIcon>;
	};
	// 扩展示例：侧边栏视图图标
	// sidebarViews: {
	// 	enable: boolean;
	// 	data: Record<string, IViewIcon>;
	// };
	// 扩展示例：文件浏览器图标
	// fileExplorer: {
	// 	enable: boolean;
	// 	folderIcons: Record<string, IFolderIcon>;
	// 	fileIcons: Record<string, IFileIcon>;
	// };
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
