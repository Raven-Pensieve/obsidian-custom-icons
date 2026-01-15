import type { BaseTranslation } from "../i18n-types";

const zh = {
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
				resetTooltip: "重置",
				dicesTooltip: "随机",
			},
			search: {
				placeholder: "输入插件名称...",
				noneFound: "未找到匹配的插件",
				resetTooltip: "重置所有为默认图标",
				dicesTooltip: "随机所有图标",
			},
			pluginList: {
				name: "插件列表",
				desc: "为没有图标的第三方插件添加自定义图标（修复 Obsidian v1.11.0）",
				resetTooltip: "重置为默认图标",
				dicesTooltip: "随机图标",
			},
		},
	},
} satisfies BaseTranslation;

export default zh;
