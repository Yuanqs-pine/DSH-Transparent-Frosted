# DSH-Transparent-Frosted · 透明磨砂主题

<p>
  <img alt="version" src="https://img.shields.io/badge/version-1.0.2-6c8cff">
  <img alt="platform" src="https://img.shields.io/badge/dsh-desktop%20%7C%20web-14b8a6">
  <img alt="scope" src="https://img.shields.io/badge/scope-background%20layer%20only-8e8e93">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-3ddc84">
</p>

把 DeepSeek Harness 变成一整块透明磨砂玻璃：一条滑杆在"真模糊的磨砂"与"背景彻底消失"之间连续过渡，整页所有区域、组件、展开面板作为**一张纸**一起变化；设置页有独立滑杆，互不干扰。

A transparent frosted-glass background for DeepSeek Harness. One slider moves the whole app between a genuinely blurred frost and a fully cleared background — every region, control and expanded page moves as **a single sheet**. The settings page keeps its own slider.

> 深色主题下效果最佳 —— 你的电脑桌面壁纸就是 DeepSeek Harness 的背景皮肤。
> **桌面端效果更好**：只有桌面端能把整个窗口背景让出去、直接透出你的桌面壁纸；Web 端只能露出插件自绘的背景。
>
> Best on a dark theme: your desktop wallpaper becomes the background skin. The **desktop app** is the better place to use it — only there can the window become truly transparent.

| 浓磨砂（0%） | 全透明（100%） |
|---|---|
| ![frost](docs/frost.jpg) | ![clear](docs/clear.jpg) |

![particles](docs/particles.png)

## 安装

下载 [Releases](https://github.com/Yuanqs-pine/DSH-Transparent-Frosted/releases) 里的 `dsh-transparent-frosted-1.0.2.tgz`，放在任意目录，然后：

**桌面端**

```bash
dsh plugin --profile desktop add ./dsh-transparent-frosted-1.0.2.tgz
```

装完**完全退出并重新启动** DeepSeek Harness。桌面端的应用窗口没有刷新快捷键，插件作为前端代码只在窗口创建时加载，所以必须重开一次；重开后会自动套用默认配置（已开启、页面 72%、设置页 62%），不需要先打开设置页。

**Web 端**

```bash
dsh plugin --profile web add ./dsh-transparent-frosted-1.0.2.tgz
dsh --profile web web --port 8080
```

浏览器打开 `http://127.0.0.1:8080` 即可；之后换插件或改配置，刷新浏览器页面（`F5`）就会生效，不用重启服务。

> Web 端没有"桌面壁纸"可以透出来：浏览器窗口背后是浏览器自己，插件只能自绘一层深色渐变当作背景底。所以 Web 端拉到全透明，透出的是这层渐变，而不是你的桌面 —— **想要"背景就是你的壁纸"的效果，请用桌面端。**

> 也可以直接指向克隆下来的源码目录：把上面的 `./dsh-transparent-frosted-1.0.2.tgz` 换成 `link:E:/path/to/DSH-Transparent-Frosted`。

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

## 两端效果对照

桌面端：窗口本身就是透明的，整页玻璃透出的是**你的桌面壁纸**。

| 桌面端 · 浓磨砂 0% | 桌面端 · 全透明 100% |
|---|---|
| ![desktop frost](docs/desktop-frost.jpg) | ![desktop clear](docs/desktop-clear.jpg) |

Web 端：窗口背后没有壁纸，插件自绘深色渐变作为底，看上去是彩色玻璃而不是"透出桌面"。

| Web 端 · 浓磨砂 0% | Web 端 · 全透明 100% |
|---|---|
| ![web frost](docs/web-frost.jpg) | ![web clear](docs/web-clear.jpg) |

## 兼容

| 平台 | 状态 |
|---|---|
| Windows 桌面端 | ✅ |
| macOS 桌面端 | ✅ |
| Web（Chrome / Edge） | ✅ |
| 深色 / 浅色主题 | ✅ |

## 卸载

```bash
dsh plugin --profile desktop remove dsh-transparent-frosted
```

## 项目结构

```
DSH-Transparent-Frosted/
├── client.js              前端主体：样式注入、渲染引擎、设置面板、鲸鱼粒子
├── index.js               宿主侧入口（空实现，插件只跑在客户端）
├── cordis.patch.yml       声明式挂载补丁，把插件插入 dsh 配置
├── package.json           包元数据、dsh.bundle / dsh.client 声明、files 清单
├── icon.svg               线稿图标，同时用于设置页标题左侧
├── screenshots.json       插件市场展示用的截图清单
├── LICENSE                MIT 许可
├── locale/
│   ├── zh.json            中文名称与描述
│   └── en.json            英文名称与描述
├── assets/
│   ├── icon-180.png       180×180 商店图标
│   └── make-icon.py       图标的生成脚本（Pillow）
└── docs/                  README 与商店展示截图
    ├── frost.jpg          主图 · 浓磨砂
    ├── clear.jpg          主图 · 全透明
    ├── desktop-frost.jpg  桌面端 · 浓磨砂
    ├── desktop-clear.jpg  桌面端 · 全透明
    ├── web-frost.jpg      Web 端 · 浓磨砂
    ├── web-clear.jpg      Web 端 · 全透明
    └── particles.png      鲸鱼粒子
```

## License

[MIT](./LICENSE) © [Yuanqs-pine](https://github.com/Yuanqs-pine)

## 免责声明

**一、仅供学习交流。**
本项目为个人学习与娱乐性质的开源插件，不用于任何商业目的。

**二、第三方素材权利。**
本项目的视觉风格参考自动画作品，音频素材（人声与音效）取自第三方视频，相关权利均归原权利人所有。本项目不对上述风格与素材主张任何权利，亦未获得任何形式的授权或背书。

**三、二次创作风险自担。**
任何人基于本项目进行修改、改编、翻译、再分发等二次创作，由此产生的侵权、纠纷或任何法律责任，均由该行为人自行承担，与本项目作者无关。

**四、商业使用风险自担。**
本项目未授权任何商业用途。若将本项目或其衍生作品用于商业行为（包括但不限于售卖、付费分发、商业产品集成、商业宣传、商业演示），由此引发的知识产权纠纷与全部法律责任，由使用者自行承担，作者不承担任何责任。

**五、许可范围。**
本项目的开源许可仅覆盖作者原创的代码与文案，不覆盖上述第三方风格与素材。使用者在再利用第三方内容时，应自行取得相应授权。

**六、权利主张。**
若权利人认为本项目侵犯了其合法权益，请联系作者，作者将在核实后立即移除相关内容。
