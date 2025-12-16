import { getLucideIconNames } from "@src/util/getLucideIcons";
import setIcon from "@src/util/setIcon";
import { App, FuzzyMatch, FuzzySuggestModal } from "obsidian";
import * as React from "react";
import "./IconPicker.css";

interface IconPickerProps {
	app: App;
	value: string;
	onChange: (value: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({
	app,
	value,
	onChange,
}) => {
	const [selectedIcon, setSelectedIcon] = React.useState<string>(value);
	const buttonRef = React.useRef<HTMLDivElement>(null);

	const handleClick = () => {
		const modal = new IconSelector(app, (icon) => {
			setSelectedIcon(icon);
			onChange(icon);
		});
		modal.open();
	};

	React.useEffect(() => {
		if (buttonRef.current) {
			setIcon(buttonRef.current, "lucide", selectedIcon);
		}
	}, [selectedIcon]);

	// 监听外部 value 变化，同步更新 selectedIcon 状态
	React.useEffect(() => {
		setSelectedIcon(value);
	}, [value]);

	return (
		<div
			className="CI__icon-picker"
			ref={buttonRef}
			onClick={handleClick}
		></div>
	);
};

class IconSelector extends FuzzySuggestModal<string> {
	private callback: (icon: string) => void;

	constructor(app: App, callback: (icon: string) => void) {
		super(app);
		this.callback = callback;
		this.setInstructions([
			{ command: "↑↓", purpose: "Navigate" },
			{ command: "↵", purpose: "Select" },
			{ command: "esc", purpose: "Dismiss" },
		]);
	}

	getItems(): string[] {
		const icons = getLucideIconNames();
		return icons;
	}

	getItemText(icon: string): string {
		return icon;
	}

	renderSuggestion(item: FuzzyMatch<string>, el: HTMLElement) {
		el.addClass("CI__icon-suggestion");

		// 将图标作为子元素追加，而不是替换整个元素内容
		setIcon(el, "lucide", item.item, { append: true });

		// 创建文本容器（与图标 SVG 同级）
		el.createSpan({ text: item.item });
	}

	onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void {
		this.callback(item);
	}
}
