import "@src/components/file-explorer/FileExplorer.css";
import {
	AddExtDialog,
	AddExtPayload,
} from "@src/components/file-explorer/AddExtDialog";
import { MoveExtGroup } from "@src/components/file-explorer/MoveExtGroup";
import { RenameExtGroup } from "@src/components/file-explorer/RenameExtGroup";
import { IconPicker } from "@src/components/icon-picker/IconPicker";
import { ConfirmDialog } from "@src/components/modal/ConfirmDialog";
import {
	Color,
	ExtraButton,
	FeatureOffNotice,
	RandomIconButton,
	SettingGroup,
	SettingItem,
	Toggle,
} from "@src/components/obsidian-setting";
import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import { LL } from "@src/i18n/i18n";
import { IFileExplorerIconOverride } from "@src/types/types";
import { normalizeIconColor } from "@src/util/communityPluginIcon";
import {
	ExtensionMap,
	assignGroup,
	deleteExts,
	deleteGroupWithRules,
	dissolveGroup,
	groupMembers,
	listGroups,
	renameGroup,
	ruleGroup,
	setExtsIcon,
	setGroupColor,
	setGroupIcon,
	ungroupedKeys,
	uniformIcon,
} from "@src/util/extensionGroups";
import {
	splitExtCandidates,
	tallyExtensions,
} from "@src/util/fileExplorerIcon";
import { encodeIconRef, iconRefOf } from "@src/util/iconRef";
import { randomIconsFor } from "@src/util/randomIcon";
import { MoreVertical } from "lucide-react";
import { Menu, Notice } from "obsidian";
import {
	FC,
	Fragment,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

/** 分组收起时，组行上预览几个成员名；其余折成「+N」 */
const MEMBER_PREVIEW_LIMIT = 10;

/** 扩展名列表的排序方式 */
type ExtSort = "count" | "name";

/**
 * 选择模式的复选框。三态用原生 `indeterminate`（半选），它只能经 DOM 属性设置，
 * React 的 `checked` 表达不了。
 */
const SelectCheck: FC<{
	state: boolean | "indeterminate";
	onToggle: () => void;
	label: string;
}> = ({ state, onToggle, label }) => {
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (ref.current) {
			ref.current.indeterminate = state === "indeterminate";
		}
	}, [state]);
	return (
		<input
			ref={ref}
			type="checkbox"
			className="ci-fe__select-check"
			aria-label={label}
			checked={state === true}
			onChange={onToggle}
		/>
	);
};

export const FileExplorer: FC = () => {
	const settingsStore = useSettingsStore();
	const settings = usePluginSettings(settingsStore);
	const fe = settings.fileExplorer;
	const extLL = LL.settings.fileExplorer.extensions;
	const groupLL = LL.settings.fileExplorer.extGroup;

	const [extFilter, setExtFilter] = useState("");
	// 默认按文件数：库里有 200 个 png 和 1 个 xyz 时，前者才是用户来这里要配的东西
	const [extSort, setExtSort] = useState<ExtSort>("count");
	const [overrideFilter, setOverrideFilter] = useState("");

	/**
	 * 选择模式：行首复选框 + 头部操作条（统一设图标 / 移到分组 / 掷骰 / 清空 / 删除）。
	 *
	 * 选中集是**扩展名键的集合**，不随筛选 / 折叠变化而丢失——筛选只是圈定视野，
	 * 不该顺手丢掉用户勾好的东西。退出选择模式时清空。不落盘：这是操作过程的
	 * 中间态，不是配置。
	 */
	const [selectMode, setSelectMode] = useState(false);
	const [selection, setSelection] = useState<Set<string>>(() => new Set());

	/**
	 * 分组的展开 / 收起，**只存用户显式改过的那些**。
	 *
	 * 不落盘：它是 UI 偏好而不是配置，而且落盘就要处理「组被改名 / 删除后残留的
	 * 折叠记录」。用 `Map` 而不是普通对象——组名是用户输入的自由字符串，
	 * `__proto__` 当键会污染对象。
	 *
	 * 没有显式记录的组走默认值：**组内有未配图标的成员就默认展开**（那是还没干完的
	 * 活，藏起来等于藏掉待办），其余默认收起。这样升级上来的用户第一眼就能看到
	 * 需要处理的组，而不是「我的规则都不见了」。
	 */
	const [expandOverride, setExpandOverride] = useState<Map<string, boolean>>(
		() => new Map(),
	);

	/**
	 * 库中各扩展名的文件数，**挂载时统计一次**。
	 *
	 * 不监听 vault 事件重算：设置页开着的这几分钟里文件数变化对「配哪个图标」
	 * 没有影响，而 `getFiles()` 在大库里不便宜。数字用于排序与「库中还没配的
	 * 扩展名」候选，两者都不要求实时。
	 *
	 * 计数同时统计末段与复合后缀（`a.excalidraw.md` 同时计入 `md` 与
	 * `excalidraw.md`），所以列口径是「库中该扩展名的文件数」而非
	 * 「这条规则实际影响的文件数」——后者要模拟整条解析链，代价与收益不成比例。
	 */
	const tally = useMemo(
		() => tallyExtensions(settingsStore.app.vault.getFiles().map((f) => f.path)),
		[settingsStore.app.vault],
	);

	/** 本次渲染看到的 extensions 表（`ExtensionMap` 与它同型，不必断言） */
	const extMap: ExtensionMap = fe.extensions;

	/**
	 * 读**当前落盘**的 extensions 表。
	 *
	 * 弹窗与菜单的回调是稍后才跑的，那时闭包里的 `extMap` 可能已经过期
	 * （另一个窗口改了、或本窗口刚做过一次批量）。凡是「打开弹窗 → 确认」
	 * 这条路径上的写入，一律以这个函数为基准算下一份表。
	 */
	const liveExtMap = useCallback(
		(): ExtensionMap => settingsStore.plugin.settings.fileExplorer.extensions,
		[settingsStore],
	);

	/** 整 map 写入：扩展名/路径键含 "." / "/"，不能拼进按 "." 分割的 updateSettingByPath */
	const writeMap = async (
		mapKey: "extensions" | "folders" | "files",
		key: string,
		next?: IFileExplorerIconOverride,
	) => {
		const nextMap = { ...fe[mapKey] };
		if (next) {
			nextMap[key] = next;
		} else {
			delete nextMap[key];
		}
		await settingsStore.updateSettingByPath(
			`fileExplorer.${mapKey}`,
			nextMap,
		);
	};

	/** 整张 extensions 表一次写入（分组类动作全走这里，N 行改动 = 一次 applyAll） */
	const writeExtensions = async (next: ExtensionMap) => {
		await settingsStore.updateSettingByPath("fileExplorer.extensions", next);
	};

	// ---------------------------------------------------------------- 列表构建

	const groups = useMemo(() => listGroups(extMap), [extMap]);
	const groupNames = useMemo(() => groups.map((g) => g.name), [groups]);

	/** 排序比较器：文件数降序（同数按名），或纯名称序 */
	const compareExt = useCallback(
		(a: string, b: string) => {
			if (extSort === "count") {
				const diff = (tally.get(b) ?? 0) - (tally.get(a) ?? 0);
				if (diff !== 0) {
					return diff;
				}
			}
			return a.localeCompare(b);
		},
		[extSort, tally],
	);

	const filterQuery = extFilter.trim().toLowerCase();

	/** 筛选命中：扩展名或其组名包含查询串（组名也参与，才能一键筛出整组） */
	const matches = useCallback(
		(ext: string) => {
			if (!filterQuery) {
				return true;
			}
			return (
				ext.toLowerCase().includes(filterQuery) ||
				ruleGroup(extMap[ext]).toLowerCase().includes(filterQuery)
			);
		},
		[filterQuery, extMap],
	);

	/** 分组行 + 其命中的成员；组名自身命中时整组保留 */
	const visibleGroups = useMemo(
		() =>
			groups
				.map((group) => {
					const all = groupMembers(extMap, group.name);
					return {
						...group,
						members: all.filter(matches).sort(compareExt),
						files: all.reduce(
							(sum, ext) => sum + (tally.get(ext) ?? 0),
							0,
						),
						// 未配图标的成员数：决定这一组默认是否展开（有活要干就摊开）
						iconless: all.filter((ext) => !extMap[ext]?.icon).length,
						// 是**组名**命中了筛选（而非某个成员名）：组行上要说一句，
						// 否则「我搜 png 怎么冒出来一堆 mp4」无从理解
						nameMatched: Boolean(
							filterQuery &&
								group.name.toLowerCase().includes(filterQuery),
						),
					};
				})
				.filter((group) => group.members.length > 0)
				// 组的顺序跟随同一个排序开关：按文件数时组也按组内文件总数降序。
				// 不为它单开一个控件——收起之后每组只占一行，再多一枚按钮不值得
				.sort((a, b) => {
					if (extSort === "count") {
						const diff = b.files - a.files;
						if (diff !== 0) {
							return diff;
						}
					}
					return a.name.localeCompare(b.name);
				}),
		[groups, extMap, matches, compareExt, tally, filterQuery, extSort],
	);

	const visibleUngrouped = useMemo(
		() => ungroupedKeys(extMap).filter(matches).sort(compareExt),
		[extMap, matches, compareExt],
	);

	/** 批量动作作用于「当前筛选可见的全部扩展名」，与社区插件页的骰子同一口径 */
	const filteredExts = useMemo(
		() => [
			...visibleGroups.flatMap((group) => group.members),
			...visibleUngrouped,
		],
		[visibleGroups, visibleUngrouped],
	);

	/**
	 * 这一组现在是否展开。
	 *
	 * 筛选期一律展开：筛出来了却看不见是最糟的一种「没反应」。此时也不接受收起
	 * ——先清掉筛选词再说。
	 */
	const isExpanded = (group: string, iconless: number): boolean => {
		if (filterQuery) {
			return true;
		}
		return expandOverride.get(group) ?? iconless > 0;
	};

	const setExpanded = (group: string, next: boolean) => {
		setExpandOverride((prev) => {
			const map = new Map(prev);
			map.set(group, next);
			return map;
		});
	};

	/** 全部展开 / 全部收起：给当前所有可见组写显式值，覆盖各自的默认 */
	const setAllExpanded = (next: boolean) => {
		setExpandOverride((prev) => {
			const map = new Map(prev);
			for (const group of visibleGroups) {
				map.set(group.name, next);
			}
			return map;
		});
	};

	/** 有任意一组处于收起状态时，「全部」按钮就该是展开；否则是收起 */
	const anyCollapsed = visibleGroups.some(
		(group) => !isExpanded(group.name, group.iconless),
	);

	/**
	 * 库里有、但还没配规则的扩展名（常规与复合分排，按文件数降序取前若干）。
	 *
	 * 这是本页与其余六张同类列表的关键差别：扩展名是唯一没有天然候选源的自由输入，
	 * 用户得先想起来「我库里都有什么」。把它列出来，输入就从「凭记忆默写」变成
	 * 「点一下」。复合排只放内置的 `excalidraw.md`（见 BUILTIN_COMPOUND_EXTS），
	 * 不从 vault 解析其他复合键——日期命名会产生用户不需要的垃圾键；其余复合
	 * 后缀仍可在添加弹窗手动输入，解析层照常生效。
	 */
	const { regular: candidates, compound: compoundCandidates } = useMemo(
		() => splitExtCandidates(tally, (ext) => Boolean(extMap[ext])),
		[tally, extMap],
	);

	// ---------------------------------------------------------------- 添加规则

	/**
	 * 「添加扩展名规则」弹窗：token 芯片 + vault 候选 + 分组 + 图标颜色。
	 *
	 * 替代原先挤在一行的添加表单——批量（空格 / 逗号分隔）、复合后缀、选已有分组
	 * 这三件事都从「隐藏知识」变成弹窗里摆着的东西。
	 */
	const openAddDialog = useCallback(
		(sourceEl?: HTMLElement) => {
			let submitFn: (() => Promise<boolean>) | null = null;
			new ConfirmDialog(
				settingsStore.plugin,
				{
					title: extLL.addDialog.title(),
					confirmLL: LL.common.save(),
					children: (
						<AddExtDialog
							plugin={settingsStore.plugin}
							groups={groupNames}
							candidates={candidates}
							compoundCandidates={compoundCandidates}
							isConfigured={(ext) => Boolean(liveExtMap()[ext])}
							onSubmit={async (payload: AddExtPayload) => {
								const next: ExtensionMap = { ...liveExtMap() };
								let added = 0;
								let updated = 0;
								for (const ext of payload.exts) {
									const existing = next[ext];
									if (existing) {
										// 已存在 = 更新：图标 / 颜色只在选了时覆盖、
										// 分组只在填了时应用——不悄悄抹掉用户单独
										// 配过的东西，也不把已归组的条目移出组
										next[ext] = {
											...existing,
											...(payload.icon
												? {
														icon: payload.icon,
														type: payload.type,
													}
												: {}),
											...(payload.color
												? { color: payload.color }
												: {}),
											...(payload.group
												? { group: payload.group }
												: {}),
										};
										updated++;
									} else {
										next[ext] = {
											id: ext,
											icon: payload.icon,
											type: payload.type,
											color: payload.color,
											...(payload.group
												? { group: payload.group }
												: {}),
										};
										added++;
									}
								}
								await settingsStore.updateSettingByPath(
									"fileExplorer.extensions",
									next,
								);
								if (added > 0 && updated > 0) {
									new Notice(
										extLL.addDialog.resultMixed({
											added,
											updated,
										}),
									);
								} else if (added > 0) {
									new Notice(extLL.added({ count: added }));
								} else {
									new Notice(
										extLL.addDialog.resultUpdated({
											count: updated,
										}),
									);
								}
							}}
							onReady={(submit) => {
								submitFn = submit;
							}}
						/>
					),
					onConfirm: async () => (submitFn ? await submitFn() : false),
				},
				{ sourceEl },
			).open();
		},
		[
			settingsStore,
			extLL,
			groupNames,
			candidates,
			compoundCandidates,
			liveExtMap,
		],
	);

	/** 点候选芯片：直接建一条空图标规则（要配图标/归组，接着在列表里操作或进弹窗选它） */
	const addCandidate = async (ext: string) => {
		if (extMap[ext]) {
			return;
		}
		await writeExtensions({
			...extMap,
			[ext]: { id: ext, icon: "", type: "lucide", color: "" },
		});
		new Notice(extLL.added({ count: 1 }));
	};

	// ---------------------------------------------------------------- 批量动作

	/**
	 * 给一批扩展名各掷一个图标，**一次落盘**。
	 *
	 * 随机域取自**文件默认图标**（一批同来源）：不按各行自己的来源，否则「尽量互不
	 * 相同」跨池子无意义，各池大小不同、重复策略也难向用户解释。
	 *
	 * 作用域由调用方给出（筛选结果或勾选项），一律以 `liveExtMap()` 为基准——
	 * 操作发起时那张表才是真的。
	 */
	const randomizeExts = async (exts: string[]) => {
		if (exts.length === 0) {
			return;
		}
		const plugin = settingsStore.plugin;
		const map = liveExtMap();
		// 排除各行当前的图标：尽量不把某行掷回原样（排除后无人可选时 sampleMany
		// 自会退回整池，是尽力而为不是硬约束）
		const exclude = new Set<string>();
		for (const ext of exts) {
			const ref = iconRefOf(map[ext]?.icon ?? "", map[ext]?.type ?? "lucide");
			if (ref) {
				exclude.add(encodeIconRef(ref));
			}
		}
		const anchor = iconRefOf(
			plugin.settings.fileExplorer.fileDefault.icon,
			plugin.settings.fileExplorer.fileDefault.type,
		);
		const picked = randomIconsFor(
			plugin,
			anchor,
			exts.length,
			exclude,
		);
		// 池子空（理论上碰不到，Lucide 恒在）：什么都不写，而不是清空一片图标
		if (picked.length === 0) {
			return;
		}
		const next: ExtensionMap = { ...map };
		exts.forEach((ext, index) => {
			const ref = picked[index];
			// sampleMany 在池子非空时恒返回 count 项，这个兜底只为不依赖那个不变式
			if (!ref || !next[ext]) {
				return;
			}
			next[ext] = { ...next[ext], icon: ref.id, type: ref.type };
		});
		await writeExtensions(next);
	};

	/**
	 * 清空一批规则的图标（**保留规则本身**）。
	 *
	 * 要确认：一次动 N 行、没有撤销。与「删除规则」是两件不同的事——清空后这些
	 * 扩展名回落到「文件默认图标」，规则还在，用户随后重配不必重新输入扩展名。
	 */
	const clearExts = (exts: string[]) => {
		if (exts.length === 0) {
			return;
		}
		const count = exts.length;
		new ConfirmDialog(settingsStore.plugin, {
			title: extLL.clearTitle({ count }),
			confirmLL: extLL.clearConfirm(),
			children: (
				<div className="ci-lib__form">
					<span className="ci-lib__form-warning">
						{extLL.clearBody()}
					</span>
				</div>
			),
			onConfirm: async () => {
				// 重新取当前表：弹窗开着的这段时间里可能已经变了
				const next: ExtensionMap = { ...liveExtMap() };
				for (const ext of exts) {
					if (next[ext]) {
						next[ext] = { ...next[ext], icon: "", color: "" };
					}
				}
				await settingsStore.updateSettingByPath(
					"fileExplorer.extensions",
					next,
				);
				new Notice(extLL.cleared({ count }));
			},
		}).open();
	};

	/**
	 * 删除一批规则。选择模式操作条上破坏性最强的动作，确认弹窗标红说清后果：
	 * 这些扩展名回落 `fileDefault`。
	 */
	const deleteExtsWithConfirm = (exts: string[]) => {
		if (exts.length === 0) {
			return;
		}
		const count = exts.length;
		new ConfirmDialog(settingsStore.plugin, {
			title: extLL.select.deleteTitle({ count }),
			confirmLL: extLL.select.deleteConfirm(),
			children: (
				<div className="ci-lib__form">
					<span className="ci-lib__form-warning">
						{extLL.select.deleteBody()}
					</span>
				</div>
			),
			onConfirm: async () => {
				await settingsStore.updateSettingByPath(
					"fileExplorer.extensions",
					deleteExts(liveExtMap(), exts),
				);
				new Notice(extLL.select.deleted({ count }));
				// 选中的规则都没了，选中集一并清掉
				setSelection(new Set());
			},
		}).open();
	};

	// ---------------------------------------------------------------- 选择模式

	const toggleSelected = (ext: string) => {
		setSelection((prev) => {
			const next = new Set(prev);
			if (next.has(ext)) {
				next.delete(ext);
			} else {
				next.add(ext);
			}
			return next;
		});
	};

	/** 组行三态复选框：全选时点 = 清空本组，否则（含半选）= 补齐全组 */
	const toggleGroupSelection = (
		members: readonly string[],
		state: boolean | "indeterminate",
	) => {
		setSelection((prev) => {
			const next = new Set(prev);
			if (state === true) {
				for (const ext of members) {
					next.delete(ext);
				}
			} else {
				for (const ext of members) {
					next.add(ext);
				}
			}
			return next;
		});
	};

	const exitSelectMode = () => {
		setSelectMode(false);
		setSelection(new Set());
	};

	/**
	 * 选中键里**此刻仍存在**的那些（以落盘表为准）。
	 *
	 * 弹窗与菜单的回调是稍后才跑的，那时另一窗口可能已删掉某些勾选项——按键
	 * 匹配天然跳过，与既有批量操作同一容错姿态。
	 */
	const liveSelection = useCallback((): string[] => {
		const map = liveExtMap();
		return [...selection].filter((ext) => Boolean(map[ext]));
	}, [selection, liveExtMap]);

	// ---------------------------------------------------------------- 分组动作

	/**
	 * 分组动作的前置检查：一律重新从 `settings` 取当前表。
	 *
	 * 菜单开着的这段时间里组可能已经没了（另一窗口删空了它、或刚批量移走了最后
	 * 一个成员）。组不在了就说一句退出——静默无事发生是最难排查的那种失败。
	 */
	const takeGroup = useCallback(
		(group: string): string[] | null => {
			const members = groupMembers(liveExtMap(), group);
			if (members.length === 0) {
				new Notice(groupLL.gone({ group }));
				return null;
			}
			return members;
		},
		[liveExtMap, groupLL],
	);

	/** 打开「移到分组」弹窗（`exts` 为空则什么都不做） */
	const openMoveDialog = useCallback(
		(exts: string[], initial: string, sourceEl?: HTMLElement) => {
			if (exts.length === 0) {
				return;
			}
			let submitFn: (() => Promise<boolean>) | null = null;
			new ConfirmDialog(
				settingsStore.plugin,
				{
					title: groupLL.moveTitle(),
					confirmLL: LL.common.save(),
					children: (
						<MoveExtGroup
							groups={groupNames}
							count={exts.length}
							initial={initial}
							onSubmit={async (group) => {
								await settingsStore.updateSettingByPath(
									"fileExplorer.extensions",
									assignGroup(liveExtMap(), exts, group),
								);
								new Notice(
									group
										? groupLL.moved({
												count: exts.length,
												group,
											})
										: groupLL.movedOut({
												count: exts.length,
											}),
								);
							}}
							onReady={(submit) => {
								submitFn = submit;
							}}
						/>
					),
					onConfirm: async () => (submitFn ? await submitFn() : false),
				},
				{ sourceEl },
			).open();
		},
		[settingsStore, liveExtMap, groupNames, groupLL],
	);

	/** 重命名分组：改名到已有组名即合并，由弹窗提前告知 */
	const handleRenameGroup = useCallback(
		(group: string, sourceEl?: HTMLElement) => {
			const members = takeGroup(group);
			if (!members) {
				return;
			}
			let submitFn: (() => Promise<boolean>) | null = null;
			new ConfirmDialog(
				settingsStore.plugin,
				{
					title: groupLL.renameTitle({ group }),
					confirmLL: LL.common.save(),
					children: (
						<RenameExtGroup
							group={group}
							count={members.length}
							groups={groupNames}
							onSubmit={async (next) => {
								await settingsStore.updateSettingByPath(
									"fileExplorer.extensions",
									renameGroup(liveExtMap(), group, next),
								);
								new Notice(
									groupLL.renamed({ from: group, to: next }),
								);
							}}
							onReady={(submit) => {
								submitFn = submit;
							}}
						/>
					),
					onConfirm: async () => (submitFn ? await submitFn() : false),
				},
				{ sourceEl },
			).open();
		},
		[settingsStore, liveExtMap, takeGroup, groupNames, groupLL],
	);

	/**
	 * 解散分组：规则留下、变成未分组。
	 *
	 * 也要确认——它改的是**整组**的归属，撤销只能靠手动重建。但不必危言耸听：
	 * 图标一个没丢，文案就照这么说。
	 */
	const handleDissolveGroup = useCallback(
		(group: string, sourceEl?: HTMLElement) => {
			const members = takeGroup(group);
			if (!members) {
				return;
			}
			const count = members.length;
			new ConfirmDialog(
				settingsStore.plugin,
				{
					title: groupLL.dissolveTitle({ group }),
					confirmLL: groupLL.dissolveConfirm(),
					children: (
						<div className="ci-lib__form">
							<span className="ci-lib__form-hint">
								{groupLL.dissolveBody({ count })}
							</span>
						</div>
					),
					onConfirm: async () => {
						await settingsStore.updateSettingByPath(
							"fileExplorer.extensions",
							dissolveGroup(liveExtMap(), group),
						);
						new Notice(groupLL.dissolved({ group, count }));
					},
				},
				{ sourceEl },
			).open();
		},
		[settingsStore, liveExtMap, takeGroup, groupLL],
	);

	/** 删除分组连同其中的规则：本页破坏性最强的动作，这些扩展名会回落到文件默认图标 */
	const handlePurgeGroup = useCallback(
		(group: string, sourceEl?: HTMLElement) => {
			const members = takeGroup(group);
			if (!members) {
				return;
			}
			const count = members.length;
			new ConfirmDialog(
				settingsStore.plugin,
				{
					title: groupLL.purgeTitle({ group }),
					confirmLL: groupLL.purgeConfirm(),
					children: (
						<div className="ci-lib__form">
							<span className="ci-lib__form-warning">
								{groupLL.purgeBody({ count })}
							</span>
						</div>
					),
					onConfirm: async () => {
						await settingsStore.updateSettingByPath(
							"fileExplorer.extensions",
							deleteGroupWithRules(liveExtMap(), group),
						);
						new Notice(groupLL.purged({ group, count }));
					},
				},
				{ sourceEl },
			).open();
		},
		[settingsStore, liveExtMap, takeGroup, groupLL],
	);

	/**
	 * 分组行的「⋮」菜单：三个动作按破坏性递增排列，删除那一项标红。
	 *
	 * 与 SVG 库的分组菜单同一姿态。另两项都能自己手动恢复（改回名字、把扩展名
	 * 再移回去），只有最后一项会真的丢配置。
	 */
	const handleGroupMenu = useCallback(
		(group: string, event: React.MouseEvent) => {
			event.preventDefault();
			// 现在取住触发它的元素：菜单项的 onClick 稍后才跑，那时 React 合成事件
			// 已被回收，`event.currentTarget` 会是 null。弹窗靠它挂到用户实际操作的
			// 那个窗口（popout 里 activeDocument 不可靠，见 BaseModal）
			const el = event.currentTarget as HTMLElement;
			const menu = new Menu();
			menu.addItem((item) =>
				item
					.setTitle(groupLL.renameAction())
					.setIcon("pencil")
					.onClick(() => handleRenameGroup(group, el)),
			);
			menu.addItem((item) =>
				item
					.setTitle(groupLL.dissolveAction())
					.setIcon("folder-minus")
					.onClick(() => handleDissolveGroup(group, el)),
			);
			menu.addItem((item) => {
				item.setTitle(groupLL.purgeAction())
					.setIcon("trash-2")
					.onClick(() => handlePurgeGroup(group, el));
				item.setWarning(true);
			});
			menu.showAtMouseEvent(event.nativeEvent);
		},
		[
			groupLL,
			handleRenameGroup,
			handleDissolveGroup,
			handlePurgeGroup,
		],
	);

	// ---------------------------------------------------------------- 行渲染

	const renderOverrideRow = (
		mapKey: "extensions" | "folders" | "files",
		key: string,
		override: IFileExplorerIconOverride,
		name: string,
		desc?: string,
	) => (
		<SettingItem
			key={`${mapKey}-${key}`}
			name={name}
			desc={desc}
			control={
				<>
					<RandomIconButton
						value={override.icon ?? ""}
						type={override.type ?? "lucide"}
						onPick={async (value, type) => {
							await writeMap(mapKey, key, {
								...override,
								id: key,
								icon: value,
								type,
							});
						}}
					/>
					<ExtraButton
						icon="trash-2"
						tooltip={LL.common.delete()}
						onClick={async () => {
							await writeMap(mapKey, key, undefined);
						}}
					/>
					<IconPicker
						value={override.icon ?? ""}
						type={override.type ?? "lucide"}
						color={override.color}
						onChange={async (value, type) => {
							await writeMap(mapKey, key, {
								...override,
								id: key,
								icon: value,
								type,
							});
						}}
					/>
					<Color
						value={override.color ?? ""}
						onChange={async (rawColor) => {
							// 不再因「还没配图标」early-return：extensions 是唯一
							// 允许留空图标的表，先挑颜色再挑图标是合理顺序，
							// 而原来的守卫让颜色控件在这些行上静默失效
							await writeMap(mapKey, key, {
								...override,
								id: key,
								color: normalizeIconColor(rawColor) ?? "",
							});
						}}
					/>
				</>
			}
		/>
	);

	/** 一条扩展名规则行；`group` 非空时带「从组中移出」按钮 */
	const renderExtRow = (ext: string, group: string) => {
		const override = extMap[ext];
		const count = tally.get(ext) ?? 0;
		// 空图标行是**不生效**的，必须说出来：这是本页唯一允许留空的表，
		// 过去它看起来和配好的行没区别
		const notes = [
			count > 0 ? extLL.fileCount({ count }) : extLL.noFiles(),
			override.icon ? "" : extLL.needIcon(),
		].filter(Boolean);
		return (
			<SettingItem
				key={`extensions-${ext}`}
				name={`.${ext}`}
				desc={notes.join(" · ")}
				className={[
					group ? "ci-fe__ext-row--grouped" : undefined,
					selectMode ? "ci-fe__row--selecting" : undefined,
				]
					.filter(Boolean)
					.join(" ")}
				info={
					selectMode ? (
						<SelectCheck
							state={selection.has(ext)}
							onToggle={() => toggleSelected(ext)}
							label={extLL.select.rowCheckLabel({ ext })}
						/>
					) : undefined
				}
				control={
					<>
						<ExtraButton
							icon={group ? "folder-minus" : "folder-input"}
							tooltip={
								group
									? groupLL.removeTooltip({ group, ext })
									: groupLL.groupTooltip()
							}
							onClick={async () => {
								if (group) {
									// 组内行上这个按钮就是「移出本组」，不再多开一个弹窗
									await writeExtensions(
										assignGroup(extMap, [ext], ""),
									);
									new Notice(groupLL.movedOut({ count: 1 }));
									return;
								}
								openMoveDialog([ext], "");
							}}
						/>
						<RandomIconButton
							value={override.icon ?? ""}
							type={override.type ?? "lucide"}
							onPick={async (value, type) => {
								await writeMap("extensions", ext, {
									...override,
									id: ext,
									icon: value,
									type,
								});
							}}
						/>
						<ExtraButton
							icon="trash-2"
							tooltip={LL.common.delete()}
							onClick={async () => {
								await writeMap("extensions", ext, undefined);
							}}
						/>
						<IconPicker
							value={override.icon ?? ""}
							type={override.type ?? "lucide"}
							color={override.color}
							onChange={async (value, type) => {
								await writeMap("extensions", ext, {
									...override,
									id: ext,
									icon: value,
									type,
								});
							}}
						/>
						<Color
							value={override.color ?? ""}
							onChange={async (rawColor) => {
								await writeMap("extensions", ext, {
									...override,
									id: ext,
									color: normalizeIconColor(rawColor) ?? "",
								});
							}}
						/>
					</>
				}
			/>
		);
	};

	/**
	 * 分组行：这里的图标选择器一次改**整组**（`setGroupIcon` 扇出 + 一次落盘）。
	 *
	 * 组内图标不一致时如实显示「混合」而不是假装一致——组的图标不是单一真相
	 * （每个成员各存一份），藏起来会让「我明明单独改过 .svg」凭空消失。
	 *
	 * 收起时组行要**自己交代组里有什么**（成员芯片预览 + 未配图标的条数），
	 * 否则「要不要展开」只能靠展开来回答，收起就白收了。
	 */
	const renderGroupRow = (
		group: string,
		memberCount: number,
		fileCount: number,
		iconless: number,
		expanded: boolean,
		previewMembers: string[],
		nameMatched: boolean,
	) => {
		const uniform = uniformIcon(extMap, group);
		if (!uniform) {
			return null;
		}
		// 组行三态：全组成员都在选中集 = 勾，一个不在 = 半选，都不在 = 空。
		// 半选时点一下是「补齐全组」而不是清空——补齐是比清空更常见的意图，
		// 清空可以直接取消每行，也可以再点一次全选态
		const selectedMembers = previewMembers.filter((ext) =>
			selection.has(ext),
		);
		const groupCheckState: boolean | "indeterminate" =
			selectedMembers.length === 0
				? false
				: selectedMembers.length === previewMembers.length
					? true
					: "indeterminate";
		const notes = [
			groupLL.summary({ exts: memberCount, files: fileCount }),
			iconless > 0 ? groupLL.needIconCount({ count: iconless }) : "",
			uniform.mixed ? groupLL.mixed() : "",
			nameMatched ? groupLL.matchedByName({ query: extFilter.trim() }) : "",
		].filter(Boolean);
		const shown = previewMembers.slice(0, MEMBER_PREVIEW_LIMIT);
		const rest = previewMembers.slice(MEMBER_PREVIEW_LIMIT);
		return (
			<SettingItem
				key={`group-${group}`}
				name={group}
				info={
					selectMode ? (
						<SelectCheck
							state={groupCheckState}
							onToggle={() =>
								toggleGroupSelection(previewMembers, groupCheckState)
							}
							label={extLL.select.groupCheckLabel()}
						/>
					) : undefined
				}
				desc={
					<>
						<div>{notes.join(" · ")}</div>
						{/* 收起时才预览：展开着的话下面每个成员都在，芯片是重复信息 */}
						{!expanded && shown.length > 0 && (
							<div className="ci-fe__chips ci-fe__chips--preview">
								{shown.map((ext) => (
									<span
										key={ext}
										className={
											extMap[ext]?.icon
												? "ci-fe__chip ci-fe__chip--static"
												: "ci-fe__chip ci-fe__chip--static is-iconless"
										}
									>
										.{ext}
									</span>
								))}
								{rest.length > 0 && (
									<span
										className="ci-fe__chip ci-fe__chip--static ci-fe__chip--more"
										aria-label={rest
											.map((ext) => `.${ext}`)
											.join(" ")}
									>
										+{rest.length}
									</span>
								)}
							</div>
						)}
					</>
				}
				className={[
					expanded
						? "ci-fe__group-row"
						: "ci-fe__group-row ci-fe__group-row--collapsed",
					selectMode ? "ci-fe__row--selecting" : undefined,
				]
					.filter(Boolean)
					.join(" ")}
				control={
					<>
						<ExtraButton
							icon={expanded ? "chevron-down" : "chevron-right"}
							disabled={Boolean(filterQuery)}
							tooltip={
								filterQuery
									? groupLL.expandLockedTooltip()
									: expanded
										? groupLL.collapseTooltip()
										: groupLL.expandTooltip()
							}
							onClick={() => setExpanded(group, !expanded)}
						/>
						{/*
						 * 用原生 button 而不是 ExtraButton：Obsidian 的
						 * ExtraButtonComponent 只给 `() => void`，拿不到事件，
						 * 而这里两样都要——`showAtMouseEvent` 定位菜单，
						 * `currentTarget` 决定弹窗挂到哪个窗口（popout 里
						 * activeDocument 不可靠，见 BaseModal）。
						 */}
						<button
							className="clickable-icon ci-fe__group-menu"
							aria-label={groupLL.manageTooltip()}
							onClick={(event) => handleGroupMenu(group, event)}
						>
							<MoreVertical size={16} />
						</button>
						<RandomIconButton
							value={uniform.icon}
							type={uniform.type}
							note={groupLL.diceGroupNote({ count: memberCount })}
							onPick={async (value, type) => {
								await writeExtensions(
									setGroupIcon(extMap, group, value, type),
								);
							}}
						/>
						<IconPicker
							value={uniform.mixed ? "" : uniform.icon}
							type={uniform.type}
							color={uniform.mixed ? undefined : uniform.color}
							onChange={async (value, type) => {
								await writeExtensions(
									setGroupIcon(extMap, group, value, type),
								);
							}}
						/>
						<Color
							value={uniform.mixed ? "" : uniform.color}
							onChange={async (rawColor) => {
								// 只改颜色，不顺手把混合的图标统一掉
								await writeExtensions(
									setGroupColor(
										extMap,
										group,
										normalizeIconColor(rawColor) ?? "",
									),
								);
							}}
						/>
					</>
				}
			/>
		);
	};

	const renderDefault = (
		field: "folderDefault" | "fileDefault",
		label: string,
		desc: string,
	) => {
		const icon = fe[field];
		return (
			<SettingItem
				name={label}
				desc={desc}
				control={
					<>
						<RandomIconButton
							value={icon.icon}
							type={icon.type}
							onPick={async (value, type) => {
								// 一次写整个默认项而不是 icon / type 各写一次：每次写入
								// 都是一遍 saveSettings + applyAll，而中间那一拍还是
								// 「新 icon 配旧 type」的错配状态（会渲染出不存在的图标）
								await settingsStore.updateSettingByPath(
									`fileExplorer.${field}`,
									{ ...icon, icon: value, type },
								);
							}}
						/>
						<ExtraButton
							icon="reset"
							tooltip={LL.settings.fileExplorer[
								field
							].resetTooltip()}
							onClick={async () => {
								await settingsStore.updateSettingByPath(
									`fileExplorer.${field}`,
									{
										id: "",
										icon: "",
										type: "lucide",
										color: "",
									},
								);
							}}
						/>
						<IconPicker
							value={icon.icon}
							type={icon.type}
							color={icon.color}
							onChange={async (value, type) => {
								await settingsStore.updateSettingByPath(
									`fileExplorer.${field}`,
									{ ...icon, icon: value, type },
								);
							}}
						/>
						<Color
							value={icon.color ?? ""}
							onChange={async (rawColor) => {
								await settingsStore.updateSettingByPath(
									`fileExplorer.${field}.color`,
									normalizeIconColor(rawColor) ?? "",
								);
							}}
						/>
					</>
				}
			/>
		);
	};

	// ---------------------------------------------------------------- 单项覆盖

	const overrideQuery = overrideFilter.trim().toLowerCase();
	const matchPath = (path: string) =>
		!overrideQuery || path.toLowerCase().includes(overrideQuery);

	const folderEntries = Object.entries(fe.folders).filter(([path]) =>
		matchPath(path),
	);
	const fileEntries = Object.entries(fe.files).filter(([path]) =>
		matchPath(path),
	);
	const hasAnyOverride =
		Object.keys(fe.folders).length > 0 || Object.keys(fe.files).length > 0;

	const extCount = Object.keys(extMap).length;

	return (
		<>
			<SettingGroup>
				<SettingItem
					name={LL.settings.fileExplorer.enable.name()}
					desc={LL.settings.fileExplorer.enable.desc()}
					control={
						<Toggle
							value={fe.enable}
							onChange={async (value) => {
								await settingsStore.updateSettingByPath(
									"fileExplorer.enable",
									value,
								);
							}}
						/>
					}
				/>
				<FeatureOffNotice enabled={fe.enable} />
			</SettingGroup>

			{/* 总开关以下全部随它禁用：关着的时候这些配置一条都不生效 */}
			<SettingGroup disabled={!fe.enable}>
				{renderDefault(
					"folderDefault",
					LL.settings.fileExplorer.folderDefault.name(),
					LL.settings.fileExplorer.folderDefault.desc(),
				)}
				{renderDefault(
					"fileDefault",
					LL.settings.fileExplorer.fileDefault.name(),
					LL.settings.fileExplorer.fileDefault.desc(),
				)}
				<SettingItem
					name={LL.settings.fileExplorer.inherit.subfolder.name()}
					desc={LL.settings.fileExplorer.inherit.subfolder.desc()}
					control={
						<Toggle
							value={fe.inherit.subfolder}
							onChange={async (value) => {
								await settingsStore.updateSettingByPath(
									"fileExplorer.inherit.subfolder",
									value,
								);
							}}
						/>
					}
				/>
				<SettingItem
					name={LL.settings.fileExplorer.inherit.file.name()}
					desc={LL.settings.fileExplorer.inherit.file.desc()}
					control={
						<Toggle
							value={fe.inherit.file}
							onChange={async (value) => {
								await settingsStore.updateSettingByPath(
									"fileExplorer.inherit.file",
									value,
								);
							}}
						/>
					}
				/>
			</SettingGroup>

			<SettingGroup
				title={extLL.name()}
				disabled={!fe.enable}
				search={
					extCount > 0
						? {
								value: extFilter,
								placeholder: extLL.filterPlaceholder(),
								onChange: setExtFilter,
							}
						: undefined
				}
				actions={
					selectMode ? (
						<div className="ci-fe__select-bar">
							<span className="ci-fe__select-count">
								{selection.size > 0
									? extLL.select.selectedCount({
											count: selection.size,
										})
									: extLL.select.emptyHint()}
							</span>
								{selection.size > 0 && (
									<>
										{/*
										 * 统一指定图标：选择模式存在的第一理由。
										 * 混合的选中项没有「当前图标」可显示，预览留空，
										 * 点开即选、选完一次扇出到全部选中项
										 */}
										<IconPicker
											value=""
											type="lucide"
											onChange={async (value, type) => {
												const exts = liveSelection();
												if (exts.length === 0) {
													return;
												}
												await writeExtensions(
													setExtsIcon(
														liveExtMap(),
														exts,
														value,
														type,
													),
												);
											}}
										/>
										<ExtraButton
											icon="folder-input"
											tooltip={groupLL.groupTooltip()}
											onClick={() => {
												openMoveDialog(
													liveSelection(),
													"",
												);
											}}
										/>
										<ExtraButton
											icon="dices"
											tooltip={extLL.select.diceTooltip()}
											onClick={() => {
												void randomizeExts(
													liveSelection(),
												);
											}}
										/>
										<ExtraButton
											icon="eraser"
											tooltip={extLL.select.clearTooltip()}
											onClick={() => {
												clearExts(liveSelection());
											}}
										/>
										<ExtraButton
											icon="trash-2"
											tooltip={extLL.select.deleteTooltip()}
											onClick={() => {
												deleteExtsWithConfirm(
													liveSelection(),
												);
											}}
										/>
									</>
								)}
								<ExtraButton
									icon="x"
									tooltip={extLL.select.exitTooltip()}
									onClick={exitSelectMode}
								/>
								</div>
						) : (
							<>
								{/* 列表动作只在有规则时有意义；添加 / 预设永远要在 */}
								{extCount > 0 && (
									<>
										<ExtraButton
											icon={
												extSort === "count"
													? "arrow-down-0-1"
													: "arrow-down-a-z"
											}
											tooltip={extLL.sortTooltip({
												mode:
													extSort === "count"
														? extLL.sortByCount()
														: extLL.sortByName(),
											})}
											onClick={() => {
												setExtSort((prev) =>
													prev === "count" ? "name" : "count",
												);
											}}
										/>
										<ExtraButton
											icon="dices"
											tooltip={extLL.dicesTooltip()}
											onClick={() => {
												void randomizeExts(filteredExts);
											}}
										/>
										<ExtraButton
											icon="eraser"
											tooltip={extLL.clearTooltip()}
											onClick={() => {
												clearExts(filteredExts);
											}}
										/>
										{/* 只有存在分组时才有意义；筛选期一律展开，此时按钮无用 */}
										{visibleGroups.length > 0 && (
											<ExtraButton
												icon={
													anyCollapsed
														? "chevrons-up-down"
														: "chevrons-down-up"
												}
												disabled={Boolean(filterQuery)}
												tooltip={
													filterQuery
														? groupLL.expandLockedTooltip()
														: anyCollapsed
															? groupLL.expandAllTooltip()
															: groupLL.collapseAllTooltip()
												}
												onClick={() => setAllExpanded(anyCollapsed)}
											/>
										)}
										<ExtraButton
											icon="list-checks"
											tooltip={extLL.select.toggleTooltip()}
											onClick={() => {
												setSelectMode(true);
											}}
										/>
									</>
								)}
									<ExtraButton
										icon="plus"
										tooltip={extLL.addTooltip()}
										onClick={() => openAddDialog()}
									/>
								</>
							)
						}
			>
				<SettingItem desc={extLL.desc()} />

				{/* 库里有、还没配规则的扩展名：点一下即添加（复合后缀独立一排并带徽标） */}
				{candidates.length > 0 && (
					<SettingItem
						name={extLL.candidates()}
						className="ci-fe__candidates"
						control={
							<div className="ci-fe__chips">
								{candidates.map(({ ext, count }) => (
									<button
										key={ext}
										className="ci-fe__chip"
										aria-label={extLL.candidateTooltip({
											ext,
											count,
										})}
										onClick={() => {
											void addCandidate(ext);
										}}
									>
										.{ext}
										<span className="ci-fe__chip-count">
											{count}
										</span>
									</button>
								))}
							</div>
						}
					/>
				)}
				{compoundCandidates.length > 0 && (
					<SettingItem
						name={extLL.candidatesCompound()}
						className="ci-fe__candidates"
						control={
							<div className="ci-fe__chips">
								{compoundCandidates.map(({ ext, count }) => (
									<button
										key={ext}
										className="ci-fe__chip ci-fe__chip--compound"
										aria-label={extLL.candidateTooltip({
											ext,
											count,
										})}
										onClick={() => {
											void addCandidate(ext);
										}}
									>
										.{ext}
										<span className="ci-fe__chip-badge">
											{extLL.compoundBadge()}
										</span>
										{/* 内置候选库中没有同后缀文件时计 0，不显数 */}
										{count > 0 && (
											<span className="ci-fe__chip-count">
												{count}
											</span>
										)}
									</button>
								))}
							</div>
						}
					/>
				)}

				{extCount === 0 && <SettingItem name={extLL.noneFound()} />}

				{extCount > 0 && filteredExts.length === 0 && (
					<SettingItem name={extLL.noneMatched()} />
				)}

				{/* 分组行 + 组内成员（收起时只留组行，成员靠组行上的芯片预览） */}
				{visibleGroups.map((group) => {
					const expanded = isExpanded(group.name, group.iconless);
					return (
						<Fragment key={`group-block-${group.name}`}>
							{renderGroupRow(
								group.name,
								group.count,
								group.files,
								group.iconless,
								expanded,
								group.members,
								group.nameMatched,
							)}
							{expanded &&
								group.members.map((ext) =>
									renderExtRow(ext, group.name),
								)}
						</Fragment>
					);
				})}

				{/* 未分组：只有在同时存在分组时才需要这条分隔标题 */}
				{visibleGroups.length > 0 && visibleUngrouped.length > 0 && (
					<SettingItem name={groupLL.ungrouped()} heading />
				)}
				{visibleUngrouped.map((ext) => renderExtRow(ext, ""))}
			</SettingGroup>

			<SettingGroup
				title={LL.settings.fileExplorer.overrides.name()}
				disabled={!fe.enable}
				search={
					hasAnyOverride
						? {
								value: overrideFilter,
								placeholder:
									LL.settings.fileExplorer.overrides.filterPlaceholder(),
								onChange: setOverrideFilter,
							}
						: undefined
				}
			>
				<SettingItem desc={LL.settings.fileExplorer.overrides.desc()} />
				{!hasAnyOverride && (
					<SettingItem
						name={LL.settings.fileExplorer.overrides.noneFound()}
					/>
				)}
				{hasAnyOverride &&
					folderEntries.length === 0 &&
					fileEntries.length === 0 && (
						<SettingItem
							name={LL.settings.fileExplorer.overrides.noneMatched()}
						/>
					)}
				{folderEntries.length > 0 && (
					<SettingItem
						name={LL.settings.fileExplorer.overrides.folderSection()}
						heading
					/>
				)}
				{folderEntries.map(([path, override]) =>
					renderOverrideRow("folders", path, override, path),
				)}
				{fileEntries.length > 0 && (
					<SettingItem
						name={LL.settings.fileExplorer.overrides.fileSection()}
						heading
					/>
				)}
				{fileEntries.map(([path, override]) =>
					renderOverrideRow("files", path, override, path),
				)}
			</SettingGroup>
		</>
	);
};
