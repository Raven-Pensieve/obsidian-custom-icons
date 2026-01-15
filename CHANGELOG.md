# [1.0.0](https://github.com/RavenHogWarts/obsidian-custom-icons/compare/1.0.0-beta.4...1.0.0) (2026-01-15)


### ♻️ Refactor

* 将图标逻辑内联到处理器类 (#45) ([351ecc7](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/351ecc7f76b458ef966fc14d66db27e85165be63)), closes [#45](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/45)
* **icon:** 统一 SVG 图标的 class 名称 (#49) ([df71555](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/df71555a3825a575463cbaec3c30dfc611a13312)), closes [#49](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/49)


### ✨ Features

* 优化 Lucide 图标测试与去重提取 (#43) ([0b86533](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/0b865335ba9edb58df4963c43e2b19cc77de0d91)), closes [#43](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/43)
* 增加随机图标功能 (#50) ([80fb973](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/80fb973efbeea028e524191ca0e9a74f801dd732)), closes [#50](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/50)
* **i18n:** 初始化 typesafe-i18n 支持并修正脚本导入 (#47) ([79bc277](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/79bc277ba2abbd6111c169afabb6e52c0cb5af9e)), closes [#47](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/47)


### 📝 Documentation

* update README and CONTRIBUTING texts (#51) ([7c73455](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/7c73455964c0e3c66238cf29d4c3b456aa485445)), closes [#51](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/51)


### 🔨 Chore

* 修改 FUNDING (#48) ([b59bac5](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/b59bac5c9211c623b1919da2e56fe2a70b8db141)), closes [#48](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/48)
* remove conventional-changelog related deps (#44) ([5c577a9](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/5c577a9f3b0dab88533f3461b90850f1a6d48326)), closes [#44](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/44)



# [1.0.0-beta.4](https://github.com/RavenHogWarts/obsidian-custom-icons/compare/1.0.0-beta.3...1.0.0-beta.4) (2025-12-16)


### ♻️ Refactor

* 调整插件加载顺序和初始化逻辑 (#40) ([e1fe645](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/e1fe64519682e435967c23b27e01f456d7017f8c)), closes [#40](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/40)


### ✨ Features

* 避免重复渲染并缓存图标状态 (#41) ([9479aad](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/9479aad977eefc454d7a41cf4c06da6519af2441)), closes [#41](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/41)



# [1.0.0-beta.3](https://github.com/RavenHogWarts/obsidian-custom-icons/compare/1.0.0-beta.2...1.0.0-beta.3) (2025-12-16)


### ✨ Features

* 抽离默认图标设置到独立分组 (#33) ([ae9814b](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/ae9814bf6f0e1d463c8bc7925c0a949f3a0ac849)), closes [#33](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/33)
* 引入图标管理器与处理器架构 (#35) ([b9a19eb](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/b9a19eb9b4adea1b094e3b1bccc8d95c332e468c)), closes [#35](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/35)
* 增加搜索筛选 (#37) ([5d92a9e](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/5d92a9e6603798f2f85f349ade50a785668c57d3)), closes [#37](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/37)
* 支持 lucide-react 图标并改进渲染逻辑 (#38) ([ab1886b](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/ab1886bb3031fd505841ae70baf4bc80efb1dad6)), closes [#38](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/38)
* 重构 Obsidian Setting 的 react 组件 (#32) ([47a9d59](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/47a9d599badd01b7be8a4cc67ffefc81367e7e56)), closes [#32](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/32)
* **settings:** 添加社区外掛启用开关及异步设置更新 (#34) ([daa390a](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/daa390a83154fd3a4838a4b107a99bcace4bc31b)), closes [#34](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/34)


### 🐛 Bug Fixes

* **setting:** 移除 Obsidian 设置项的 DOM 元素 (#36) ([9e6428b](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/9e6428b5466c22acecad236397c43d1ed71d36e4)), closes [#36](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/36)


### 🔨 Chore

* **deps:** 升级若干依赖以修复漏洞和保持兼容 (#31) ([2870bde](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/2870bdea9aee1cacff2956b981c27a9231284163)), closes [#31](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/31)



# [1.0.0-beta.2](https://github.com/RavenHogWarts/obsidian-custom-icons/compare/1.0.0-beta.1...1.0.0-beta.2) (2025-12-11)


### 🐛 Bug Fixes

* 修复设置存储与图标更新的异步和路径处理 (#29) ([df4bcb9](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/df4bcb9483410c32212b15e1f971fbdf26980f7f)), closes [#29](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/29)



# [1.0.0-beta.1](https://github.com/RavenHogWarts/obsidian-custom-icons/compare/0.6.3...1.0.0-beta.1) (2025-12-11)


### ✨ Features

* 注释掉 manageLeaf 框架，便于后续实现 ([591e656](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/591e6566c1671e1a758987ed4c98305fab1ddc8a))


### 🐛 Bug Fixes

* BREAKING CHANGE (#25) ([663aad1](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/663aad1e5d097a51669f8d5ec36c8f881daf2a75)), closes [#25](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/25)


### 🔨 Chore

* Add manifest-beta.json for custom sidebar icons ([2151799](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/2151799f1e9ab86d64e48540e8dddc962f1f8aaf))
* **release:** 更新发布工作流并添加赞助信息 (#24) ([8162c2a](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/8162c2a032fd294a13d022107996753f8800167d)), closes [#24](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/24)



