中文 | [English](https://github.com/RavenHogWarts/obsidian-custom-icons/blob/master/README.md)

# 自定义图标

通过为文档和文件夹设置可自定义的图标，增强您的工作空间美观及易用性。

[![GitHub stars](https://img.shields.io/github/stars/RavenHogWarts/obsidian-custom-icons?style=flat&label=星标)](https://github.com/RavenHogWarts/obsidian-custom-icons/stargazers)
[![Total Downloads](https://img.shields.io/github/downloads/RavenHogWarts/obsidian-custom-icons/total?style=flat&label=总下载量)](https://github.com/RavenHogWarts/obsidian-custom-icons/releases)
[![GitHub License](https://img.shields.io/github/license/RavenHogWarts/obsidian-custom-icons?style=flat&label=许可证)](https://github.com/RavenHogWarts/obsidian-custom-icons/blob/master/LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/RavenHogWarts/obsidian-custom-icons?style=flat&label=问题)](https://github.com/RavenHogWarts/obsidian-custom-icons/issues)
[![GitHub Last Commit](https://img.shields.io/github/last-commit/RavenHogWarts/obsidian-custom-icons?style=flat&label=最后提交)](https://github.com/RavenHogWarts/obsidian-custom-icons/commits/master)



## v1.0 重要公告：重制版与破坏性更新

本插件 **v1.0** 版本引入了**破坏性更新**，对插件进行了全面**重制**。

- **适配 Obsidian 1.11**：针对 Obsidian 1.11 版本新增的“设置页图标”功能，本插件现在支持**自定义设置页图标**。
- **未来规划**：1.0 版本之前的旧功能（依赖 CSS 实现的部分）计划在未来版本中通过新方法实现，并将不再支持通过 CSS 方式进行自定义。

请务必留意以避免配置失效，建议查看最新的使用文档。

## 使用

![Usage](attachment/Usage.ZH.png)


## 安装方法
### 社区插件市场安装

[点击安装](obsidian://show-plugin?id=custom-sidebar-icons)，或按以下步骤操作：

1. 打开 Obsidian 并前往 `设置 > 第三方插件`。
2. 搜索 “Custom Icons”。
3. 点击 “安装”。

### 手动安装

1. 下载最新版本
2. 将 `main.js`、`styles.css` 和 `manifest.json` 复制到你的仓库插件文件夹中：`<vault>/.obsidian/plugins/obsidian-custom-icons/`
3. 重新加载 Obsidian
4. 在设置 → 社区插件中启用插件

### BRAT（推荐给测试用户）

1. 安装 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 插件
2. 在 BRAT 设置中点击“添加测试插件”
3. 输入 `RavenHogWarts/obsidian-custom-icons`
4. 启用插件

## 开发指南

- 克隆此仓库
- 确保你的 NodeJS 版本至少为 v16 (`node --version`)
- 使用 `npm i` 或 `yarn` 安装依赖
- 使用 `npm run dev` 启动开发模式并进行实时编译
- 运行 `npm run build` 构建插件
- 运行 `npm run build:local` 构建插件并将其复制到您的 vault 插件文件夹（需要在项目根目录创建一个 `.env` 文件并添加：`VAULT_PATH=/path/to/your/vault`）
- 运行 `npm run version` 更新版本号并更新 manifest.json、version.json、package.json
- 运行 `npm run release` 构建插件并更新版本号

## 支持与帮助

如果你遇到任何问题或有建议：
- [在 GitHub 上提交问题](https://github.com/RavenHogWarts/obsidian-custom-icons/issues)
- [加入讨论](https://github.com/RavenHogWarts/obsidian-custom-icons/discussions) 提出问题或分享想法

如果你觉得这个插件对你有帮助，可以通过以下方式支持开发：
- 微信/支付宝：[二维码](https://s2.loli.net/2024/05/06/lWBj3ObszUXSV2f.png)

## 许可证

此项目基于 xxx LICENSE 许可 - 详情请参阅 [LICENSE](LICENSE) 文件。

## Star 历史

[![Star 历史图表](https://api.star-history.com/svg?repos=RavenHogWarts/obsidian-custom-icons&type=Timeline)](https://www.star-history.com/#RavenHogWarts/obsidian-custom-icons&Timeline)