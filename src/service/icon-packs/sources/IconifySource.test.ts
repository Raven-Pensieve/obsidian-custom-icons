import type { ICollectionInfo } from "@src/service/icon-packs/IconPackStore";
import { excludeRedundantCollections } from "./IconifySource";

function info(prefix: string): ICollectionInfo {
	return { prefix, name: prefix, total: 1 };
}

/**
 * 目录不再列出 lucide 集（issue #127 的收尾）：差集已内置注册为
 * `CI-lucide-<name>`，整集安装只剩冗余。这里锁住过滤行为，防止将来
 * 目录调整时无声回归（存量安装不受影响，只影响目录展示与新安装入口）。
 */
describe("excludeRedundantCollections", () => {
	test("过滤 lucide 集，其余原样保留", () => {
		const out = excludeRedundantCollections([
			info("mdi"),
			info("lucide"),
			info("tabler"),
		]);
		expect(out.map((c) => c.prefix)).toEqual(["mdi", "tabler"]);
	});

	test("没有命中时返回同序完整列表", () => {
		const list = [info("mdi"), info("tabler")];
		expect(excludeRedundantCollections(list)).toEqual(list);
	});
});
