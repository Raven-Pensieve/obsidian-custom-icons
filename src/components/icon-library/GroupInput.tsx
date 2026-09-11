import { LL } from "@src/i18n/i18n";
import { GROUP_NAME_MAX } from "@src/util/svgGroups";
import { useEffect, useId, useRef, useState } from "react";

interface GroupInputProps {
	/** 已存在的组名，作为候选 */
	groups: string[];
	value: string;
	onChange: (next: string) => void;
	/** 输入框下方的说明（添加与导入的语义不同，由调用方给） */
	hint?: string;
	/**
	 * 字段名与占位符（省略则用 SVG 库那一套文案）。
	 *
	 * 文件浏览器的扩展名分组是同构的另一处调用方，只有这两句文案不同——
	 * 与其复制一份组件，不如把它们开成参数：候选、大小写敏感、
	 * 「既能选已有又能新建」这些正是两处都要的东西。
	 */
	label?: string;
	placeholder?: string;
}

/**
 * 组名输入：可选已有分组，也可直接敲一个新名字。
 *
 * 候选是**自绘的 listbox**而不是原生 `<datalist>`：后者下拉面板由 Electron
 * 原生渲染，样式完全够不着——弹窗里那行白条候选与本页观感割裂，且没法做
 * 键盘高亮与命中加亮。自绘要自己接的也只有三件事：方向键移动高亮、Enter
 * 选中、失焦收起（候选条目用 `mousedown` 而不是 `click`，抢在失焦之前）。
 *
 * 候选的意义不只是省打字：组名**区分大小写**（`Weather` 与 `weather` 是两个组），
 * 把已有组名摆在眼前是避免手滑造出近似组的主要手段。过滤大小写不敏感只是为了
 * 找得方便，选中回填的仍是原有组名本身。
 */
export const GroupInput: React.FC<GroupInputProps> = ({
	groups,
	value,
	onChange,
	hint,
	label,
	placeholder,
}) => {
	const groupLL = LL.view.CustomIconLib.svg.group;
	const listId = useId();
	const listRef = useRef<HTMLUListElement>(null);
	const [open, setOpen] = useState(false);
	const [highlight, setHighlight] = useState(0);

	const query = value.trim().toLowerCase();
	const filtered = query
		? groups.filter((name) => name.toLowerCase().includes(query))
		: groups;
	// 输入变化后高亮可能越界：派生值兜底，不必单独同步 state
	const active = Math.max(Math.min(highlight, filtered.length - 1), 0);
	const showList = open && groups.length > 0 && filtered.length > 0;

	useEffect(() => {
		if (!showList || !listRef.current) {
			return;
		}
		// 键盘走位时把高亮项滚进可视区（block: nearest 不扰动面板位置）
		listRef.current
			.querySelector(".is-active")
			?.scrollIntoView({ block: "nearest" });
	}, [showList, active]);

	const pick = (name: string) => {
		onChange(name);
		setOpen(false);
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "ArrowDown") {
			if (filtered.length > 0) {
				event.preventDefault();
				setOpen(true);
				setHighlight((prev) => Math.min(prev + 1, filtered.length - 1));
			}
		} else if (event.key === "ArrowUp") {
			if (showList) {
				event.preventDefault();
				setHighlight((prev) => Math.max(prev - 1, 0));
			}
		} else if (event.key === "Enter") {
			// 面板开着才吃掉 Enter（选中高亮项）；否则放行，交给外层
			if (showList) {
				event.preventDefault();
				pick(filtered[active]);
			}
		} else if (event.key === "Escape" && showList) {
			// 先收面板：不让这一下 Escape 顺带关掉整个弹窗
			event.preventDefault();
			event.stopPropagation();
			setOpen(false);
		}
	};

	/** 命中的子串加亮，让「这条候选为什么出现」一眼可见 */
	const renderName = (name: string) => {
		if (!query) {
			return name;
		}
		const index = name.toLowerCase().indexOf(query);
		if (index < 0) {
			return name;
		}
		return (
			<>
				{name.slice(0, index)}
				<span className="ci-group-input__option-hit">
					{name.slice(index, index + query.length)}
				</span>
				{name.slice(index + query.length)}
			</>
		);
	};

	// 标签与输入框同一行，说明另起一行：`.ci-lib__form-row` 是居中的横向 flex，
	// 说明塞进去会挤在输入框右侧。调用方都把本组件放在纵向的 `.ci-lib__form` 里，
	// 所以返回 fragment 即可让说明成为它的下一个 flex item
	return (
		<>
			<div className="ci-lib__form-row ci-lib__form-row--field">
				<span className="ci-lib__form-label">
					{label ?? groupLL.label()}
				</span>
				<div className="ci-group-input">
					<input
						className="ci-lib__form__input"
						type="text"
						role="combobox"
						aria-expanded={showList}
						aria-controls={showList ? listId : undefined}
						aria-activedescendant={
							showList ? `${listId}-opt-${active}` : undefined
						}
						autoComplete="off"
						maxLength={GROUP_NAME_MAX}
						placeholder={placeholder ?? groupLL.placeholder()}
						value={value}
						onChange={(e) => {
							onChange(e.target.value);
							setOpen(true);
							setHighlight(0);
						}}
						onFocus={() => setOpen(true)}
						onBlur={() => setOpen(false)}
						onKeyDown={handleKeyDown}
					/>
					{showList && (
						<ul
							ref={listRef}
							id={listId}
							className="ci-group-input__list"
							role="listbox"
						>
							{filtered.map((name, i) => (
								<li
									key={name}
									id={`${listId}-opt-${i}`}
									role="option"
									aria-selected={i === active}
									className={
										i === active
											? "ci-group-input__option is-active"
											: "ci-group-input__option"
									}
									// mousedown 而不是 click：click 之前输入框会先失焦收起面板
									onMouseDown={(event) => {
										event.preventDefault();
										pick(name);
									}}
									onMouseEnter={() => setHighlight(i)}
								>
									{renderName(name)}
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
			{hint && <span className="ci-lib__form-hint">{hint}</span>}
		</>
	);
};
