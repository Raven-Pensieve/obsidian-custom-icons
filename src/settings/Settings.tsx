import { Tab, TabItem } from "@src/components/tab/Tab";
import { LL } from "@src/i18n/i18n";
import { FC } from "react";
import { CommunityPlugin } from "./tabs/CommunityPlugin";

export const Settings: FC = () => {
	const tabItems: TabItem[] = [
		{
			id: "community-plugin",
			title: LL.settings.communityPlugin.name(),
			content: <CommunityPlugin />,
		},
	];

	return (
		<Tab
			items={tabItems}
			defaultValue="community-plugin"
			orientation="horizontal"
			className="NToc__settings-tabs"
		/>
	);
};
