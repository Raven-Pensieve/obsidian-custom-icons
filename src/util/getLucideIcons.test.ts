import type { LucideCatalogEntry } from "./getLucideIcons";

/**
 * 差集注册（issue #127）相关的目录判定与注册用 SVG 生成。
 *
 * 差集以 `CI-lucide-<name>` 注册（**不能**用 `lucide-<name>`：Obsidian 的
 * `getIcon` 对该前缀只查自带 lucide 集，插件注册的 lucide-* id 画不出来）。
 * 因此 builtin 判定的 `lucide-` 前缀过滤天然不会吞掉自己的注册——这里锁住
 * 这条性质，防止将来有人改回 `lucide-` 前缀时无声回归。
 *
 * 必须 `jest.resetModules` + `doMock` + 动态 import：被测的是模块级缓存行为，
 * 共享模块实例会把用例互相污染；getLucideIcons 顶部 import 了 `obsidian`
 * （node 环境不存在），也得一并 mock。
 */

type LucideModule = typeof import("./getLucideIcons");

/** 以指定的注册表内容加载一份全新的 getLucideIcons 模块 */
async function loadModule(
	getIconIds: () => string[],
): Promise<LucideModule> {
	jest.resetModules();
	jest.doMock("obsidian", () => ({ getIconIds }));
	// ts-jest 会把动态 import 编译回模块注册表里的 require，
	// resetModules / doMock 对它照样生效
	return await import("./getLucideIcons");
}

/** 目录条目按名字索引，便于断言 */
function builtinByName(
	catalog: LucideCatalogEntry[],
): (name: string) => boolean | undefined {
	const byName = new Map(catalog.map((entry) => [entry.name, entry.builtin]));
	return (name) => byName.get(name);
}

describe("getLucideIconCatalog 与差集注册 id 的隔离", () => {
	test("CI-lucide-* 注册 id 出现在 getIconIds() 里不影响 builtin 判定", async () => {
		// 差集注册后 getIconIds() 会多出 CI-lucide-* 条目；它们不以 "lucide-"
		// 开头，builtin 判定的前缀过滤天然忽略——差集不会被误判成 Obsidian 原生
		const m = await loadModule(() => [
			"lucide-sun",
			"CI-lucide-blender",
			"CI-mdi-home",
		]);
		m.markLucideExtrasRegistered(["blender"]);

		const lookup = builtinByName(m.getLucideIconCatalog());
		expect(lookup("sun")).toBe(true); // 原生内置
		expect(lookup("blender")).toBe(false); // 差集
	});

	test("其它来源注册的 lucide- id 维持既有行为（算内置）", async () => {
		const m = await loadModule(() => ["lucide-sun", "lucide-blender"]);

		const lookup = builtinByName(m.getLucideIconCatalog());
		expect(lookup("sun")).toBe(true);
		expect(lookup("blender")).toBe(true);
	});
});

describe("renderLucideIconMarkup", () => {
	test("产出带 xmlns 的完整 SVG 字符串，根节点剥掉固定尺寸", async () => {
		const m = await loadModule(() => []);
		const svg = m.renderLucideIconMarkup("blender");
		expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
		expect(svg).not.toMatch(/^<svg[^>]*\s(width|height)=/); // 根节点无固定尺寸
		expect(svg).toContain('class="lucide lucide-blender"');
		expect(svg?.endsWith("</svg>")).toBe(true);
	});

	test("子元素的 width/height（图形尺寸）不受根节点剥除影响", async () => {
		// lucide-ad 的根节点下有 <rect x="2" y="5" width="20" height="14">：
		// 全局剥除会把它一起删掉，图形就残了
		const m = await loadModule(() => []);
		const svg = m.renderLucideIconMarkup("ad");
		expect(svg).toMatch(/^<svg[^>]*viewBox="0 0 24 24"/);
		expect(svg).not.toMatch(/^<svg[^>]*\s(width|height)=/);
		expect(svg).toContain('<rect x="2" y="5" width="20" height="14" rx="2">');
	});

	test("未知图标名 → null", async () => {
		const m = await loadModule(() => []);
		expect(m.renderLucideIconMarkup("")).toBeNull();
	});
});
