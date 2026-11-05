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
import { FC } from "react";

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
							options={{
								explicit: LL.settings.internalLinks.resolve.explicit(),
								cascade: LL.settings.internalLinks.resolve.cascade(),
							}}
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
