import { LL } from "@src/i18n/i18n";
import setIcon from "@src/util/setIcon";
import { setIcon as obsidianSetIcon } from "obsidian";
import { useEffect, useRef } from "react";
import "./IconCard.css";

interface IconCardProps {
	id: string;
	onDelete: (id: string) => void;
}

export const IconCard: React.FC<IconCardProps> = ({ id, onDelete }) => {
	const iconRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (iconRef.current) {
			try {
				setIcon(iconRef.current, "svg", id);
			} catch (e) {
				console.error("Failed to render icon", id, e);
			}
		}
	}, [id]);

	return (
		<div className="ci-lib-icon__card">
			<button
				className="ci-lib-icon__card-delete"
				onClick={(e) => {
					e.stopPropagation();
					onDelete(id);
				}}
				title={LL.view.CustomIconLib.delete()}
			>
				<div
					ref={(el) => {
						if (el && !el.hasChildNodes())
							obsidianSetIcon(el, "trash-2");
					}}
				></div>
			</button>

			<div ref={iconRef} className="ci-lib-icon__card-icon"></div>
			<div className="ci-lib-icon__card-name" aria-label={id}>
				{id}
			</div>
		</div>
	);
};
