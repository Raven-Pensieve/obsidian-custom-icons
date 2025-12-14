import { useSettingSlot } from "@src/hooks/useSettingContext";
import {
	ButtonComponent,
	ColorComponent,
	DropdownComponent,
	ExtraButtonComponent,
	MomentFormatComponent,
	ProgressBarComponent,
	SearchComponent,
	SliderComponent,
	TextAreaComponent,
	TextComponent,
	ToggleComponent,
} from "obsidian";
import { FC, ReactNode, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

// ============================================================================
// Button Component
// ============================================================================

export interface ButtonProps {
	children?: ReactNode;
	icon?: string;
	className?: string;
	disabled?: boolean;
	cta?: boolean;
	warning?: boolean;
	tooltip?: string | { text: string; options?: any };
	onClick?: (evt: MouseEvent) => void;
}

export const Button: FC<ButtonProps> = ({
	children,
	icon,
	className,
	disabled,
	cta,
	warning,
	tooltip,
	onClick,
}) => {
	const { slotEl } = useSettingSlot();

	const button = useMemo(() => new ButtonComponent(slotEl), [slotEl]);

	useEffect(() => {
		return () => button.buttonEl.remove();
	}, [button]);

	useEffect(() => {
		if (onClick) button.onClick(onClick);
		if (icon) button.setIcon(icon);
		if (typeof children === "string") button.setButtonText(children);
		if (className) button.setClass(className);
		if (disabled !== undefined) button.setDisabled(disabled);
		if (cta) button.setCta();
		if (warning) button.setWarning();
		if (tooltip) {
			const args =
				typeof tooltip === "string"
					? [tooltip, undefined]
					: [tooltip.text, tooltip.options];
			button.setTooltip(args[0], args[1]);
		}
	}, [
		button,
		onClick,
		icon,
		children,
		className,
		disabled,
		cta,
		warning,
		tooltip,
	]);

	return <>{createPortal(children, button.buttonEl)}</>;
};

// ============================================================================
// ExtraButton Component
// ============================================================================

export interface ExtraButtonProps {
	children?: ReactNode;
	icon: string;
	disabled?: boolean;
	tooltip?: string | { text: string; options?: any };
	onClick?: () => void;
}

export const ExtraButton: FC<ExtraButtonProps> = ({
	children,
	icon,
	disabled,
	tooltip,
	onClick,
}) => {
	const { slotEl } = useSettingSlot();

	const button = useMemo(() => new ExtraButtonComponent(slotEl), [slotEl]);

	useEffect(() => {
		return () => button.extraSettingsEl.remove();
	}, [button]);

	useEffect(() => {
		if (onClick) button.onClick(onClick);
		button.setIcon(icon);
		if (disabled !== undefined) button.setDisabled(disabled);
		if (tooltip) {
			const args =
				typeof tooltip === "string"
					? [tooltip, undefined]
					: [tooltip.text, tooltip.options];
			button.setTooltip(args[0], args[1]);
		}
	}, [button, onClick, icon, disabled, tooltip]);

	return <>{createPortal(children, button.extraSettingsEl)}</>;
};

// ============================================================================
// Toggle Component
// ============================================================================

export interface ToggleProps {
	value?: boolean;
	disabled?: boolean;
	tooltip?: string | { text: string; options?: any };
	onChange?: (value: boolean) => void;
}

export const Toggle: FC<ToggleProps> = ({
	value,
	disabled,
	tooltip,
	onChange,
}) => {
	const { slotEl } = useSettingSlot();

	const toggle = useMemo(() => new ToggleComponent(slotEl), [slotEl]);

	useEffect(() => {
		return () => toggle.toggleEl.remove();
	}, [toggle]);

	useEffect(() => {
		if (onChange) toggle.onChange(onChange);
		if (value !== undefined) toggle.setValue(value);
		if (disabled !== undefined) toggle.setDisabled(disabled);
		if (tooltip) {
			const args =
				typeof tooltip === "string"
					? [tooltip, undefined]
					: [tooltip.text, tooltip.options];
			toggle.setTooltip(args[0], args[1]);
		}
	}, [toggle, onChange, value, disabled, tooltip]);

	return null;
};

// ============================================================================
// Text Component
// ============================================================================

export interface TextProps {
	value?: string;
	placeholder?: string;
	readonly?: boolean;
	onChange?: (value: string) => void;
}

export const Text: FC<TextProps> = ({
	value,
	placeholder,
	readonly,
	onChange,
}) => {
	const { slotEl } = useSettingSlot();

	const text = useMemo(() => new TextComponent(slotEl), [slotEl]);

	useEffect(() => {
		return () => text.inputEl.remove();
	}, [text]);

	useEffect(() => {
		if (onChange) text.onChange(onChange);
		text.setValue(value ?? "");
		if (placeholder) text.setPlaceholder(placeholder);
		text.inputEl.readOnly = !!readonly;
	}, [text, onChange, value, placeholder, readonly]);

	return null;
};

// ============================================================================
// TextArea Component
// ============================================================================

export interface TextAreaProps {
	value?: string;
	placeholder?: string;
	disabled?: boolean;
	onChange?: (value: string) => void;
}

export const TextArea: FC<TextAreaProps> = ({
	value,
	placeholder,
	disabled,
	onChange,
}) => {
	const { slotEl } = useSettingSlot();

	const textArea = useMemo(() => new TextAreaComponent(slotEl), [slotEl]);

	useEffect(() => {
		return () => textArea.inputEl.remove();
	}, [textArea]);

	useEffect(() => {
		if (onChange) textArea.onChange(onChange);
		if (value !== undefined) textArea.setValue(value);
		if (placeholder) textArea.setPlaceholder(placeholder);
		if (disabled !== undefined) textArea.setDisabled(disabled);
	}, [textArea, onChange, value, placeholder, disabled]);

	return null;
};

// ============================================================================
// Dropdown Component
// ============================================================================

export interface DropdownProps {
	value?: string;
	options?: Record<string, string>;
	disabled?: boolean;
	onChange?: (value: string) => void;
}

export const Dropdown: FC<DropdownProps> = ({
	value,
	options,
	disabled,
	onChange,
}) => {
	const { slotEl } = useSettingSlot();

	const dropdown = useMemo(() => {
		const d = new DropdownComponent(slotEl);
		if (options) d.addOptions(options);
		return d;
	}, [slotEl, options]);

	useEffect(() => {
		return () => dropdown.selectEl.remove();
	}, [dropdown]);

	useEffect(() => {
		if (onChange) dropdown.onChange(onChange);
		if (value !== undefined) dropdown.setValue(value);
		dropdown.setDisabled(disabled ?? false);
	}, [dropdown, onChange, value, disabled]);

	return null;
};

// ============================================================================
// Slider Component
// ============================================================================

export interface SliderProps {
	value?: number;
	min?: number;
	max?: number;
	step?: number | "any";
	disabled?: boolean;
	dynamicTooltip?: boolean;
	instant?: boolean;
	onChange?: (value: number) => void;
}

export const Slider: FC<SliderProps> = ({
	value,
	min = 0,
	max = 100,
	step = 1,
	disabled,
	dynamicTooltip,
	instant,
	onChange,
}) => {
	const { slotEl } = useSettingSlot();

	const slider = useMemo(() => {
		const s = new SliderComponent(slotEl);
		s.setLimits(min, max, step);
		return s;
	}, [slotEl, min, max, step]);

	useEffect(() => {
		return () => slider.sliderEl.remove();
	}, [slider]);

	useEffect(() => {
		if (onChange) slider.onChange(onChange);
		if (value !== undefined) slider.setValue(value);
		if (disabled !== undefined) slider.setDisabled(disabled);
		if (dynamicTooltip) slider.setDynamicTooltip();
		if (instant !== undefined) slider.setInstant(instant);
	}, [slider, onChange, value, disabled, dynamicTooltip, instant]);

	return null;
};

// ============================================================================
// Color Component
// ============================================================================

export interface ColorProps {
	value?: string;
	disabled?: boolean;
	onChange?: (value: string) => void;
}

export const Color: FC<ColorProps> = ({ value, disabled, onChange }) => {
	const { slotEl } = useSettingSlot();

	const color = useMemo(() => new ColorComponent(slotEl), [slotEl]);

	useEffect(() => {
		return () => color.colorPickerEl?.remove();
	}, [color]);

	useEffect(() => {
		if (onChange) color.onChange(onChange);
		if (value !== undefined) color.setValue(value);
		if (disabled !== undefined) color.setDisabled(disabled);
	}, [color, onChange, value, disabled]);

	return null;
};

// ============================================================================
// Search Component
// ============================================================================

export interface SearchProps {
	value?: string;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	onChange?: (value: string) => void;
}

export const Search: FC<SearchProps> = ({
	value,
	placeholder,
	className,
	disabled,
	onChange,
}) => {
	const { slotEl } = useSettingSlot();

	const search = useMemo(() => new SearchComponent(slotEl), [slotEl]);

	useEffect(() => {
		return () => search.containerEl?.remove();
	}, [search]);

	useEffect(() => {
		if (onChange) search.onChange(onChange);
		if (value !== undefined) search.setValue(value);
		if (placeholder) search.setPlaceholder(placeholder);
		if (disabled !== undefined) search.setDisabled(disabled);
		if (className) search.setClass(className);
	}, [search, onChange, value, placeholder, disabled, className]);

	return null;
};

// ============================================================================
// ProgressBar Component
// ============================================================================

export interface ProgressBarProps {
	value?: number;
	visible?: boolean;
}

export const ProgressBar: FC<ProgressBarProps> = ({
	value,
	visible = true,
}) => {
	const { slotEl } = useSettingSlot();

	const progressBar = useMemo(
		() => new ProgressBarComponent(slotEl),
		[slotEl]
	);

	useEffect(() => {
		return () => progressBar.progressBar?.remove();
	}, [progressBar]);

	useEffect(() => {
		if (value !== undefined) progressBar.setValue(value);
		progressBar.setVisibility(visible);
	}, [progressBar, value, visible]);

	return null;
};

// ============================================================================
// MomentFormat Component
// ============================================================================

export interface MomentFormatProps {
	value?: string;
	placeholder?: string;
	defaultFormat?: string;
	sampleEl?: HTMLElement;
	onChange?: (value: string) => void;
}

export const MomentFormat: FC<MomentFormatProps> = ({
	value,
	placeholder,
	defaultFormat,
	sampleEl,
	onChange,
}) => {
	const { slotEl } = useSettingSlot();

	const momentFormat = useMemo(
		() => new MomentFormatComponent(slotEl),
		[slotEl]
	);

	useEffect(() => {
		return () => momentFormat.inputEl.remove();
	}, [momentFormat]);

	useEffect(() => {
		if (onChange) momentFormat.onChange(onChange);
		if (value !== undefined) momentFormat.setValue(value);
		if (placeholder) momentFormat.setPlaceholder(placeholder);
		if (defaultFormat) momentFormat.setDefaultFormat(defaultFormat);
		if (sampleEl) momentFormat.setSampleEl(sampleEl);
	}, [momentFormat, onChange, value, placeholder, defaultFormat, sampleEl]);

	return null;
};
