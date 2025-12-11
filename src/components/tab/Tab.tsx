import { Tabs } from "radix-ui";
import { FC, ReactNode } from "react";
import "./Tab.css";

export interface TabItem {
	id: string;
	title: string;
	content: ReactNode;
}

export interface TabProps {
	items: TabItem[];
	defaultValue?: string;
	orientation?: "horizontal" | "vertical";
	onChange?: (value: string) => void;
	className?: string;
}

export const Tab: FC<TabProps> = ({
	items,
	defaultValue,
	orientation = "horizontal",
	onChange,
	className = "",
}) => {
	const defaultTab = defaultValue || items[0]?.id;

	return (
		<Tabs.Root
			defaultValue={defaultTab}
			className={`CI__tab-group ${className}`}
			data-orientation={orientation}
			onValueChange={onChange}
		>
			<Tabs.List className="CI__tab-list" data-orientation={orientation}>
				{orientation === "vertical" && (
					<div className="CI__tab-resize-bar"></div>
				)}
				{items.map((item) => (
					<Tabs.Trigger
						key={item.id}
						value={item.id}
						className="CI__tab"
					>
						<span className="CI__tab-title">{item.title}</span>
					</Tabs.Trigger>
				))}
			</Tabs.List>

			<div className="CI__tab-panels">
				{items.map((item) => (
					<Tabs.Content
						key={item.id}
						value={item.id}
						className="CI__tab-panel"
					>
						{item.content}
					</Tabs.Content>
				))}
			</div>
		</Tabs.Root>
	);
};
