import { LL } from "@src/i18n/i18n";
import CIPlugin from "@src/main";
import { useState } from "react";
import { BaseModal } from "../modal/BaseModal";
import { Tab, TabItem } from "../tab/Tab";

interface AddSvgModalProps {
	title: string;
	onSubmit: (icons: Array<{ id: string; content: string }>) => Promise<void>;
}

interface AddSvgModalViewProps extends AddSvgModalProps {
	plugin: CIPlugin;
	onClose: () => void;
}

const AddSvgModalView: React.FC<AddSvgModalViewProps> = ({
	onSubmit,
	onClose,
}) => {
	const [activeTab, setActiveTab] = useState<"paste" | "upload">("paste");
	const [iconId, setIconId] = useState("");
	const [iconContent, setIconContent] = useState("");
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files) {
			setSelectedFiles(Array.from(files));
		}
	};

	const handleSubmit = async () => {
		if (activeTab === "paste") {
			// 粘贴模式：验证单个图标
			if (!iconId.trim() || !iconContent.trim()) {
				return;
			}
			await onSubmit([
				{ id: iconId.trim(), content: iconContent.trim() },
			]);
		} else {
			// 上传模式：批量处理文件
			if (selectedFiles.length === 0) {
				return;
			}

			const icons: Array<{ id: string; content: string }> = [];

			for (const file of selectedFiles) {
				const content = await file.text();
				// 使用文件名（去除 .svg 扩展名）作为 id
				const id = file.name.replace(/\.svg$/i, "");
				icons.push({ id, content });
			}

			await onSubmit(icons);
		}
	};

	const pasteTab = (
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

	const uploadTab = (
		<div className="ci-lib__form">
			<input
				className="ci-lib__form__input ci-lib-svg-upload-input"
				type="file"
				accept=".svg"
				multiple
				onChange={handleFileChange}
			/>
		</div>
	);

	const tabItems: TabItem[] = [
		{
			id: "paste",
			title: LL.view.CustomIconLib.svg.modal.pasteMode(),
			content: pasteTab,
		},
		{
			id: "upload",
			title: LL.view.CustomIconLib.svg.modal.uploadMode(),
			content: uploadTab,
		},
	];

	return (
		<>
			<Tab
				items={tabItems}
				defaultValue="paste"
				onChange={(value) => setActiveTab(value as "paste" | "upload")}
			/>
			<div className="ci-modal-button-container">
				<button className="mod-cta" onClick={handleSubmit}>
					{LL.common.add()}
				</button>
				<button onClick={onClose}>{LL.common.cancel()}</button>
			</div>
		</>
	);
};

export class AddSvgModal extends BaseModal<AddSvgModalViewProps> {
	constructor(plugin: CIPlugin, props: AddSvgModalProps) {
		const viewProps = {
			...props,
			plugin,
		};

		super(plugin, AddSvgModalView, viewProps, "");
	}
}
