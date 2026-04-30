import {
	ICommunityPluginIcon,
	ICommunityPluginIconOverride,
} from "@src/types/types";

export function normalizeIconColor(color?: string): string | undefined {
	const trimmed = color?.trim();
	return trimmed ? trimmed : undefined;
}

export function resolveCommunityPluginIcon(
	pluginId: string,
	defaultIcon: ICommunityPluginIcon,
	pluginIcon?: ICommunityPluginIconOverride,
): ICommunityPluginIcon {
	return {
		id: pluginId,
		icon: pluginIcon?.icon ?? defaultIcon.icon,
		type: pluginIcon?.type ?? defaultIcon.type,
		color:
			normalizeIconColor(pluginIcon?.color) ??
			normalizeIconColor(defaultIcon.color) ??
			"",
	};
}

export function normalizeCommunityPluginOverride(
	pluginId: string,
	defaultIcon: ICommunityPluginIcon,
	pluginIcon: ICommunityPluginIconOverride,
): ICommunityPluginIconOverride | null {
	const normalizedOverride: ICommunityPluginIconOverride = {
		id: pluginIcon.id || pluginId,
	};
	const normalizedDefaultColor = normalizeIconColor(defaultIcon.color);
	const normalizedColor = normalizeIconColor(pluginIcon.color);
	const hasIconOverride =
		pluginIcon.icon !== undefined || pluginIcon.type !== undefined;
	const matchesDefaultIcon =
		(pluginIcon.icon ?? defaultIcon.icon) === defaultIcon.icon &&
		(pluginIcon.type ?? defaultIcon.type) === defaultIcon.type;

	if (hasIconOverride && !matchesDefaultIcon) {
		normalizedOverride.icon = pluginIcon.icon ?? defaultIcon.icon;
		normalizedOverride.type = pluginIcon.type ?? defaultIcon.type;
	}

	if (normalizedColor && normalizedColor !== normalizedDefaultColor) {
		normalizedOverride.color = normalizedColor;
	}

	if (
		normalizedOverride.icon ||
		normalizedOverride.type ||
		normalizedOverride.color
	) {
		return normalizedOverride;
	}

	return null;
}
