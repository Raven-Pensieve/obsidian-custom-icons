import { ICommunityPluginIcon } from "@src/types/types";
import setIcon from "./setIcon";

export default function (
	navItemEl: HTMLElement,
	communityPlugin: ICommunityPluginIcon
) {
	// 检查是否存在原生图标（没有 custom-icon 类的）
	const nativeIcon = navItemEl.querySelector(
		".vertical-tab-nav-item-icon:not(.custom-icon)"
	);
	if (nativeIcon) return; // 如果是原生图标，不做修改

	// 查找或创建自定义图标容器
	let iconContainer = navItemEl.querySelector(
		".vertical-tab-nav-item-icon.custom-icon"
	) as HTMLElement;

	if (!iconContainer) {
		// 如果不存在自定义图标容器，创建一个
		iconContainer = navItemEl.createDiv({
			cls: ["vertical-tab-nav-item-icon", "custom-icon"],
		});

		const firstChild = navItemEl.children[0];
		if (firstChild) {
			navItemEl.insertBefore(iconContainer, firstChild);
		} else {
			navItemEl.appendChild(iconContainer);
		}
	}

	// 更新图标（无论是新创建的还是已存在的）
	setIcon(iconContainer, communityPlugin.type, communityPlugin.icon);
}
