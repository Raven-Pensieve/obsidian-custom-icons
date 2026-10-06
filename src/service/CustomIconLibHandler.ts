import { CI_LUCIDE_PREFIX } from "@src/api/describeIcon";
import IconPackStore from "@src/service/icon-packs/IconPackStore";
import { sanitizeSvg } from "@src/service/icon-packs/sanitize";
import { packIconId } from "@src/service/icon-packs/types";
import { ICustomIconLib, IIconPackManifest } from "@src/types/types";
import {
	getExtraLucideIconNames,
	markLucideExtrasRegistered,
	renderLucideIconMarkup,
	unmarkLucideExtrasRegistered,
} from "@src/util/getLucideIcons";
import { AbstractIconHandler } from "../util/IconHandler";
import { cleanSvg } from "../util/svgUtils";
import { addIcon, removeIcon } from "obsidian";

export default class CustomIconLibHandler extends AbstractIconHandler<ICustomIconLib> {
	readonly id = "customIconLib";

	/**
	 * 已注册进全局注册表的包 → 其 IIconSet 快照。
	 * 以缓存对象身份判断是否需要（重新）注册：writePack 总是写入新对象，
	 * 因此覆盖安装/更新会自动触发重注册；重复 applyAll 为幂等 no-op。
	 */
	private appliedPacks = new Map<string, IIconSetLike>();

	/**
	 * 图标集合的修订号：**只在真的调过 `addIcon` / `removeIcon` 之后**自增。
	 *
	 * 存在的理由是跨插件变更事件（见 dev/ecosystem/跨插件API导出方案.md §5）。
	 * `saveSettings()` 对每一次无关设置改动（切个 fileExplorer 开关）都会跑一遍
	 * `applyAll()`，若无条件广播，消费方会为此反复重建上万条派生缓存。
	 * 由本处理器自报「注册表动没动」，`main` 比较前后值决定是否 trigger。
	 */
	private revision = 0;

	/**
	 * 上一轮注册的用户 SVG 签名，用于把「重复 applyAll」判成 no-op。
	 *
	 * 包侧靠 `appliedPacks` 的对象身份判定，用户 SVG 没有同等的天然身份，
	 * 故按 `id + 内容长度` 拼签名——`addIcon` 本来就是覆盖写，这里的目的
	 * 不是省下那几次调用，而是**不让无关设置改动虚增 revision**。
	 * 不哈希全文：改内容而长度不变（如换个色值同位数）的漏判代价仅是
	 * 消费方少收一次事件，而它自己的渲染并不依赖内容。
	 */
	private appliedSvgSignature: string | null = null;

	/**
	 * 上一轮实际注册进注册表的用户 SVG 注册 id。
	 *
	 * 不能用「这一轮的设置」反推该注销谁——删掉的那个 id 已经不在设置里了。
	 */
	private appliedSvgIds = new Set<string>();

	/**
	 * 本会话已注册进注册表的 Lucide 差集图标名（注册 id 为 `CI-lucide-<name>`）。
	 *
	 * `null` = 尚未注册过；空数组 = 注册过但差集为空。差集不随设置变化、
	 * bundle 更新必然伴随插件重载，故一次会话注册一次即可（重复 applyAll 幂等）。
	 * 见 issue #127：注册是为了让其他插件能用 Obsidian 原生 `setIcon` 画差集。
	 * **不能用 `lucide-<name>` 形态**——Obsidian 的 `getIcon` 对该前缀只查自带
	 * lucide 集，插件注册的 lucide-* id 画不出来（见 describeIcon.ts）。
	 */
	private appliedLucideExtras: string[] | null = null;

	constructor(private iconPackStore: IconPackStore) {
		super();
	}

	/** 当前修订号，供 `main` 比较是否需要广播变更事件 */
	getRevision(): number {
		return this.revision;
	}

	/**
	 * 用户 SVG 的注册 id。
	 *
	 * 已经带 `CI-` 的不再叠一层——这条规则是历史行为，且被跨插件 API 的
	 * `describe()` 逆向依赖（见 dev/ecosystem/跨插件API导出方案.md §3.1），
	 * 两处必须同步修改。
	 */
	private svgIconId(id: string): string {
		return id.startsWith("CI-") ? id : `CI-${id}`;
	}

	apply(): void {
		// 用户单个 SVG：注册时 sanitize（存储内容不动，仅过滤渲染标记）
		const svgIcons = this.settings?.svg || [];
		const signature = svgIcons
			.filter((icon) => icon.id && icon.content)
			.map((icon) => `${icon.id}:${icon.content.length}`)
			.join("|");

		if (signature !== this.appliedSvgSignature) {
			// 上一轮有、这一轮没了的 id 要注销：删掉一个 SVG 后若只是「不再注册」，
			// 它仍留在注册表里，消费方 resolve 成功却画不出东西（正是方案 §1.1 的空白路径）
			const nextIds = new Set(
				svgIcons
					.filter((icon) => icon.id && icon.content)
					.map((icon) => this.svgIconId(icon.id)),
			);
			for (const id of this.appliedSvgIds) {
				if (!nextIds.has(id)) {
					removeIcon(id);
				}
			}

			for (const icon of svgIcons) {
				if (icon.id && icon.content) {
					const content =
						sanitizeSvg(icon.content) ?? cleanSvg(icon.content);
					addIcon(this.svgIconId(icon.id), content);
				}
			}

			this.appliedSvgIds = nextIds;
			this.appliedSvgSignature = signature;
			this.revision++;
		}

		// 图标库包：enabled 注册 / disabled 注销 / manifest 外残留清理
		const packs = this.settings?.packs ?? {};
		const seen = new Set<string>();
		for (const manifest of Object.values(packs)) {
			seen.add(manifest.id);
			if (manifest.enabled) {
				this.applyPack(manifest);
			} else {
				this.cleanupPack(manifest.id);
			}
		}
		for (const id of Array.from(this.appliedPacks.keys())) {
			if (!seen.has(id)) {
				this.cleanupPack(id);
			}
		}

		// Lucide 差集：无条件注册，不随设置变化
		this.applyLucideExtras();
	}

	/**
	 * 把 Lucide 差集（bundle 里有、Obsidian 原生未内置的那批）以 `CI-lucide-<name>`
	 * 注册进 Obsidian 注册表（issue #127），让其他插件能用原生 `setIcon` 画。
	 *
	 * 与 Obsidian 内置（`lucide-<name>`）、本插件其它前缀（`CI-<packId>-`）都不同，
	 * 互不覆盖。**与 lucide 图标包共用 `CI-lucide-` 命名空间**（Iconify `lucide` 集
	 * 装的就是同一批图标的文件版）：包启用时由包接管、差集退避——两边写的是同一批
	 * id，谁在场都一样，退避只是避免注销时误删对方的注册。
	 */
	private applyLucideExtras(): void {
		// lucide 包启用：包 apply 在本轮已写满 CI-lucide-*，差集退避。
		// 只丢状态不 removeIcon——id 内容没变，删了反而会把包的注册一起带走
		if (this.settings?.packs?.["lucide"]?.enabled) {
			if (this.appliedLucideExtras) {
				unmarkLucideExtrasRegistered(this.appliedLucideExtras);
				this.appliedLucideExtras = null;
			}
			return;
		}
		if (this.appliedLucideExtras !== null) {
			return;
		}
		// 用户 SVG 可能占用同名 id（如导入时叫 "lucide-blender"）：SVG 注册在前，
		// 差集让位，与 describe 的「SVG 优先」判定保持同一优先级
		const userClaimed = new Set(
			(this.settings?.svg ?? [])
				.filter((icon) => icon.id && icon.content)
				.map((icon) => this.svgIconId(icon.id)),
		);
		const registered: string[] = [];
		for (const name of getExtraLucideIconNames()) {
			if (userClaimed.has(`${CI_LUCIDE_PREFIX}${name}`)) {
				continue;
			}
			const svg = renderLucideIconMarkup(name);
			if (!svg) {
				continue;
			}
			addIcon(`${CI_LUCIDE_PREFIX}${name}`, svg);
			registered.push(name);
		}
		markLucideExtrasRegistered(registered);
		this.appliedLucideExtras = registered;
		if (registered.length > 0) {
			this.revision++;
		}
	}

	private cleanupLucideExtras(): void {
		if (this.appliedLucideExtras === null) {
			return;
		}
		for (const name of this.appliedLucideExtras) {
			removeIcon(`${CI_LUCIDE_PREFIX}${name}`);
		}
		unmarkLucideExtrasRegistered(this.appliedLucideExtras);
		if (this.appliedLucideExtras.length > 0) {
			this.revision++;
		}
		this.appliedLucideExtras = null;
	}

	private applyPack(manifest: IIconPackManifest): void {
		const pack = this.iconPackStore.getCachedPack(manifest.id);
		if (!pack) {
			// 预载缺失或文件损坏：跳过并告警，不阻断其余注册
			console.warn(
				`[Custom Icons] icon pack "${manifest.id}" not loaded (missing or broken file)`,
			);
			return;
		}
		if (this.appliedPacks.get(manifest.id) === pack) {
			return; // 已注册当前版本
		}
		// 版本更新：先注销旧图标再注册新版本
		this.cleanupPack(manifest.id);
		for (const [name, svg] of Object.entries(pack.icons)) {
			addIcon(packIconId(manifest.id, name), svg);
		}
		this.appliedPacks.set(manifest.id, pack);
		this.revision++;
	}

	private cleanupPack(packId: string): void {
		const applied = this.appliedPacks.get(packId);
		if (!applied) {
			return;
		}
		for (const name of Object.keys(applied.icons)) {
			removeIcon(packIconId(packId, name));
		}
		this.appliedPacks.delete(packId);
		this.revision++;
	}

	cleanup(): void {
		// 按**实际注册过的** id 注销，而不是按当前设置反推：
		// 设置里可能已经删掉了某个图标，但它还在注册表里躺着
		for (const id of this.appliedSvgIds) {
			removeIcon(id);
		}
		if (this.appliedSvgIds.size > 0) {
			this.revision++;
		}
		this.appliedSvgIds = new Set();
		this.appliedSvgSignature = null;

		for (const id of Array.from(this.appliedPacks.keys())) {
			this.cleanupPack(id);
		}

		this.cleanupLucideExtras();
	}

	isEnabled(): boolean {
		return true;
	}
}

/** IIconSet 的结构签名（避免与 service 层类型的循环导入） */
interface IIconSetLike {
	icons: Record<string, string>;
}
