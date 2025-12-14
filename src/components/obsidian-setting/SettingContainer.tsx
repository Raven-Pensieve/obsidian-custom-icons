import { SettingContainerContext } from "@src/context/SettingContext";
import { ComponentProps, FC, ReactNode, useState } from "react";

export interface SettingContainerProps
	extends Omit<ComponentProps<"div">, "children"> {
	/**
	 * Children components (typically SettingItem components)
	 */
	children: ReactNode | ((containerEl: HTMLElement) => ReactNode);
}

/**
 * SettingContainer - Provides a container for SettingItem components
 *
 * @example
 * ```tsx
 * <SettingContainer>
 *   <SettingItem name="Setting 1" />
 *   <SettingItem name="Setting 2" />
 * </SettingContainer>
 * ```
 */
export const SettingContainer: FC<SettingContainerProps> = ({
	children,
	...props
}) => {
	const [containerEl, setContainerEl] = useState<HTMLElement | null>(null);

	return (
		<div ref={setContainerEl} {...props}>
			{containerEl && (
				<SettingContainerContext.Provider value={containerEl}>
					{typeof children === "function"
						? children(containerEl)
						: children}
				</SettingContainerContext.Provider>
			)}
		</div>
	);
};
