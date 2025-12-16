import { IconPicker } from "@src/components/icon-picker/IconPicker";
import {
	ExtraButton,
	Search,
	SettingGroup,
	SettingItem,
	Toggle,
} from "@src/components/obsidian-setting";
import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import { t } from "@src/i18n/i18n";
import { DEFAULT_SETTINGS } from "@src/types/types";
import { FC, useMemo, useState } from "react";

export const CommunityPlugin: FC = () => {
	const settingsStore = useSettingsStore();
	const settings = usePluginSettings(settingsStore);
	const [searchQuery, setSearchQuery] = useState("");

	// 获取 communityPluginTabContainer 中的所有插件
	const installedPlugins = useMemo(() => {
		const communityPluginTabContainer =
			settingsStore.app.setting.communityPluginTabContainer;

		const pluginNavItems = communityPluginTabContainer.querySelectorAll(
			".vertical-tab-nav-item[data-setting-id]"
		) as NodeListOf<HTMLElement>;

		const plugins: Array<{
			id: string;
			name: string;
		}> = [];
		const seenIds = new Set<string>(); // 用于去重

		pluginNavItems.forEach((navItemEl) => {
			const pluginId = navItemEl.getAttribute("data-setting-id");
			if (!pluginId || seenIds.has(pluginId)) return; // 跳过空ID和重复ID

			// 检查是否存在原生图标（没有 custom-icon 类的）
			const nativeIcon = navItemEl.querySelector(
				".vertical-tab-nav-item-icon:not(.custom-icon)"
			);
			if (nativeIcon) return; // 如果是原生图标，跳过此插件

			const manifest = settingsStore.app.plugins.manifests[pluginId];
			if (manifest) {
				seenIds.add(pluginId); // 标记已处理
				plugins.push({
					id: pluginId,
					name: manifest.name,
				});
			}
		});

		// 按插件名称排序，确保顺序稳定
		return plugins.sort((a, b) => a.name.localeCompare(b.name));
	}, [settingsStore.app.plugins.manifests]);

	// 根据搜索查询过滤插件
	const filteredPlugins = useMemo(() => {
		if (!searchQuery.trim()) {
			return installedPlugins;
		}
		const query = searchQuery.toLowerCase();
		const filtered = installedPlugins.filter((plugin) => {
			return plugin.name.toLowerCase().includes(query);
		});
		// 过滤后仍然需要排序，确保顺序稳定
		return filtered.sort((a, b) => a.name.localeCompare(b.name));
	}, [installedPlugins, searchQuery]);

	return (
		<>
			{/* 默认图标设置 */}
			<SettingGroup>
				<SettingItem
					name={t("settings.communityPlugin.enable.name")}
					desc={t("settings.communityPlugin.enable.desc")}
					control={
						<>
							<Toggle
								value={settings.communityPlugins.enable}
								onChange={async (value) => {
									await settingsStore.updateSettingByPath(
										"communityPlugins.enable",
										value
									);
								}}
							/>
						</>
					}
				/>
				<SettingItem
					name={t("settings.communityPlugin.default.name")}
					desc={t("settings.communityPlugin.default.desc")}
					control={
						<>
							<ExtraButton
								icon="reset"
								tooltip="重置为默认"
								onClick={async () => {
									await settingsStore.updateSettingByPath(
										"communityPlugins.default",
										DEFAULT_SETTINGS.communityPlugins
											.default
									);
								}}
							/>
							<IconPicker
								app={settingsStore.app}
								value={settings.communityPlugins.default.icon}
								onChange={async (value) => {
									await settingsStore.updateSettingByPath(
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
				<SettingItem
					name={
						<Search
							value={searchQuery}
							onChange={(value) => setSearchQuery(value)}
							placeholder={t(
								"settings.communityPlugin.search.placeholder"
							)}
						/>
					}
				/>

				{filteredPlugins.length === 0 && searchQuery.trim() && (
					<SettingItem name="未找到匹配的插件" />
				)}

				{filteredPlugins.map((plugin, index) => {
					const pluginIcon =
						settings.communityPlugins.data[plugin.id];

					return (
						<SettingItem
							key={`${plugin.id}-${index}`}
							name={plugin.name}
							desc={plugin.id}
							control={
								<>
									<ExtraButton
										icon="reset"
										tooltip="重置图标"
										onClick={async () => {
											await settingsStore.deleteSettingByPath(
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
										onChange={async (value) => {
											await settingsStore.updateSettingByPath(
												`communityPlugins.data.${plugin.id}.id`,
												plugin.id
											);
											await settingsStore.updateSettingByPath(
												`communityPlugins.data.${plugin.id}.icon`,
												value
											);
											await settingsStore.updateSettingByPath(
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
