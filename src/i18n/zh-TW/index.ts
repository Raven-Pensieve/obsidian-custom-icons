import type { BaseTranslation } from "../i18n-types";

const zh_TW = {
	settings: {
		communityPlugin: {
			name: "第三方外掛程式",
			enable: {
				name: "啟用功能",
				desc: "為沒有圖示的第三方外掛程式設定添加圖示",
			},
			default: {
				name: "預設圖示",
				desc: "為沒有圖示的第三方外掛程式設定添加預設圖示",
				resetTooltip: "重置",
			},
			search: {
				placeholder: "輸入外掛程式名稱或ID...",
				noneFound: "未找到符合條件的外掛程式",
			},
			pluginList: {
				name: "外掛程式列表",
				desc: "為沒有圖示的第三方外掛程式添加自訂圖示（修復 Obsidian v1.11.0）",
				resetTooltip: "重置爲預設圖示",
			},
		},
	},
} satisfies BaseTranslation;

export default zh_TW;
