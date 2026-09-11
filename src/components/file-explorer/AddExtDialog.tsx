import { GroupInput } from "@src/components/icon-library/GroupInput";
import { IconPickerModal } from "@src/components/icon-picker/IconPickerModal";
import { LL } from "@src/i18n/i18n";
import type CIPlugin from "@src/main";
import { IconType } from "@src/types/types";
import { normalizeIconColor } from "@src/util/communityPluginIcon";
import {
	isValidExtensionKey,
	normalizeExtensionKey,
} from "@src/util/fileExplorerIcon";
import { normalizeGroupName } from "@src/util/groupName";
import setIcon from "@src/util/setIcon";
import { ColorComponent } from "obsidian";
import { useEffect, useRef, useState } from "react";

/** 一次提交的内容：FileExplorer 拿到后一次整 map 写入 */
export interface AddExtPayload {
	/** 合法扩展名键（不含非法 token——提交前已被拦下） */
	exts: string[];
	/** 归一化后的分组名（"" = 不动分组） */
	group: string;
	icon: string;
	type: IconType;
	color: string;
}

interface AddExtDialogProps {
	/** 开图标选择器要用（弹窗内容不在 SettingsStoreContext 里，不能走 hook） */
	plugin: CIPlugin;
	/** 已存在的组名（datalist 候选 + 并入提醒） */
	groups: string[];
	/** vault 里未配置的常规扩展名（按文件数降序） */
	candidates: Array<{ ext: string; count: number }>;
	/** 内置复合后缀候选（尚未配置的，见 BUILTIN_COMPOUND_EXTS；不从 vault 解析） */
	compoundCandidates: Array<{ ext: string; count: number }>;
	/** 某个扩展名是否已有规则（芯片上标「将更新」） */
	isConfigured: (ext: string) => boolean;
	onSubmit: (payload: AddExtPayload) => Promise<void>;
	/** 每次渲染登记最新闭包，供 ConfirmDialog 的 onConfirm 调用 */
	onReady?: (submit: () => Promise<boolean>) => void;
}

/** 已敲定的 token：合法键，或原样保留待用户处理的非法片段 */
interface TokenChip {
	key: string;
	invalid?: boolean;
}

/**
 * 「添加扩展名规则」弹窗内容：token 芯片 + 候选 + 分组 + 图标颜色。
 *
 * 替代原先挤在一行的添加表单。三个输入习惯都在这里兑现：
 * - 粘贴 / 敲一段「png jpg jpeg」，分隔符一出现就落成芯片（批量不是隐藏知识），
 *   复合后缀（excalidraw.md 或任何自定义的）直接敲进去即可；
 * - 点候选芯片：常规的来自 vault 统计，复合的只有内置清单（见 BUILTIN_COMPOUND_EXTS）
 *   ——其他复合后缀不替用户决定是否需要，只允许手动创建；
 * - 分组带 datalist（既能选已有又能新建，与「移到分组」同一套 `GroupInput`）。
 *
 * 提交语义（hint 里有说）：已存在的扩展名**不会被拒**，而是更新——图标 / 颜色
 * 只在选了时覆盖，分组只在填了时应用。悄悄把已有条目改成空图标、或把已归组的
 * 条目移出组，都比「少更新一个字段」糟糕得多。
 */
export const AddExtDialog: React.FC<AddExtDialogProps> = ({
	plugin,
	groups,
	candidates,
	compoundCandidates,
	isConfigured,
	onSubmit,
	onReady,
}) => {
	const extLL = LL.settings.fileExplorer.extensions;
	const dlg = extLL.addDialog;
	const groupLL = LL.settings.fileExplorer.extGroup;

	const [input, setInput] = useState("");
	const [chips, setChips] = useState<TokenChip[]>([]);
	const [group, setGroup] = useState("");
	const [selectedIcon, setSelectedIcon] = useState("");
	const [selectedType, setSelectedType] = useState<IconType>("lucide");
	const [color, setColor] = useState("");
	const [error, setError] = useState<string | null>(null);

	// 图标预览按钮：与 IconPicker 同一做法，但 plugin 经 props 传入——弹窗内容
	// 不在 SettingsStoreContext 里，用不了 useSettingsStore
	const iconRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (iconRef.current) {
			setIcon(iconRef.current, selectedType, selectedIcon, {
				color: color || undefined,
			});
		}
	}, [selectedIcon, selectedType, color]);

	// 颜色：ColorComponent 绑到一个 div 上（这里没有 Setting 槽位，用不了封装的
	// Color 控件）。拖动期间 onChange 连发没关系——只是 setState，写盘在提交时
	const colorHostRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const host = colorHostRef.current;
		if (!host) {
			return;
		}
		const component = new ColorComponent(host).onChange((value) => {
			setColor(value);
		});
		return () => {
			component.colorPickerEl?.remove();
		};
	}, []);

	/** 一段原始输入 → 芯片（合法键，或原样保留的非法片段），不去重 */
	const tokenize = (raw: string): TokenChip[] => {
		const out: TokenChip[] = [];
		for (const token of raw.split(/[,\s]+/).filter(Boolean)) {
			const key = normalizeExtensionKey(token);
			out.push(
				isValidExtensionKey(key)
					? { key }
					: { key: token, invalid: true },
			);
		}
		return out;
	};

	const addTokens = (raw: string) => {
		setChips((prev) => {
			const next = [...prev];
			for (const chip of tokenize(raw)) {
				// 去重按芯片键（非法片段按原文，合法键按归一化后）：`.png` 与
				// `png` 是同一条规则
				if (next.some((existing) => existing.key === chip.key)) {
					continue;
				}
				next.push(chip);
			}
			return next;
		});
		setError(null);
	};

	const removeChip = (index: number) => {
		setChips((prev) => prev.filter((_, i) => i !== index));
		setError(null);
	};

	const toggleCandidate = (ext: string) => {
		if (chips.some((chip) => chip.key === ext && !chip.invalid)) {
			setChips((prev) => prev.filter((chip) => chip.key !== ext));
		} else {
			setChips((prev) => [...prev, { key: ext }]);
		}
		setError(null);
	};

	// 输入框的值变化：完整的 token（后面已出现分隔符）即时落芯片，末段留续打
	const handleInput = (value: string) => {
		const parts = value.split(/[,\s]+/);
		const partial = parts[parts.length - 1] ?? "";
		const complete = parts.slice(0, -1).filter(Boolean);
		if (complete.length > 0) {
			addTokens(complete.join(" "));
		}
		setInput(partial);
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			event.preventDefault();
			if (input.trim()) {
				addTokens(input);
				setInput("");
			}
		} else if (event.key === "Backspace" && !input && chips.length > 0) {
			event.preventDefault();
			removeChip(chips.length - 1);
		}
	};

	const targetGroup = normalizeGroupName(group);
	const merging = targetGroup !== "" && groups.includes(targetGroup);

	// 每次渲染都重新登记，保证 ConfirmDialog 拿到的是最新闭包
	useEffect(() => {
		onReady?.(async () => {
			// 提交前把还在输入框里的末段一并收进来：点「保存」不该静默丢掉
			// 还没敲分隔符 / 回车的内容。收进来之后走同一条校验（非法则拦下）
			const all = [
				...chips,
				...tokenize(input).filter(
					(chip) =>
						!chips.some((existing) => existing.key === chip.key),
				),
			];
			const invalid = all.filter((chip) => chip.invalid);
			if (invalid.length > 0) {
				setChips(all);
				setInput("");
				setError(
					dlg.errorInvalid({
						tokens: invalid.map((chip) => chip.key).join(" "),
					}),
				);
				return false;
			}
			if (all.length === 0) {
				setError(dlg.errorEmpty());
				return false;
			}
			await onSubmit({
				exts: all.map((chip) => chip.key),
				group: targetGroup,
				icon: selectedIcon,
				type: selectedType,
				color: normalizeIconColor(color) ?? "",
			});
			return true;
		});
	});

	const renderCandidates = (
		list: Array<{ ext: string; count: number }>,
		compound: boolean,
	) => (
		<div className="ci-fe__chips">
			{list.map(({ ext, count }) => (
				<button
					key={ext}
					className="ci-fe__chip"
					aria-label={extLL.candidateTooltip({ ext, count })}
					onClick={() => toggleCandidate(ext)}
				>
					.{ext}
					{compound && (
						<span className="ci-fe__chip-badge">
							{extLL.compoundBadge()}
						</span>
					)}
					{/* 内置复合候选库中没有同后缀文件时计 0，不显数 */}
					{count > 0 && (
						<span className="ci-fe__chip-count">{count}</span>
					)}
				</button>
			))}
		</div>
	);

	return (
		<div className="ci-lib__form">
			<span className="ci-lib__form-hint">{dlg.hint()}</span>

			{/* token 输入：已敲定的芯片 + 续打的输入框同框，粘贴多段即时成芯片 */}
			<div className="ci-fe__tokens">
				{chips.map((chip, index) => {
					const exists = !chip.invalid && isConfigured(chip.key);
					return (
						<span
							key={chip.key}
							className={
								chip.invalid
									? "ci-fe__token ci-fe__token--invalid"
									: exists
										? "ci-fe__token ci-fe__token--exists"
										: "ci-fe__token"
							}
							title={
								chip.invalid
									? dlg.chipInvalid()
									: exists
										? dlg.chipExists()
										: undefined
							}
						>
							.{chip.key}
							<button
								className="ci-fe__token-remove clickable-icon"
								aria-label={LL.common.delete()}
								onClick={() => removeChip(index)}
							>
								×
							</button>
						</span>
					);
				})}
				<input
					type="text"
					value={input}
					placeholder={chips.length === 0 ? dlg.placeholder() : ""}
					onChange={(e) => handleInput(e.target.value)}
					onKeyDown={handleKeyDown}
				/>
			</div>
			{error && <div className="ci-lib__form-error">{error}</div>}

			{candidates.length > 0 && (
				<>
					<span className="ci-lib__form-hint">
						{extLL.candidates()}
					</span>
					{renderCandidates(candidates, false)}
				</>
			)}
			{compoundCandidates.length > 0 && (
				<>
					<span className="ci-lib__form-hint">
						{extLL.candidatesCompound()}
					</span>
					{renderCandidates(compoundCandidates, true)}
				</>
			)}

			<GroupInput
				groups={groups}
				value={group}
				onChange={setGroup}
				label={groupLL.label()}
				placeholder={groupLL.placeholder()}
				hint={dlg.groupHint()}
			/>
			{merging && (
				<div className="ci-lib__form-warning">
					{groupLL.mergeWarning({ group: targetGroup })}
				</div>
			)}

			<div className="ci-fe__add-pickers">
				<span className="ci-lib__form-label">{dlg.iconLabel()}</span>
				<div
					className="ci-icon-picker"
					ref={iconRef}
					onClick={() => {
						new IconPickerModal(
							plugin,
							{
								value: selectedIcon,
								type: selectedType,
								color: color || undefined,
								onChange: (value, iconType) => {
									setSelectedIcon(value);
									setSelectedType(iconType);
								},
							},
							{ sourceEl: iconRef.current ?? undefined },
						).open();
					}}
				></div>
				<span className="ci-lib__form-label">{dlg.colorLabel()}</span>
				<div ref={colorHostRef} className="ci-fe__color-host" />
				{color && (
					<button
						className="ci-fe__color-reset"
						onClick={() => setColor("")}
					>
						{dlg.colorReset()}
					</button>
				)}
			</div>
		</div>
	);
};
