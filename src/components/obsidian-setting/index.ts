/**
 * Obsidian Settings v2 - A simplified React wrapper for Obsidian Settings API
 *
 * @example Basic usage
 * ```tsx
 * <SettingContainer>
 *   <SettingItem
 *     name="Enable Feature"
 *     desc="Turn this feature on or off"
 *     control={<Toggle value={enabled} onChange={setEnabled} />}
 *   />
 * </SettingContainer>
 * ```
 *
 * @example With groups
 * ```tsx
 * <SettingContainer>
 *   <SettingGroup title="Appearance" desc="Customize how things look">
 *     <SettingItem
 *       name="Theme"
 *       control={<Dropdown options={{light: "Light", dark: "Dark"}} />}
 *     />
 *     <SettingItem
 *       name="Font Size"
 *       control={<Slider min={10} max={20} value={14} />}
 *     />
 *   </SettingGroup>
 * </SettingContainer>
 * ```
 */

export {
	SettingContainerContext,
	SettingContext,
	SettingSlotContext,
} from "@src/context/SettingContext";
export type { SettingSlotContextValue } from "@src/context/SettingContext";
export {
	useSetting,
	useSettingContainer,
	useSettingSlot,
} from "@src/hooks/useSettingContext";
export {
	Button,
	Color,
	Dropdown,
	ExtraButton,
	MomentFormat,
	ProgressBar,
	Search,
	Slider,
	Text,
	TextArea,
	Toggle,
} from "./Controls";
export type {
	ButtonProps,
	ColorProps,
	DropdownProps,
	ExtraButtonProps,
	MomentFormatProps,
	ProgressBarProps,
	SearchProps,
	SliderProps,
	TextAreaProps,
	TextProps,
	ToggleProps,
} from "./Controls";
export { SettingContainer } from "./SettingContainer";
export type { SettingContainerProps } from "./SettingContainer";
export { SettingGroup } from "./SettingGroup";
export type { SettingGroupProps } from "./SettingGroup";
export { SettingItem } from "./SettingItem";
export type { SettingItemProps } from "./SettingItem";
