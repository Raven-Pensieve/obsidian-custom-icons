# Contribution Guidelines English Version

Thank you for your interest in contributing to Obsidian Custom Icons! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Contribution Guidelines English Version](#contribution-guidelines-english-version)
  - [Table of Contents](#table-of-contents)
  - [Code of Conduct](#code-of-conduct)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Setup Steps](#setup-steps)
  - [Development Workflow](#development-workflow)
  - [Pull Request Process](#pull-request-process)
  - [Coding Standards](#coding-standards)
  - [Internationalization (i18n) Guidelines](#internationalization-i18n-guidelines)
  - [Commit Guidelines](#commit-guidelines)
  - [Reporting Bugs](#reporting-bugs)
  - [Feature Requests](#feature-requests)
- [贡献指南中文版本](#贡献指南中文版本)
  - [目录](#目录)
  - [行为准则](#行为准则)
  - [入门指南](#入门指南)
    - [前置要求](#前置要求)
    - [设置步骤](#设置步骤)
  - [开发工作流程](#开发工作流程)
  - [拉取请求流程](#拉取请求流程)
  - [编码标准](#编码标准)
  - [国际化 (i18n) 指南](#国际化-i18n-指南)
  - [提交指南](#提交指南)
  - [报告错误](#报告错误)
  - [功能请求](#功能请求)

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- **Node.js**: Version 18.x or higher (as specified in package.json engines)
- **npm**: Latest version recommended
- **Git**: For version control

### Setup Steps

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
   ```bash
   git clone https://github.com/RavenHogWarts/obsidian-custom-icons.git
   cd obsidian-custom-icons
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Set up development environment**
   - Create a `.env` file following the example in `.env.example`
   - For local testing with Obsidian, you can use the build:local script
    ```.env.example
    VAULT_PATH=/path/to/your/vault
    ```

## Development Workflow

1. **Create a branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
   or
   ```bash
   git checkout -b fix/issue-you-are-fixing
   ```

2. **Make your changes** and test them thoroughly

3. **Available development commands**:
   - **Start development server**: `npm run dev` (watches for changes)
   - **Build for production**: `npm run build`
   - **Build and copy to vault**: `npm run build:local`
   - **Run tests**: `npm run test` or `npm run test:watch` (watch mode)
   - **Check code quality**: `npm run lint`
   - **Fix linting issues**: `npm run lint:fix`

4. **For internationalization work**:
   - **Generate type-safe i18n**: `npm run i18n:typesafe`
   - **Sync i18n files**: `npm run i18n:sync`

5. **Commit your changes** following our [commit guidelines](#commit-guidelines)

## Pull Request Process

1. **Update documentation** if necessary
2. **Ensure tests pass**:
   ```bash
   npm run test
   ```
3. **Make sure your code lints** without errors (no-explicit-any / no-unused-vars / no-non-null-assertion can be ignored):
   ```bash
   npm run lint
   ```
4. **Build the project** successfully:
   ```bash
   npm run build
   ```
5. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Create a Pull Request** against the `master` branch of the original repository
7. **Describe your changes** in detail, referencing any related issues

## Coding Standards

- Follow the existing code style in the project
- Use TypeScript for type safety
- Document your code with appropriate comments
- Write clear, descriptive variable and function names
- Fix any linting errors before submitting (no-explicit-any / no-unused-vars / no-non-null-assertion can be ignored):
  ```bash
  npm run lint:fix
  ```

## Internationalization (i18n) Guidelines

This project supports multiple languages. When contributing:

1. **Adding new translatable strings**:
   - Add new keys to `src/i18n/en/index.ts` first
   - Use descriptive key names that reflect the content
   - Follow the existing key naming conventions

2. **Working with translations**:
   - After adding new English strings, run:
     ```bash
     npm run i18n:typesafe
     ```
   - This generates type-safe i18n interfaces
   - Then sync translations to other languages:
     ```bash
     npm run i18n:sync
     ```

3. **Adding new languages**:
   - Create a new folder under `src/i18n/` with the language code
   - Add an `index.ts` file with all translations
   - Update the i18n configuration if needed

4. **Translation guidelines**:
   - Keep translations concise and context-appropriate
   - Consider cultural differences in your translations
   - Test the UI with longer translations to ensure layout compatibility

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Common types include:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to the build process or auxiliary tools

You can use our commitizen setup to help format commits correctly:
```bash
git add .
npx cz
```

## Reporting Bugs

When reporting bugs, please include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Your environment (OS, Obsidian version, plugin version)

## Feature Requests

Feature requests are welcome. Please provide:

- A clear description of the feature
- Why this feature would be beneficial
- Any implementation ideas you might have

---

# 贡献指南中文版本

感谢您有兴趣为 Obsidian Sample Plugin 做出贡献！本文档提供了为该项目做出贡献的指南和说明。

## 目录

- [行为准则](#行为准则)
- [入门指南](#入门指南)
- [开发工作流程](#开发工作流程)
- [拉取请求流程](#拉取请求流程)
- [编码标准](#编码标准)
- [提交指南](#提交指南)
- [报告错误](#报告错误)
- [功能请求](#功能请求)

## 行为准则

通过参与此项目，您应当遵守我们的行为准则：

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

## 入门指南

### 前置要求

- **Node.js**: 18.x 或更高版本（如 package.json 中 engines 所指定）
- **npm**: 建议使用最新版本
- **Git**: 用于版本控制

### 设置步骤

1. **在 GitHub 上 Fork 仓库**
2. **在本地克隆您的 Fork**
   ```bash
   git clone https://github.com/RavenHogwarts/obsidian-custom-icons.git
   cd obsidian-custom-icons
   ```
3. **安装依赖**
   ```bash
   npm install
   ```
4. **设置开发环境**
   - 按照 `.env.example`的示例创建 `.env` 文件
   - 对于与 Obsidian 的本地测试，您可以使用 build:local 脚本
    ```.env.example
    VAULT_PATH=/path/to/your/vault
    ```

## 开发工作流程

1. **为您的功能或错误修复创建分支**：
   ```bash
   git checkout -b feature/您的功能名称
   ```
   或
   ```bash
   git checkout -b fix/您要修复的问题
   ```

2. **进行更改** 并彻底测试

3. **可用的开发命令**：
   - **启动开发服务器**: `npm run dev` (监听文件变化)
   - **生产环境构建**: `npm run build`
   - **构建并复制到 vault**: `npm run build:local`
   - **运行测试**: `npm run test` 或 `npm run test:watch` (监听模式)
   - **检查代码质量**: `npm run lint`
   - **修复 lint 问题**: `npm run lint:fix`

4. **国际化相关工作**：
   - **生成类型安全的 i18n**: `npm run i18n:typesafe`
   - **同步 i18n 文件**: `npm run i18n:sync`

5. **提交您的更改**，遵循我们的[提交指南](#提交指南)

## 拉取请求流程

1. **必要时更新文档**
2. **确保测试通过**：
   ```bash
   npm run test
   ```
3. **确保您的代码没有 lint 错误**（no-explicit-any / no-unused-vars / no-non-null-assertion 可以忽略）：
   ```bash
   npm run lint
   ```
4. **成功构建项目**：
   ```bash
   npm run build
   ```
5. **将您的分支推送**到您的 Fork：
   ```bash
   git push origin feature/您的功能名称
   ```
6. **对原始仓库的 `master` 分支创建拉取请求**
7. **详细描述您的更改**，引用任何相关问题

## 编码标准

- 遵循项目中现有的代码风格
- 使用 TypeScript 确保类型安全
- 用适当的注释记录您的代码
- 编写清晰、描述性的变量和函数名
- 在提交前修复任何 lint 错误（no-explicit-any / no-unused-vars / no-non-null-assertion 可以忽略）：
  ```bash
  npm run lint:fix
  ```

## 国际化 (i18n) 指南

本项目支持多种语言。贡献时请注意：

1. **添加新的可翻译字符串**：
   - 首先在 `src/i18n/en/index.ts` 中添加新键值
   - 使用能反映内容的描述性键名
   - 遵循现有的键名命名规范

2. **处理翻译**：
   - 添加新的英文字符串后，运行：
     ```bash
     npm run i18n:typesafe
     ```
   - 这将生成类型安全的 i18n 接口
   - 然后同步翻译到其他语言：
     ```bash
     npm run i18n:sync
     ```

3. **添加新语言**：
   - 在 `src/i18n/` 下创建语言代码文件夹
   - 添加包含所有翻译的 `index.ts` 文件
   - 如需要，更新 i18n 配置

4. **翻译指南**：
   - 保持翻译简洁且符合上下文
   - 考虑翻译中的文化差异
   - 用较长的翻译测试 UI 以确保布局兼容性

## 提交指南

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 作为提交消息规范：

```
<类型>(<范围>): <描述>

[可选的正文]

[可选的页脚]
```

常见类型包括：
- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档变更
- `style`: 代码风格变更（格式化等）
- `refactor`: 既不修复错误也不添加功能的代码变更
- `perf`: 性能改进
- `test`: 添加或更新测试
- `chore`: 构建过程或辅助工具的变更

## 报告错误

报告错误时，请包括：

- 清晰、描述性的标题
- 重现问题的步骤
- 预期行为
- 实际行为
- 截图（如适用）
- 您的环境（操作系统、Obsidian 版本、插件版本）

## 功能请求

欢迎功能请求。请提供：

- 功能的清晰描述
- 为什么这个功能会有益
- 您可能有的任何实现想法
