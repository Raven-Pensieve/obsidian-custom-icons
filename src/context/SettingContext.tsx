import { Setting } from "obsidian";
import { createContext } from "react";

/**
 * Context for the current Setting instance
 */
export const SettingContext = createContext<Setting | undefined>(undefined);

/**
 * Context for the container element where Settings are rendered
 */
export const SettingContainerContext = createContext<HTMLElement | undefined>(
	undefined,
);

/**
 * Context for accessing specific slots of a Setting
 */
export interface SettingSlotContextValue {
	setting: Setting;
	slotEl: HTMLElement;
}

export const SettingSlotContext = createContext<
	SettingSlotContextValue | undefined
>(undefined);
