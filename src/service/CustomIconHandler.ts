import { addIcon, removeIcon } from "obsidian";
import { ICustomIconLib } from "../types/types";
import { AbstractIconHandler } from "../util/IconHandler";

export default class CustomIconHandler extends AbstractIconHandler<ICustomIconLib> {
	readonly id = "customIconLib";

	apply(): void {
		const svgIcons = this.settings?.svg || [];

		svgIcons.forEach((icon) => {
			if (icon.id && icon.content) {
				const id = icon.id.startsWith("CI-")
					? icon.id
					: `CI-${icon.id}`;
				addIcon(id, icon.content);
			}
		});
	}

	cleanup(): void {
		const svgIcons = this.settings?.svg || [];
		svgIcons.forEach((icon) => {
			if (icon.id) {
				const id = icon.id.startsWith("CI-")
					? icon.id
					: `CI-${icon.id}`;
				removeIcon(id);
			}
		});
	}

	isEnabled(): boolean {
		return true;
	}
}
