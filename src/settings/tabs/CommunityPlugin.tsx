import { IconPicker } from "@src/components/icon-picker/IconPicker";
import {
	ExtraButton,
	SettingGroup,
	SettingItem,
} from "@src/components/obsidian-setting";
import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import { t } from "@src/i18n/i18n";
import { DEFAULT_SETTINGS } from "@src/types/types";
import { FC, useMemo } from "react";

export const CommunityPlugin: FC = () => {
	const settingsStore = useSettingsStore();
	const settings = usePluginSettings(settingsStore);

	// 获取 communityPluginTabContainer 中的所有插件
	const installedPlugins = useMemo(() => {
		const communityPluginTabContainer =
			settingsStore.app.setting.communityPluginTabContainer;

		const pluginNavItems = communityPluginTabContainer.querySelectorAll(
			".vertical-tab-nav-item[data-setting-id]"
		) as NodeListOf<HTMLElement>;

		const plugins: Array<{
			id: string;
		}> = [];

		pluginNavItems.forEach((navItemEl) => {
			const pluginId = navItemEl.getAttribute("data-setting-id");
			if (!pluginId) return;

			// 检查是否存在原生图标（没有 custom-icon 类的）
			const nativeIcon = navItemEl.querySelector(
				".vertical-tab-nav-item-icon:not(.custom-icon)"
			);
			if (nativeIcon) return; // 如果是原生图标，跳过此插件

			const manifest = settingsStore.app.plugins.manifests[pluginId];
			if (manifest) {
				plugins.push({
					id: pluginId,
				});
			}
		});

		return plugins;
	}, [settingsStore.app.setting.communityPluginTabContainer]);

	return (
		<>
			{/* 默认图标设置 */}
			<SettingGroup>
				<SettingItem
					name={t("settings.communityPlugin.default.name")}
					desc={t("settings.communityPlugin.default.desc")}
					control={
						<>
							<ExtraButton
								icon="reset"
								tooltip="重置为默认"
								onClick={() => {
									settingsStore.updateSettingByPath(
										"communityPlugins.default",
										DEFAULT_SETTINGS.communityPlugins
											.default
									);
								}}
							/>
							<IconPicker
								app={settingsStore.app}
								value={settings.communityPlugins.default.icon}
								onChange={(value) => {
									settingsStore.updateSettingByPath(
										"communityPlugins.default.icon",
										value
									);
								}}
							/>
						</>
					}
				/>
			</SettingGroup>

			{/* 插件列表分组 */}
			<SettingGroup title={t("settings.communityPlugin.pluginList.name")}>
				{installedPlugins.map((plugin) => {
					const pluginIcon =
						settings.communityPlugins.data[plugin.id];

					return (
						<SettingItem
							key={plugin.id}
							name={plugin.id}
							control={
								<>
									<ExtraButton
										icon="reset"
										tooltip="重置图标"
										onClick={() => {
											settingsStore.deleteSettingByPath(
												`communityPlugins.data.${plugin.id}`
											);
										}}
									/>
									<IconPicker
										app={settingsStore.app}
										value={
											pluginIcon?.icon ||
											settings.communityPlugins.default
												.icon
										}
										onChange={(value) => {
											settingsStore.updateSettingByPath(
												`communityPlugins.data.${plugin.id}.id`,
												plugin.id
											);
											settingsStore.updateSettingByPath(
												`communityPlugins.data.${plugin.id}.icon`,
												value
											);
											settingsStore.updateSettingByPath(
												`communityPlugins.data.${plugin.id}.type`,
												settings.communityPlugins
													.default.type
											);
										}}
									/>
								</>
							}
						/>
					);
				})}
			</SettingGroup>
		</>
	);
};
