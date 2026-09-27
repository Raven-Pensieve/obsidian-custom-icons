import {
	SettingContext,
	SettingSlotContext,
} from "@src/context/SettingContext";
import { useSettingContainer } from "@src/hooks/useSettingContext";
import { Setting } from "obsidian";
import {
	FC,
	ReactNode,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
} from "react";
import { createPortal } from "react-dom";

export interface SettingItemProps {
	/**
	 * Setting name/title
	 */
	name?: ReactNode;

	/**
	 * Setting description
	 */
	desc?: ReactNode;

	/**
	 * Info slot content (appears before name)
	 */
	info?: ReactNode;

	/**
	 * Control elements (buttons, toggles, etc.)
	 */
	control?: ReactNode;

	/**
	 * Additional children rendered in the main setting element
	 */
	children?: ReactNode;

	/**
	 * CSS class names
	 */
	className?: string;

	/**
	 * Whether this is a heading
	 */
	heading?: boolean;

	/**
	 * Whether the setting is disabled
	 */
	disabled?: boolean;

	/**
	 * Whether the setting is visible
	 */
	visible?: boolean;

	/**
	 * Tooltip text or config
	 */
	tooltip?:
		| string
		| {
				text: string;
				options?: {
					placement?: "top" | "bottom" | "left" | "right";
					delay?: number;
				};
		  };

	/**
	 * Manual container element (overrides context)
	 */
	containerEl?: HTMLElement;
}

/**
 * SettingItem - A declarative wrapper for Obsidian's Setting class
 *
 * @example
 * ```tsx
 * <SettingItem
 *   name="My Setting"
 *   desc="This is a description"
 *   control={<Button onClick={() => {}}>Click</Button>}
 * />
 * ```
 */
export const SettingItem: FC<SettingItemProps> = ({
	name,
	desc,
	info,
	control,
	children,
	className,
	heading = false,
	disabled = false,
	visible = true,
	tooltip,
	containerEl: providedContainer,
}) => {
	const contextContainer = useSettingContainer();
	const containerEl = providedContainer ?? contextContainer;

	if (!containerEl) {
		throw new Error(
			"SettingItem must have a containerEl (either from context or props)",
		);
	}

	/*
	 * Setting 的创建放在 effect 生命周期而非渲染期（useMemo）：渲染期创建在
	 * React 18 StrictMode（dev 构建）下不可重入——双渲染会留下一个无人认领
	 * 的空壳行，模拟卸载的 cleanup 又把正式实例摘掉，页面只剩
	 * setting-item-name 空骨架（生产构建 StrictMode 为 no-op，仅 dev 可见）。
	 * 不套 useImperativeComponent 是因为 setHeading 要与创建同拍处理。
	 */
	const [setting, setSetting] = useState<Setting | null>(null);

	useLayoutEffect(() => {
		const instance = new Setting(containerEl);
		if (heading) {
			instance.setHeading();
		}
		setSetting(instance);
		return () => {
			/*
			 * 只能整体摘除，绝不能 setting.clear()：clear() 会把
			 * nameEl / descEl / controlEl 清空，而这些槽位正是下方
			 * createPortal 的挂载点——槽位先被清空后，React 删除子树时
			 * 对已不在容器里的节点执行 removeChild，直接抛 NotFoundError
			 * （切换页签卸载面板、关闭设置时触发）。
			 * settingEl.remove() 连同子树完整摘除即可：React 对已脱离
			 * 文档但父子关系完好的容器 removeChild 仍能成功。
			 */
			instance.settingEl.remove();
		};
	}, [containerEl, heading]);

	// Apply basic settings (合并多个相关的设置以减少 DOM 操作)
	useEffect(() => {
		if (!setting) return;
		/*
		 * 字符串的 name / desc 必须**也能被清空**。
		 *
		 * 过去这里写的是 `if (name && typeof name === "string")`，于是值从
		 * 「某段文字」变成 `undefined` / `""` 时根本不调 `setName`，旧文字留在
		 * DOM 里。行状态会变的地方就会踩到：例如书签的行在配好图标之后
		 * 「先选图标，颜色才有作用」本该消失，却会永远挂着。
		 *
		 * ReactNode 形式的 name / desc 走 portal（见下方），不归这里管，
		 * 所以只在「不是 ReactNode」时接管文本。
		 */
		if (typeof name === "string" || name === undefined || name === null) {
			setting.setName(name ?? "");
		}
		if (typeof desc === "string" || desc === undefined || desc === null) {
			setting.setDesc(desc ?? "");
		}

		// Apply disabled state
		setting.setDisabled(disabled);

		// Apply visibility
		setting.setVisibility(visible);

		// Apply tooltip
		if (tooltip) {
			if (typeof tooltip === "string") {
				setting.setTooltip(tooltip);
			} else {
				setting.setTooltip(tooltip.text, tooltip.options);
			}
		}
	}, [setting, name, desc, disabled, visible, tooltip]);

	// Apply className (需要单独处理，因为需要清理)
	useEffect(() => {
		if (!setting || !className) return;

		const classes = className.split(/\s+/).filter(Boolean);
		classes.forEach((cls) => {
			setting.setClass(cls);
		});

		// 清理函数：在 className 变化或组件卸载时移除旧的类
		return () => {
			classes.forEach((cls) => setting.settingEl.classList.remove(cls));
		};
	}, [setting, className]);

	// Create slot contexts
	const slots = useMemo(
		() =>
			setting && {
				info: { setting, slotEl: setting.infoEl },
				name: { setting, slotEl: setting.nameEl },
				desc: { setting, slotEl: setting.descEl },
				control: { setting, slotEl: setting.controlEl },
				main: { setting, slotEl: setting.settingEl },
			},
		[setting],
	);

	if (!setting || !slots) {
		return null;
	}

	return (
		<SettingContext.Provider value={setting}>
			{/* Main setting element */}
			<SettingSlotContext.Provider value={slots.main}>
				{children && createPortal(children, slots.main.slotEl)}
			</SettingSlotContext.Provider>

			{/* Info slot */}
			{info && (
				<SettingSlotContext.Provider value={slots.info}>
					{createPortal(info, slots.info.slotEl)}
				</SettingSlotContext.Provider>
			)}

			{/* Name slot */}
			{name && typeof name !== "string" && (
				<SettingSlotContext.Provider value={slots.name}>
					{createPortal(name, slots.name.slotEl)}
				</SettingSlotContext.Provider>
			)}

			{/* Desc slot */}
			{desc && typeof desc !== "string" && (
				<SettingSlotContext.Provider value={slots.desc}>
					{createPortal(desc, slots.desc.slotEl)}
				</SettingSlotContext.Provider>
			)}

			{/* Control slot */}
			{control && (
				<SettingSlotContext.Provider value={slots.control}>
					{createPortal(control, slots.control.slotEl)}
				</SettingSlotContext.Provider>
			)}
		</SettingContext.Provider>
	);
};
