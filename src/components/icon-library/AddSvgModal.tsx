import { LL } from "@src/i18n/i18n";
import { App, Modal } from "obsidian";
import React, { useState } from "react";
import { createRoot, Root } from "react-dom/client";
import "./AddSvgModal.css";

interface AddSvgModalProps {
	app: App;
	onSubmit: (icons: Array<{ id: string; content: string }>) => Promise<void>;
}

export class AddSvgModal extends Modal {
	private root: Root | null = null;
	private onSubmit: (
		icons: Array<{ id: string; content: string }>,
	) => Promise<void>;

	constructor(
		app: App,
		onSubmit: (
			icons: Array<{ id: string; content: string }>,
		) => Promise<void>,
	) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("ci-add-svg-modal");

		this.root = createRoot(contentEl);
		this.root.render(
			<AddSvgModalContent
				onSubmit={async (icons) => {
					await this.onSubmit(icons);
					this.close();
				}}
				onCancel={() => this.close()}
			/>,
		);
	}

	onClose() {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
		const { contentEl } = this;
		contentEl.empty();
	}
}

interface AddSvgModalContentProps {
	onSubmit: (icons: Array<{ id: string; content: string }>) => Promise<void>;
	onCancel: () => void;
}

const AddSvgModalContent: React.FC<AddSvgModalContentProps> = ({
	onSubmit,
	onCancel,
}) => {
	const [mode, setMode] = useState<"paste" | "upload">("paste");
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
		if (mode === "paste") {
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

	return (
		<div className="ci-add-svg-modal__content">
			<h2>{LL.view.CustomIconLib.svg.addModal.title()}</h2>

			{/* 模式切换 */}
			<div className="ci-add-svg-modal__tabs">
				<button
					className={`ci-add-svg-modal__tab ${mode === "paste" ? "is-active" : ""}`}
					onClick={() => setMode("paste")}
				>
					{LL.view.CustomIconLib.svg.addModal.pasteMode()}
				</button>
				<button
					className={`ci-add-svg-modal__tab ${mode === "upload" ? "is-active" : ""}`}
					onClick={() => setMode("upload")}
				>
					{LL.view.CustomIconLib.svg.addModal.uploadMode()}
				</button>
			</div>

			{/* 粘贴模式 */}
			{mode === "paste" && (
				<div className="ci-add-svg-modal__paste-form">
					<div className="setting-item">
						<div className="setting-item-info">
							<div className="setting-item-name">
								{LL.view.CustomIconLib.svg.addForm.idPlaceholder()}
							</div>
						</div>
						<div className="setting-item-control">
							<input
								type="text"
								placeholder={LL.view.CustomIconLib.svg.addForm.idPlaceholder()}
								value={iconId}
								onChange={(e) => setIconId(e.target.value)}
							/>
						</div>
					</div>

					<div className="setting-item">
						<div className="setting-item-info">
							<div className="setting-item-name">
								{LL.view.CustomIconLib.svg.addForm.contentPlaceholder()}
							</div>
						</div>
						<div className="setting-item-control">
							<textarea
								placeholder={LL.view.CustomIconLib.svg.addForm.contentPlaceholder()}
								rows={10}
								value={iconContent}
								onChange={(e) => setIconContent(e.target.value)}
							/>
						</div>
					</div>
				</div>
			)}

			{/* 上传模式 */}
			{mode === "upload" && (
				<div className="ci-add-svg-modal__upload-form">
					<div className="setting-item">
						<div className="setting-item-info">
							<div className="setting-item-name">
								{LL.view.CustomIconLib.svg.addModal.selectFiles()}
							</div>
							<div className="setting-item-description">
								{LL.view.CustomIconLib.svg.addModal.selectFilesDesc()}
							</div>
						</div>
						<div className="setting-item-control">
							<input
								type="file"
								accept=".svg"
								multiple
								onChange={handleFileChange}
							/>
						</div>
					</div>

					{selectedFiles.length > 0 && (
						<div className="ci-add-svg-modal__file-list">
							<div className="setting-item-name">
								{LL.view.CustomIconLib.svg.addModal.selectedFiles(
									{
										count: selectedFiles.length,
									},
								)}
							</div>
							<ul>
								{selectedFiles.map((file, index) => (
									<li key={index}>
										{file.name.replace(/\.svg$/i, "")}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}

			{/* 按钮 */}
			<div className="modal-button-container">
				<button className="mod-cta" onClick={handleSubmit}>
					{LL.view.CustomIconLib.add()}
				</button>
				<button onClick={onCancel}>
					{LL.view.CustomIconLib.cancel()}
				</button>
			</div>
		</div>
	);
};
