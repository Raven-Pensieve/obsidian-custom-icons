import { IFileExplorerConfig } from "@src/util/fileExplorerIcon";
import { alwaysRenderable, type IconRenderable } from "@src/util/iconRenderable";
import {
	extractLinkPath,
	LinkDestinationResolver,
	resolveLinkIcon,
} from "./internalLinkIcon";

const emptyCfg: IFileExplorerConfig = {
	enable: true,
	folderDefault: { id: "", icon: "", type: "lucide", color: "" },
	folders: {},
	fileDefault: { id: "", icon: "", type: "lucide", color: "" },
	extensions: {},
	files: {},
	inherit: { subfolder: false, file: false },
};

/** 恒等解析器：路径段原样当作目标路径（未解析用 undefined） */
const identity: LinkDestinationResolver = (linkPath) => linkPath || undefined;

describe("extractLinkPath", () => {
	it("extracts the path from a data-href", () => {
		expect(extractLinkPath("Note")).toBe("Note");
		expect(extractLinkPath("dir/Note.md")).toBe("dir/Note.md");
	});

	it("strips heading and block refs from a data-href", () => {
		expect(extractLinkPath("Note#标题")).toBe("Note");
		expect(extractLinkPath("Note#^block-id")).toBe("Note");
	});

	it("extracts the path from raw wikilink text", () => {
		expect(extractLinkPath("[[Note]]")).toBe("Note");
		expect(extractLinkPath("[[Note|别名]]")).toBe("Note");
		expect(extractLinkPath("[[Note#标题|别名]]")).toBe("Note");
		expect(extractLinkPath("[[dir/Note.md]]")).toBe("dir/Note.md");
	});

	it("returns empty for same-file section links", () => {
		expect(extractLinkPath("#标题")).toBe("");
		expect(extractLinkPath("[[#标题]]")).toBe("");
		expect(extractLinkPath("[[#^block-id|别名]]")).toBe("");
	});
});

describe("resolveLinkIcon", () => {
	const cfg: IFileExplorerConfig = {
		...emptyCfg,
		files: {
			"YG/春节.md": { id: "YG/春节.md", icon: "flower", type: "lucide", color: "" },
		},
		extensions: {
			md: { id: "md", icon: "file-text", type: "lucide", color: "" },
		},
		fileDefault: { id: "", icon: "file", type: "lucide", color: "" },
	};

	it("resolves an explicit per-file mapping", () => {
		expect(
			resolveLinkIcon(
				"YG/春节.md",
				"other.md",
				cfg,
				"explicit",
				alwaysRenderable,
				identity,
			),
		).toMatchObject({ icon: "flower", type: "lucide" });
	});

	it("explicit ignores extension rules and fileDefault", () => {
		expect(
			resolveLinkIcon(
				"plain.md",
				"other.md",
				cfg,
				"explicit",
				alwaysRenderable,
				identity,
			),
		).toBeNull();
	});

	it("cascade falls through the full file-explorer cascade", () => {
		// files 命中
		expect(
			resolveLinkIcon(
				"YG/春节.md",
				"other.md",
				cfg,
				"cascade",
				alwaysRenderable,
				identity,
			),
		).toMatchObject({ icon: "flower" });
		// extensions 命中
		expect(
			resolveLinkIcon(
				"plain.md",
				"other.md",
				cfg,
				"cascade",
				alwaysRenderable,
				identity,
			),
		).toMatchObject({ icon: "file-text" });
		// fileDefault 兜底
		expect(
			resolveLinkIcon(
				"no/ext",
				"other.md",
				cfg,
				"cascade",
				alwaysRenderable,
				identity,
			),
		).toMatchObject({ icon: "file" });
	});

	it("honors the alias / heading part of wikilink text", () => {
		expect(
			resolveLinkIcon(
				"[[YG/春节.md#标题|别名]]",
				"other.md",
				cfg,
				"explicit",
				alwaysRenderable,
				identity,
			),
		).toMatchObject({ icon: "flower" });
	});

	it("treats an unrenderable mapping as unset in explicit mode", () => {
		const none: IconRenderable = () => false;
		expect(
			resolveLinkIcon(
				"YG/春节.md",
				"other.md",
				cfg,
				"explicit",
				none,
				identity,
			),
		).toBeNull();
	});

	it("returns null for unresolved links", () => {
		const never: LinkDestinationResolver = () => undefined;
		expect(
			resolveLinkIcon(
				"Missing.md",
				"other.md",
				cfg,
				"cascade",
				alwaysRenderable,
				never,
			),
		).toBeNull();
	});

	it("resolves same-file section links to the source file", () => {
		// [[#标题]]：路径段为空 → 目标回落为 sourcePath 自身
		expect(
			resolveLinkIcon(
				"#标题",
				"YG/春节.md",
				cfg,
				"explicit",
				alwaysRenderable,
				identity,
			),
		).toMatchObject({ icon: "flower" });
		// sourcePath 为空（未落盘）则无从解析
		expect(
			resolveLinkIcon(
				"#标题",
				"",
				cfg,
				"explicit",
				alwaysRenderable,
				identity,
			),
		).toBeNull();
	});

	it("returns null for an empty link", () => {
		expect(
			resolveLinkIcon(undefined, "a.md", cfg, "cascade", alwaysRenderable, identity),
		).toBeNull();
		expect(
			resolveLinkIcon("", "a.md", cfg, "cascade", alwaysRenderable, identity),
		).toBeNull();
	});

	it("carries the configured color through", () => {
		const colored: IFileExplorerConfig = {
			...emptyCfg,
			files: {
				"a.md": { id: "a.md", icon: "sun", type: "svg", color: "#e5a50a" },
			},
		};
		expect(
			resolveLinkIcon("a.md", "b.md", colored, "explicit", alwaysRenderable, identity),
		).toMatchObject({ icon: "sun", type: "svg", color: "#e5a50a" });
	});
});
