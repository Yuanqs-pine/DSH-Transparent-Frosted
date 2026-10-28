# DSH-Transparent-Frosted · 透明磨砂主题

<p>
  <img alt="version" src="https://img.shields.io/badge/version-1.0.1-6c8cff">
  <img alt="platform" src="https://img.shields.io/badge/dsh-desktop%20%7C%20web-14b8a6">
  <img alt="scope" src="https://img.shields.io/badge/scope-background%20layer%20only-8e8e93">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-3ddc84">
</p>

把 DeepSeek Harness 变成一整块透明磨砂玻璃：一条滑杆在"真模糊的磨砂"与"背景彻底消失"之间连续过渡，整页所有区域、组件、展开面板作为**一张纸**一起变化；设置页有独立滑杆，互不干扰。

A transparent frosted-glass background for DeepSeek Harness. One slider moves the whole app between a genuinely blurred frost and a fully cleared background — every region, control and expanded page moves as **a single sheet**. The settings page keeps its own slider.

> 深色主题下效果最佳 —— 你的电脑桌面壁纸就是 DeepSeek Harness 的背景皮肤。
> Best on a dark theme: your desktop wallpaper becomes the background skin.

| 浓磨砂 | 全透明 |
|---|---|
| ![frost](docs/frost.jpg) | ![clear](docs/clear.jpg) |

![particles](docs/particles.png)

## 安装

只支持 **本地目录** 安装，不走 npm、不走插件市场。

**桌面端**

1. 下载或 `git clone` 本仓库到本地；
2. **设置 → 插件 → 安装本地插件**，选中该目录（会自动登记 bundle 并启用）；
3. **完全退出并重新启动** DeepSeek Harness —— 前端代码只在窗口创建时加载，热刷新无效。

命令行等价做法（两步都要）：

```bash
git clone https://github.com/Yuanqs-pine/DSH-Transparent-Frosted.git
dsh plugin --profile desktop add link:E:/path/to/DSH-Transparent-Frosted
```

再把 `dsh-transparent-frosted` 加进 `~/.dsh/profiles/desktop/package.json` 的 `dsh.profile.bundles` 数组。

**Web 端**

1. 同上安装，但 profile 换成 `web`；
2. 启动并打开浏览器：

```bash
dsh plugin --profile web add link:E:/path/to/DSH-Transparent-Frosted
dsh --profile web web --port 8080
```

3. 浏览器打开 `http://127.0.0.1:8080`，在 **设置 → 插件** 启用后刷新页面。

Web 端没有桌面壁纸，插件会自绘一层深色渐变作为磨砂底。

## 使用

**设置 → 透明磨砂主题**

| 控件 | 说明 |
|---|---|
| 启动透明磨砂主题 | 总开关，关闭后立即恢复原生外观，粒子与滑杆一并失效 |
| 页面背景透明磨砂度 | 左＝浓磨砂，右＝全透明；整页作为一张纸一起变 |
| 设置页透明磨砂度 | 只影响设置页，与页面互不干扰 |
| 粒子效果 | 对话区中央的鲸鱼粒子，可单独关闭 |
| 恢复默认 | 回到 页面 72% / 设置页 62% |

粒子支持鼠标交互：悬停推开、按住拖动带走、松开后自然回落到鲸鱼轮廓。

## 兼容

| 平台 | 状态 |
|---|---|
| Windows 桌面端 | ✅ |
| macOS 桌面端 | ✅ |
| Web（Chrome / Edge） | ✅ |
| 深色 / 浅色主题 | ✅ |

## 原理（三句话）

1. 页面底色与 `backdrop-filter` 只存在于 `body::before` 一处，整页只有一个上色层、一个模糊层，所以不会有区域各自磨砂。
2. 主题的九个表面色 token 被清成 `transparent`，卡片、输入框、按钮都不再自己涂色；设置页把 token 原值还原，因此保持独立。
3. 其它插件打开的整页面板由运行时几何探测识别并透明化，透出的仍是同一层页面底色。

自检（开发者）：`__dtgTheme.current()` / `__dtgTheme.set({ page: 0 })` / `__dtgTheme.rescan()`。

## 版本差异

| 版本 | 内容 |
|---|---|
| **v1.0.0** | 基线：单层页面磨砂 + 设置页独立滑杆、总开关、线稿图标、桌面端 / Web 双平台适配 |
| **v1.0.1** | 鲸鱼粒子（可关闭，带悬停推开 / 拖拽带走的指针物理）；开关改为单胶囊样式、行距对齐设置页；关闭总开关时自动卸载粒子图层 |

回退基线：`git checkout v1.0.0`

## 卸载

```bash
dsh plugin --profile desktop remove dsh-transparent-frosted
```

## 文件

```
client.js        前端主体（样式注入 / 引擎 / 设置面板 / 粒子）
index.js         宿主侧空实现
cordis.patch.yml 声明式挂载
locale/          中英文名称与描述
icon.svg         线稿图标
docs/            截图
```

## License

MIT
