# DSH-Transparent-frosted · 透明磨砂主题

<p>
  <img alt="version" src="https://img.shields.io/badge/version-1.0.0-6c8cff">
  <img alt="platform" src="https://img.shields.io/badge/dsh-web%20%7C%20windows%20%7C%20macos-14b8a6">
  <img alt="scope" src="https://img.shields.io/badge/scope-background%20layer%20only-8e8e93">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-3ddc84">
</p>

把 DeepSeek Harness 整个界面变成一块**透明磨砂玻璃**（深色主题下效果最佳——你的电脑桌面壁纸就是 DeepSeek Harness 的背景皮肤）：一条滑杆在"真模糊的磨砂"和"背景彻底消失"之间连续变化，整页所有区域、组件与展开面板作为**一张纸**一起移动；设置页另有独立滑杆，互不影响。

A transparent frosted-glass background for DeepSeek Harness. One slider takes the whole app from a genuinely blurred, milky frost to a fully cleared background — every region, control and expanded page moves as **a single sheet**. The settings page has its own independent slider.

> **深色主题下效果最佳**：磨砂层会把你的电脑桌面壁纸当作 DeepSeek Harness 的背景皮肤。
> **Best on a dark theme** — your desktop wallpaper becomes the background skin of DeepSeek Harness.

---

## 效果 · Screenshots

| 磨砂拉满 · Frost 100 % | 透明拉满 · Clear 100 % |
| :--: | :--: |
| ![frost](docs/frost.jpg) | ![clear](docs/clear.jpg) |
| 背景被真实模糊，只隐约透出轮廓 | 背景完全消失，只剩文字、图标与细边框 |

---

## 特性 · Features

- **一条滑杆，整体一致**：向左＝磨砂，向右＝透明。页面上**只有一个元素在涂色、也只有一个元素在模糊**，所以侧栏、会话区、右侧面板、抽屉、轨迹页、编队页、上下文页，以及它们内部的组件块，浓淡永远同步。
- **真模糊，不是假背景**：磨砂来自 `backdrop-filter` 对窗口背后画面的实时模糊（桌面端即你的壁纸），不是画一张假图。
- **只改背景层**：文字、图标、按钮、聚焦环、拖选、滚动条都不动，交互组件不会因为主题而失去可见性。
- **设置页独立**：设置面板有自己的滑杆、自己的底色与模糊；它不会跟着页面滑杆变，也不会反过来影响页面。
- **默认开启**，可一键关闭；关闭后立即恢复原生外观，不留样式、不留内联变量。
- **零依赖、零后台**：纯客户端模块，没有定时器、没有网络请求、没有额外 DOM。

---

## 兼容 · Compatibility

| 运行形态 | 支持 | 说明 |
| :-- | :--: | :-- |
| **dsh web**（浏览器打开） | ✅ | 浏览器背后没有桌面，插件会自绘一层暗色渐变作为背景，磨砂同样生效 |
| **dsh for Windows** | ✅ | 主窗口是 `transparent: true`，页面底色透明后直接透出桌面壁纸 |
| **dsh for macOS** | ✅ | 同上；窗口自身带 `vibrancy`，叠加磨砂后层次更深 |
| 浅色 / 深色主题 | ✅ | 按主题 token 取样，切换主题自动重算 |
| 窗口缩放、面板开合 | ✅ | `resize` 与 `MutationObserver` 增量校正 |

> 桌面端修改插件代码后需要**完全退出并重新启动**应用（客户端模块只在窗口创建时加载）；只刷新页面不会重新挂载。

---

## 安装 · Install

```bash
# 从本地目录安装（开发）
dsh plugin --profile <profile> add link:E:/AI-1/deepseek_space/DSH-Transparent-frosted
```

或在 **设置 → 内置插件 / 插件市场** 中安装后重启应用。安装完成后打开：

**设置 → 透明磨砂主题**，标题旁会显示当前版本号（`v1.0.0`）便于确认已加载。

---

## 使用 · Usage

| 控件 | 作用 |
| :-- | :-- |
| **启动透明磨砂主题** | 总开关，默认开启。关闭后下方两条滑杆与"恢复默认"一并置灰 |
| **页面背景透明磨砂度** | 0 %＝浓磨砂（背景被强模糊、隐约可见）→ 100 %＝全透明（背景不画任何东西） |
| **设置页透明磨砂度** | 只作用于设置面板，独立于页面滑杆 |
| **恢复默认** | 回到「开启 + 页面 72 % + 设置页 62 %」 |

数值换算（`frosty(v) = (100 − v) / 100`）：

| 图层 | 底色不透明度 | 模糊 |
| :-- | :-- | :-- |
| 页面 | `0.72 × frosty(page)` | `36 × frosty(page)` px |
| 设置页 | `0.35 + 0.37 × frosty(settings)` | `9 + 27 × frosty(settings)` px |
| 浮层（菜单 / 气泡 / 弹窗） | `clamp(pageAlpha + 0.18, 0.35, 1)` | 跟随页面 |
| 组件框（按钮 / 标签页 / 代码块 / 文件块） | 不涂色 | 不模糊 |

设置保存在 `localStorage` 的 `dsh-transparent-frosted-theme:settings:v1`（更早版本的键会自动迁移）。

---

## 实现 · How it works

1. **一层纸**：页面底色与模糊只挂在 `body::before`（`position:fixed` 的伪元素）上，它**不是任何滚动容器的祖先**——模糊若挂在滚动容器的祖先上，滚动会触发滤镜重采样，出现只在滚动瞬间可见的灰色区域。
2. **表面 token 全部清空**：`--dsw-alias-bg-base`、`--dsw-specific-sidebar-fill`、`--dsw-alias-bg-layer-1/2/3`、`bubble`、`input-major`、`selector`、`menu`、`settings-card-fill`、`code-block-banner` 在 `body` 上统一置为 `transparent`，任何列表行、chip、输入框都不会再叠一块自己的底色。
3. **组件框不画自己**：按钮 / 标签页 / 代码块 / 文件块只保留文字与描边，底色强制透明并禁用自身 `backdrop-filter`，因此 hover、active 也不会翻出原生底色。
4. **运行时打标**：`tagFlat()` 扫描 `body` 下的元素，凡覆盖 ≥3 % 视口、背景不透明度 ≥0.25、`z-index` 非负的元素，加 `data-dtg-page` 并强制透明，让它让位给那一层纸；判定**每个元素只算一次**，所以 hover / 滚动 / 重渲染都不会闪烁。新增节点由 `MutationObserver` 同步打标，展开页第一帧就是主题态。
5. **设置页独立**：设置面板由结构识别（自带 ≥3 个导航格的对话框）打 `data-dtg-settings`，只吃自己的变量，并把上面那批 token 在面板内部还原，所以它的卡片、列表行和当前模块高亮仍是原生观感。

自检（页面控制台）：

```js
__dtgTheme.current()                                   // 当前 settings
__dtgTheme.set({ page: 0 })                            // 磨砂端
__dtgTheme.set({ page: 100 })                          // 透明端
document.querySelectorAll('[data-dtg-page]').length     // 已摊平的页面容器数
```

---

## 目录 · Layout

```
DSH-Transparent-frosted/
├── package.json          # dsh 插件清单（bundle patch + client 入口）
├── cordis.patch.yml      # 把插件插入 dsh 组合
├── index.js              # 宿主侧入口（无需注册任何能力）
├── client.js             # 客户端主题引擎 + 设置页区块
├── icon.svg              # 无边框线条图标
├── locale/{zh,en}.json   # 插件市场文案
├── docs/{frost,clear}.jpg
└── README.md
```

---

## 卸载 · Uninstall

```bash
dsh plugin --profile <profile> remove @local/dsh-transparent-frosted
```

或在插件管理里禁用后重启。卸载会清理注入的 `<style>`、`data-dtg-*` 属性、`--dtg-*` 变量、`body` 上的表面色覆盖、所有运行时标记与监听器。

## License

MIT
