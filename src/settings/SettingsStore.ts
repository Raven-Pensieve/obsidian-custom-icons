import CIPlugin from "@src/main";
import { DEFAULT_SETTINGS, IPluginSettings } from "@src/types/types";

export default class SettingsStore {
	#plugin: CIPlugin;
	#subscribers = new Set<() => void>();

	#store = {
		subscribe: (callback: () => void) => {
			this.#subscribers.add(callback);
			return () => this.#subscribers.delete(callback);
		},
		getSnapshot: (): IPluginSettings => this.#plugin.settings,
	};

	constructor(plugin: CIPlugin) {
		this.#plugin = plugin;
	}

	get settings() {
		return this.#plugin.settings;
	}

	get store() {
		return Object.assign({}, this.#store);
	}

	get plugin() {
		return this.#plugin;
	}

	get app() {
		return this.#plugin.app;
	}

	#notifyStoreSubscribers() {
		this.#subscribers.forEach((callback) => callback());
	}

	#mergeWithDefaults<T>(saved: unknown, defaults: T): T {
		if (
			defaults !== null &&
			typeof defaults === "object" &&
			!Array.isArray(defaults)
		) {
			const result: Record<string, unknown> = {};
			const defaultRecord = defaults as unknown as Record<
				string,
				unknown
			>;
			const savedRecord = (saved ?? {}) as Record<string, unknown>;

			// 遍历默认配置的键
			for (const key of Object.keys(defaultRecord)) {
				const defaultValue = defaultRecord[key];
				const savedValue = savedRecord[key];

				// 如果默认值是空对象，且 saved 中有该字段且是对象，直接使用 saved 的值
				if (
					typeof defaultValue === "object" &&
					defaultValue !== null &&
					!Array.isArray(defaultValue) &&
					Object.keys(defaultValue).length === 0 &&
					typeof savedValue === "object" &&
					savedValue !== null
				) {
					result[key] = savedValue;
				} else {
					result[key] = this.#mergeWithDefaults(
						savedValue,
						defaultValue
					);
				}
			}

			return result as unknown as T;
		}

		const isArrayDefault = Array.isArray(defaults as unknown);
		const isArraySaved = Array.isArray(saved as unknown);
		if (
			saved === undefined ||
			(typeof defaults !== typeof saved && !isArrayDefault) ||
			(isArrayDefault && !isArraySaved)
		) {
			return defaults;
		}
		return saved as T;
	}

	async loadSettings() {
		const saved = await this.#plugin.loadData();
		// 与默认配置深度对齐：只保留定义内字段并填充缺省
		this.#plugin.settings = this.#mergeWithDefaults(
			saved ?? {},
			DEFAULT_SETTINGS
		);
		await this.#plugin.saveSettings();
		this.#notifyStoreSubscribers();
	}

	async updateSettings(settings: IPluginSettings) {
		this.#plugin.settings = Object.assign({}, settings);
		await this.#plugin.saveSettings();
		this.#notifyStoreSubscribers();
	}

	/**
	 * 通过路径更新特定设置值
	 * @param path 设置路径
	 * @param value 新的设置值
	 */
	async updateSettingByPath<T>(path: string, value: T) {
		// 创建设置的深拷贝
		const newSettings = JSON.parse(JSON.stringify(this.#plugin.settings));
		const pathParts = path.split(".");
		let current: unknown = newSettings;

		// 遍历路径，找到父对象
		for (let i = 0; i < pathParts.length - 1; i++) {
			const part = pathParts[i];
			if (
				typeof current === "object" &&
				current !== null &&
				part in current
			) {
				current = (current as Record<string, unknown>)[part];
			} else {
				throw new Error(`Invalid setting path: ${path}`);
			}
		}

		// 设置最终值
		const finalPart = pathParts[pathParts.length - 1];
		if (
			typeof current === "object" &&
			current !== null &&
			finalPart in current
		) {
			(current as Record<string, unknown>)[finalPart] = value;
		} else {
			throw new Error(`Invalid setting path: ${path}`);
		}

		// 使用 updateSettings 方法更新设置
		await this.updateSettings(newSettings);
	}

	/**
	 * 通过路径删除特定设置值
	 * @param path 设置路径
	 */
	async deleteSettingByPath(path: string) {
		// 创建设置的深拷贝
		const newSettings = JSON.parse(JSON.stringify(this.#plugin.settings));
		const pathParts = path.split(".");
		let current: unknown = newSettings;

		// 遍历路径，找到父对象
		for (let i = 0; i < pathParts.length - 1; i++) {
			const part = pathParts[i];
			if (
				typeof current === "object" &&
				current !== null &&
				part in current
			) {
				current = (current as Record<string, unknown>)[part];
			} else {
				throw new Error(`Invalid setting path: ${path}`);
			}
		}

		// 删除最终属性
		const finalPart = pathParts[pathParts.length - 1];
		if (
			typeof current === "object" &&
			current !== null &&
			finalPart in current
		) {
			delete (current as Record<string, unknown>)[finalPart];
		} else {
			throw new Error(`Invalid setting path: ${path}`);
		}

		// 使用 updateSettings 方法更新设置
		await this.updateSettings(newSettings);
	}
}
