import { SettingContainerContext } from "@src/context/SettingContext";
import { useSettingContainer } from "@src/hooks/useSettingContext";
import { SettingGroup as ObsidianSettingGroup } from "obsidian";
import { FC, ReactNode, useEffect, useMemo, useState } from "react";

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

	const [settingItemsContainer, setSettingItemsContainer] =
		useState<HTMLElement | null>(null);

	// Create the SettingGroup and extract the correct container for children
	const settingGroupData = useMemo(() => {
		if (!parentContainer) {
			throw new Error(
				"SettingGroup must be used within a SettingContainer or provided a containerEl prop"
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

		// The group element is added to parentContainer
		// Find the setting-group div
		const settingGroupEl = parentContainer.querySelector(
			".setting-group:last-child"
		) as HTMLElement;

		if (!settingGroupEl) {
			throw new Error("Failed to find setting-group element");
		}

		// Find the setting-items container inside it
		const itemsContainer = settingGroupEl.querySelector(
			".setting-items"
		) as HTMLElement;

		if (!itemsContainer) {
			// If setting-items doesn't exist, create it
			// This might happen in older Obsidian versions
			const items = settingGroupEl.createDiv("setting-items");
			return { group, settingGroupEl, itemsContainer: items };
		}

		return { group, settingGroupEl, itemsContainer };
	}, [parentContainer, className, title]);

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
