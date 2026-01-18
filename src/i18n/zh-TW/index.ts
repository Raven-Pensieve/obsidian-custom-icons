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
				dicesTooltip: "隨機",
			},
			search: {
				placeholder: "輸入外掛程式名稱或ID...",
				noneFound: "未找到符合條件的外掛程式",
				resetTooltip: "重置所有為預設圖示",
				dicesTooltip: "隨機所有圖示",
			},
			pluginList: {
				name: "外掛程式列表",
				desc: "為沒有圖示的第三方外掛程式添加自訂圖示（修復 Obsidian v1.11.0）",
				resetTooltip: "重置爲預設圖示",
				dicesTooltip: "隨機圖示",
			},
		},
	},
	view: {
		CustomIconLib: {
			name: "自訂圖示庫",
			command: "打開自訂圖示庫",
			add: "添加",
			delete: "刪除",
			cancel: "取消",
			searchPlaceholder: "搜索圖示...",
			svg: {
				tabName: "SVG",
				addForm: {
					idPlaceholder: "圖示ID (例如: my-icon)",
					contentPlaceholder: "SVG 內容 (<svg>...</svg>)",
				},
				addModal: {
					title: "添加 SVG 圖示",
					pasteMode: "粘貼源碼",
					uploadMode: "上傳檔案",
					selectFiles: "選擇 SVG 檔案",
					selectFilesDesc: "可以選擇多個 SVG 檔案進行批量添加，將使用檔案名作為圖示 ID。",
					selectedFiles: "已選擇 {count:number} 個檔案",
				},
			},
		},
	},
} satisfies BaseTranslation;

export default zh_TW;
