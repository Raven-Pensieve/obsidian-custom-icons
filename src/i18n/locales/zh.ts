import { BaseMessage } from "@src/i18n/types";

const translations: BaseMessage = {
	settings: {
		communityPlugin: {
			name: "第三方插件",
			enable: {
				name: "启用功能",
				desc: "为没有图标的第三方插件设置添加图标",
			},
			default: {
				name: "默认图标",
				desc: "为没有图标的第三方插件设置添加默认图标",
			},
			pluginList: {
				name: "插件列表",
				desc: "为没有图标的第三方插件添加自定义图标（修复 Obsidian v1.11.0）",
			},
		},
	},
};

export default translations;
