import { IconType } from "@src/types/types";
import { setIcon } from "obsidian";

export default function (el: HTMLElement, iconType: IconType, icon: string) {
	// 目前只支持 obsidian 内置的 lucide (v0.446.0) 图标
	if (iconType === "lucide") {
		setIcon(el, icon);
	}
}
