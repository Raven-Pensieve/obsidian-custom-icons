import {
	SettingContainerContext,
	SettingContext,
	SettingSlotContext,
} from "@src/context/SettingContext";
import { useContext } from "react";

/**
 * Hook to access the current Setting instance
 */
export function useSetting() {
	const setting = useContext(SettingContext);
	if (!setting) {
		throw new Error("useSetting must be used within a SettingItem");
	}
	return setting;
}

/**
 * Hook to access the Setting container element
 */
export function useSettingContainer() {
	return useContext(SettingContainerContext);
}

/**
 * Hook to access the current Setting slot
 */
export function useSettingSlot() {
	const slot = useContext(SettingSlotContext);
	if (!slot) {
		throw new Error(
			"useSettingSlot must be used within a Setting control component"
		);
	}
	return slot;
}
