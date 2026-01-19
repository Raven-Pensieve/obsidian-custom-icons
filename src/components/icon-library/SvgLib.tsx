import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import { LL } from "@src/i18n/i18n";
import { CirclePlus } from "lucide-react";
import { setIcon } from "obsidian";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconCard } from "../icon-card/IconCard";
import { AddSvgModal } from "./AddSvgModal";
import { EditSvgModal } from "./EditSvgModal";

export const SvgLib: React.FC = () => {
	const store = useSettingsStore();
	const settings = usePluginSettings(store);
	const { app } = store;

	// Local State
	const [searchQuery, setSearchQuery] = useState("");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const sortButtonRef = useRef<HTMLButtonElement>(null);

	// Filter and Sort Icons
	const filteredIcons = useMemo(() => {
		const icons = [...settings.customIconLib.svg]; // Shallow copy

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			// In-place filtering not possible on readonly store array if we want to be safe, so filtering new array
			// But wait, filter returns new array.
		}

		const result = icons.filter(
			(icon) =>
				!searchQuery ||
				icon.id.toLowerCase().includes(searchQuery.toLowerCase()),
		);

		result.sort((a, b) => {
			return sortOrder === "asc"
				? a.id.localeCompare(b.id)
				: b.id.localeCompare(a.id);
		});

		return result;
	}, [settings.customIconLib.svg, searchQuery, sortOrder]);

	// Update sort button icon when sortOrder changes
	useEffect(() => {
		if (sortButtonRef.current) {
			sortButtonRef.current.empty();
			const iconName =
				sortOrder === "asc" ? "arrow-up-az" : "arrow-up-za";
			setIcon(sortButtonRef.current, iconName);
		}
	}, [sortOrder]);

	// Handlers
	const handleToggleSort = () => {
		setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
	};

	const handleSubmit = async (
		icons: Array<{ id: string; content: string }>,
	) => {
		const currentSvgIcons = settings.customIconLib.svg;
		const newIcons = icons.filter(
			(icon) =>
				!currentSvgIcons.some((existing) => existing.id === icon.id),
		);

		if (newIcons.length === 0) {
			return;
		}

		const newSvgIcons = [...currentSvgIcons, ...newIcons];
		await store.updateSettingByPath("customIconLib.svg", newSvgIcons);
	};

	const handleOpenAddModal = () => {
		new AddSvgModal(store.plugin, {
			title: LL.common.add() + " " + LL.view.CustomIconLib.svg.tabName(),
			onSubmit: handleSubmit,
		}).open();
	};

	const handleDeleteIcon = async (iconId: string) => {
		const currentSvgIcons = settings.customIconLib.svg;
		const newSvgIcons = currentSvgIcons.filter(
			(icon) => icon.id !== iconId,
		);
		await store.updateSettingByPath("customIconLib.svg", newSvgIcons);
	};

	const handleEditIcon = async (
		iconId: string,
		newIconId: string,
		newIconContent: string,
	) => {
		const currentSvgIcons = settings.customIconLib.svg;
		const iconIndex = currentSvgIcons.findIndex(
			(icon) => icon.id === iconId,
		);

		if (iconIndex === -1) {
			return;
		}

		const newSvgIcons = [...currentSvgIcons];
		newSvgIcons[iconIndex] = {
			id: newIconId,
			content: newIconContent,
		};

		await store.updateSettingByPath("customIconLib.svg", newSvgIcons);
	};

	const handleOpenEditModal = async (iconId: string) => {
		const icon = settings.customIconLib.svg.find(
			(icon) => icon.id === iconId,
		);
		if (!icon) {
			return;
		}

		new EditSvgModal(store.plugin, {
			title: LL.common.edit() + " " + LL.view.CustomIconLib.svg.tabName(),
			iconId: icon.id,
			iconContent: icon.content,
			onSubmit: (newIconId, newIconContent) =>
				handleEditIcon(iconId, newIconId, newIconContent),
		}).open();
	};

	return (
		<div className="ci-lib-container">
			{/* Navigation Bar */}
			<div className="ci-lib__toolbar">
				<div className="ci-lib__search">
					<input
						type="search"
						placeholder={LL.view.CustomIconLib.searchPlaceholder()}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>

				<button
					ref={sortButtonRef}
					onClick={handleToggleSort}
					aria-label={sortOrder === "asc" ? "A-Z" : "Z-A"}
				/>

				<button onClick={handleOpenAddModal}>
					<CirclePlus className="svg-icon" />
				</button>
			</div>

			{/* Icon Grid */}
			<div className="ci-lib__grid">
				{filteredIcons.map((icon) => (
					<IconCard
						key={icon.id}
						id={icon.id}
						onDelete={handleDeleteIcon}
						onEdit={handleOpenEditModal}
					/>
				))}
			</div>
		</div>
	);
};
