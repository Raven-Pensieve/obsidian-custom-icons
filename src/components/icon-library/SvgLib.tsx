import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import { LL } from "@src/i18n/i18n";
import React, { useMemo, useState } from "react";
import { IconCard } from "../icon-card/IconCard";

export const SvgLib: React.FC = () => {
	const store = useSettingsStore();
	const settings = usePluginSettings(store);

	// Local State
	const [searchQuery, setSearchQuery] = useState("");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [isAddMode, setIsAddMode] = useState(false);

	// Add Form State
	const [newIconId, setNewIconId] = useState("");
	const [newIconContent, setNewIconContent] = useState("");

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

	// Handlers
	const handleAddIcon = async () => {
		if (!newIconId.trim() || !newIconContent.trim()) {
			return;
		}

		const currentSvgIcons = settings.customIconLib.svg;
		if (currentSvgIcons.some((icon) => icon.id === newIconId)) {
			return;
		}

		const newSvgIcons = [
			...currentSvgIcons,
			{ id: newIconId, content: newIconContent },
		];
		await store.updateSettingByPath("customIconLib.svg", newSvgIcons);

		setNewIconId("");
		setNewIconContent("");
		setIsAddMode(false);
	};

	const handleDeleteIcon = async (iconId: string) => {
		const currentSvgIcons = settings.customIconLib.svg;
		const newSvgIcons = currentSvgIcons.filter(
			(icon) => icon.id !== iconId,
		);
		await store.updateSettingByPath("customIconLib.svg", newSvgIcons);
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

				<select
					value={sortOrder}
					onChange={(e) =>
						setSortOrder(e.target.value as "asc" | "desc")
					}
					className="dropdown"
				>
					<option value="asc">A-Z</option>
					<option value="desc">Z-A</option>
				</select>

				<button onClick={() => setIsAddMode(!isAddMode)}>
					{isAddMode
						? LL.view.CustomIconLib.cancel()
						: LL.view.CustomIconLib.add()}
				</button>
			</div>

			{/* Add Form */}
			{isAddMode && (
				<div className="ci-lib__add-form">
					<input
						className="ci-lib__add-form__input"
						type="text"
						placeholder={LL.view.CustomIconLib.svg.addForm.idPlaceholder()}
						value={newIconId}
						onChange={(e) => setNewIconId(e.target.value)}
					/>
					<textarea
						className="ci-lib__add-form__textarea"
						placeholder={LL.view.CustomIconLib.svg.addForm.contentPlaceholder()}
						rows={5}
						value={newIconContent}
						onChange={(e) => setNewIconContent(e.target.value)}
					/>
					<div className="ci-lib__add-form__buttons">
						<button className="mod-cta" onClick={handleAddIcon}>
							{LL.view.CustomIconLib.add()}
						</button>
					</div>
				</div>
			)}

			{/* Icon Grid */}
			<div className="ci-lib__grid">
				{filteredIcons.map((icon) => (
					<IconCard
						key={icon.id}
						id={icon.id}
						onDelete={handleDeleteIcon}
					/>
				))}
			</div>
		</div>
	);
};
