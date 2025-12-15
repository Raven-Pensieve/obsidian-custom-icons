import { App } from "obsidian";

/**
 * 图标处理器接口
 * 所有图标替换功能都应实现此接口
 */
export interface IIconHandler<T> {
	/**
	 * 处理器的唯一标识符
	 */
	readonly id: string;

	/**
	 * 初始化处理器
	 * @param app Obsidian App 实例
	 * @param settings 该处理器的配置
	 */
	initialize(app: App, settings: T): void;

	/**
	 * 应用图标替换
	 * 根据配置替换相应位置的图标
	 */
	apply(): void;

	/**
	 * 清理处理器资源
	 * 在插件卸载或处理器禁用时调用
	 */
	cleanup(): void;

	/**
	 * 检查处理器是否已启用
	 */
	isEnabled(): boolean;
}

/**
 * 抽象图标处理器基类
 * 提供通用的实现逻辑
 */
export abstract class AbstractIconHandler<T> implements IIconHandler<T> {
	protected app!: App;
	protected settings!: T;

	abstract readonly id: string;

	initialize(app: App, settings: T): void {
		this.app = app;
		this.settings = settings;
	}

	abstract apply(): void;
	abstract cleanup(): void;
	abstract isEnabled(): boolean;
}
