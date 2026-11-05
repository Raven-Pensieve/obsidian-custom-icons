import {
	Dropdown,
	FeatureOffNotice,
	SettingGroup,
	SettingItem,
	Toggle,
} from "@src/components/obsidian-setting";
import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import { LL } from "@src/i18n/i18n";
import { FC, useMemo } from "react";

/**
 * 「内部链接」设置页：正文内部链接前的目标文件图标。
 *
 * 图标本身在文件浏览器里配置（映射只维护一份），这里只有两个开关——
 * 总开关与解析档位（见 InternalLinkIconHandler / internalLinkIcon.ts）。
 */
export const InternalLinks: FC = () => {
	const settingsStore = useSettingsStore();
	const settings = usePluginSettings(settingsStore);
	const il = settings.internalLinks;

	// options 必须 memo：内联字面量每次渲染都是新引用，会让 Dropdown 的
	// options effect 在每次重渲（设置页全量快照，任何写入都会重渲整页）时
	// 重建全部 option——DOM 无谓抖动，且旧版组件在重建后不恢复选中态
	const resolveOptions = useMemo(
		() => ({
			explicit: LL.settings.internalLinks.resolve.explicit(),
			cascade: LL.settings.internalLinks.resolve.cascade(),
		}),
		[],
	);

	return (
		<>
			<SettingGroup>
				<SettingItem
					name={LL.settings.internalLinks.enable.name()}
					desc={LL.settings.internalLinks.enable.desc()}
					control={
						<Toggle
							value={il.enable}
							onChange={async (value) => {
								await settingsStore.updateSettingByPath(
									"internalLinks.enable",
									value,
								);
							}}
						/>
					}
				/>
				<FeatureOffNotice enabled={il.enable} />
			</SettingGroup>

			<SettingGroup disabled={!il.enable}>
				<SettingItem
					name={LL.settings.internalLinks.resolve.name()}
					desc={LL.settings.internalLinks.resolve.desc()}
					control={
						<Dropdown
							value={il.resolve}
							options={resolveOptions}
							// Dropdown 的 onChange 期望同步回调（Toggle 才是 async 形状），
							// 异步写入用 void 悬挂
							onChange={(value) => {
								void settingsStore.updateSettingByPath(
									"internalLinks.resolve",
									value as "explicit" | "cascade",
								);
							}}
						/>
					}
				/>
			</SettingGroup>
		</>
	);
};
