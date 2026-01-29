import { SettingContainerContext } from "@src/context/SettingContext";
import { useSettingContainer } from "@src/hooks/useSettingContext";
import { SettingGroup as ObsidianSettingGroup } from "obsidian";
import { FC, ReactNode, useEffect, useId, useMemo, useState } from "react";

export interface SettingGroupProps {
	/**
	 * Group title (displayed as a heading)
	 */
	title?: string | DocumentFragment;

	/**
	 * CSS class name
	 */
	className?: string;

	/**
	 * Children components (typically SettingItem components)
	 */
	children: ReactNode;

	/**
	 * Manual container element (overrides context)
	 */
	containerEl?: HTMLElement;
}

/**
 * SettingGroup - Wrapper for Obsidian's SettingGroup class (1.11.0+)
 *
 * Groups multiple related settings with an optional heading.
 * Uses Obsidian's native SettingGroup API which provides better styling and structure.
 *
 * Important: SettingGroup uses `addSetting(callback)` internally, but we provide
 * a React-friendly API where you can use SettingItem components as children.
 *
 * @example
 * ```tsx
 * <SettingGroup title="Appearance">
 *   <SettingItem name="Theme" control={<Dropdown />} />
 *   <SettingItem name="Font Size" control={<Slider />} />
 * </SettingGroup>
 * ```
 */
export const SettingGroup: FC<SettingGroupProps> = ({
	title,
	children,
	containerEl: providedContainer,
	className,
}) => {
	const contextContainer = useSettingContainer();
	const parentContainer = providedContainer ?? contextContainer;

	// 生成唯一 ID 来标识这个 SettingGroup
	const groupId = useId();

	const [settingItemsContainer, setSettingItemsContainer] =
		useState<HTMLElement | null>(null);

	// Create the SettingGroup and extract the correct container for children
	const settingGroupData = useMemo(() => {
		if (!parentContainer) {
			throw new Error(
				"SettingGroup must have a containerEl (either from context or props)",
			);
		}

		// Create the Obsidian SettingGroup directly on the parent container
		const group = new ObsidianSettingGroup(parentContainer);

		if (title) {
			group.setHeading(title);
		}

		if (className) {
			group.addClass(className);
		}

		// Important: SettingGroup creates a structure like:
		// <div class="setting-group">
		//   <div class="setting-item setting-item-heading">...</div>
		//   <div class="setting-items"></div>
		// </div>
		// We need to find the .setting-items container

		// 使用唯一 ID 标记这个 setting-group 以便精确查询
		const settingGroupEl = parentContainer.lastElementChild as HTMLElement;

		if (
			!settingGroupEl ||
			!settingGroupEl.classList.contains("setting-group")
		) {
			throw new Error("Failed to find setting-group element");
		}

		// 添加唯一标识符
		settingGroupEl.setAttribute("data-group-id", groupId);

		// Find the setting-items container inside it
		const itemsContainer = settingGroupEl.querySelector(
			".setting-items",
		) as HTMLElement;

		if (!itemsContainer) {
			// If setting-items doesn't exist, create it
			// This might happen in older Obsidian versions
			const items = settingGroupEl.createDiv("setting-items");
			return { group, settingGroupEl, itemsContainer: items };
		}

		return { group, settingGroupEl, itemsContainer };
	}, [parentContainer, className, title, groupId]);

	useEffect(() => {
		// Set the correct container for children (the .setting-items div)
		setSettingItemsContainer(settingGroupData.itemsContainer);

		return () => {
			// Cleanup: remove the entire setting-group
			settingGroupData.settingGroupEl.remove();
		};
	}, [settingGroupData]);

	if (!settingItemsContainer) {
		return null;
	}

	// Provide the .setting-items container as the context for child SettingItems
	return (
		<SettingContainerContext.Provider value={settingItemsContainer}>
			{children}
		</SettingContainerContext.Provider>
	);
};
