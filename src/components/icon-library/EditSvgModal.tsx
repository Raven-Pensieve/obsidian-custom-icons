import { LL } from "@src/i18n/i18n";
import CIPlugin from "@src/main";
import { useState } from "react";
import { BaseModal } from "../modal/BaseModal";

interface EditSvgModalProps {
	title: string;
	iconId: string;
	iconContent: string;
	onSubmit: (iconId: string, iconContent: string) => Promise<void>;
}

interface EditSvgModalViewProps extends EditSvgModalProps {
	plugin: CIPlugin;
	onClose: () => void;
}

const EditSvgModalView: React.FC<EditSvgModalViewProps> = ({
	iconId: initialIconId,
	iconContent: initialIconContent,
	onSubmit,
	onClose,
}) => {
	const [iconId, setIconId] = useState(initialIconId);
	const [iconContent, setIconContent] = useState(initialIconContent);

	const handleSubmit = async () => {
		if (!iconId.trim() || !iconContent.trim()) {
			return;
		}
		await onSubmit(iconId.trim(), iconContent.trim());
		onClose();
	};

	return (
		<>
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
			<div className="ci-modal-button-container">
				<button
					className="mod-cta"
					onClick={handleSubmit}
					disabled={!iconId.trim() || !iconContent.trim()}
				>
					{LL.common.save()}
				</button>
				<button onClick={onClose}>{LL.common.cancel()}</button>
			</div>
		</>
	);
};

export class EditSvgModal extends BaseModal<EditSvgModalViewProps> {
	constructor(plugin: CIPlugin, props: EditSvgModalProps) {
		const viewProps = {
			...props,
			plugin,
		};

		super(plugin, EditSvgModalView, viewProps, "");
	}
}
