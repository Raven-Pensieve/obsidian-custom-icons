import { LL } from "@src/i18n/i18n";
import { useEffect, useState } from "react";

interface EditSvgProps {
	iconId: string;
	iconContent: string;
	onSubmit: (iconId: string, iconContent: string) => Promise<void>;
	onReady?: (submit: () => Promise<void>, canSubmit: () => boolean) => void;
}

export const EditSvg: React.FC<EditSvgProps> = ({
	iconId: initialIconId,
	iconContent: initialIconContent,
	onSubmit,
	onReady,
}) => {
	const [iconId, setIconId] = useState(initialIconId);
	const [iconContent, setIconContent] = useState(initialIconContent);

	const canSubmit = () => {
		return iconId.trim() !== "" && iconContent.trim() !== "";
	};

	const handleSubmit = async () => {
		if (!iconId.trim() || !iconContent.trim()) {
			return;
		}
		await onSubmit(iconId.trim(), iconContent.trim());
	};

	useEffect(() => {
		if (onReady) {
			onReady(handleSubmit, canSubmit);
		}
	}, [iconId, iconContent]);

	return (
		<div className="ci-lib__form">
			<input
				className="ci-lib__form__input"
				type="text"
				placeholder={LL.view.CustomIconLib.svg.modal.idPlaceholder()}
				value={iconId}
				onChange={(e) => setIconId(e.target.value)}
			/>
			<textarea
				className="ci-lib__form__textarea"
				placeholder={LL.view.CustomIconLib.svg.modal.contentPlaceholder()}
				rows={10}
				value={iconContent}
				onChange={(e) => setIconContent(e.target.value)}
			/>
		</div>
	);
};
