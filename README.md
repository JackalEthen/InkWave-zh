<p align="center">
  <img src="assets/stages/halyard-day.webp" alt="Halyard Marina at golden hour" width="100%">
</p>

<h1 align="center">INKWAVE · 中文版</h1>

<p align="center">
  一个原创的、Splatoon 风格的 4v4 涂地射击游戏，直接在浏览器里跑。<br>
  涂满地面、潜进自己的墨里、把对面涂到没脾气。
</p>

<p align="center">
  <a href="#快速开始"><b>▶ 立即开玩</b></a> ·
  <a href="#操作">操作</a> ·
  <a href="#本地运行">本地运行</a> ·
  <a href="#技术原理">技术原理</a> ·
  <a href="#平台路线图">平台支持</a> ·
  <a href="README.en.md">English</a>
</p>

<p align="center">
  <img alt="three.js r186" src="https://img.shields.io/badge/three.js-r186-000000?logo=three.js&logoColor=white">
  <img alt="No build step" src="https://img.shields.io/badge/build-none%20needed-2ea44f">
  <img alt="ES Modules" src="https://img.shields.io/badge/modules-ESM-f7df1e?logo=javascript&logoColor=black">
  <img alt="WebGL 2" src="https://img.shields.io/badge/WebGL-2-990000?logo=webgl&logoColor=white">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue"></a>
</p>

<p align="center">
  <img alt="Languages" src="https://img.shields.io/badge/i18n-中文%20%7C%20English-ff69b4">
  <img alt="Default language" src="https://img.shields.io/badge/默认语言-中文-c8102e">
  <img alt="Dictionary keys" src="https://img.shields.io/badge/词条-465%20keys-4c1">
  <img alt="GPU memory" src="https://img.shields.io/badge/显存-151%20→%2054%20MB%20(-64%25)-brightgreen">
</p>

<p align="center">
  <img alt="Platform: Web" src="https://img.shields.io/badge/Web-已支持-success?logo=googlechrome&logoColor=white">
  <img alt="Platform: Windows" src="https://img.shields.io/badge/Windows-已支持-success?logo=windows&logoColor=white">
  <img alt="Platform: Android" src="https://img.shields.io/badge/Android-计划中-blue?logo=android&logoColor=white">
  <img alt="Platform: Linux" src="https://img.shields.io/badge/Linux-已支持-success?logo=linux&logoColor=white">
</p>

<p align="center">
  <img alt="Code size" src="https://img.shields.io/badge/JS-46%2C417%20行-informational">
  <img alt="Files" src="https://img.shields.io/badge/文件-618-informational">
  <img alt="Dependencies" src="https://img.shields.io/badge/运行时依赖-1%20(three.js)-informational">
</p>

---

## 这是什么

这是 **[INKWAVE](https://github.com/DevFrancois/inkwave)** 的中文本地化 + 性能优化分支。
**上游全部功能完整保留**，在此之上叠加了完整中文化、显存优化和 4 个上游缺陷修复。

> 原项目作者：**Jayden Davis** · 原仓库：**https://github.com/DevFrancois/inkwave**
> 没有上游就没有这个分支，请一并给原作者点个 Star。

---

## 做了什么

### 一、完整中文本地化

| 项目 | 说明 |
|---|---|
| 语言 | 中文 / English 双语，**默认中文** |
| 词条 | 465 条，中英键名**完全对齐**（无缺漏、无多余） |
| 字体 | 内置 LXGW 975 圆体 SC 子集（400 + 700），共 273 KB |
| 排版 | 拉丁字形优先，中文回落圆体，中英混排不串行 |
| 切换 | 设置 → 操作 → **语言 / Language**，即时生效，无需刷新 |

**实现方式**：没有引入任何 i18n 库，也没有在约 400 个调用点插入 `t()`。
- `src/config.js` 的界面文案改用惰性 getter
- 界面模块用惰性数组 / 对象，切换语言时原地重建
- 运行时只有 66 行（`src/i18n/i18n.js`），零游戏依赖

**刻意保留英文的内容**：`INKWAVE` 品牌名、`Turf Riot`、按键名（`Esc` / `Enter` / `Shift` / `Space` / `Tab`）、排名名、队伍名、机器人名、10 个预设角色名。

### 二、内存 / CPU 优化

| 档位 | 改动 | 原因 |
|---|---|---|
| `high` | MSAA 4 → 2 | 4× MSAA 在 HDR 目标上开销极大，视觉差异极小 |
| `high` | 阴影贴图 4096 → 2048 | **单项省 48 MB** |
| `high` | 涂鸦图集 4096 → 2048 | **单项省 48 MB** |
| `ultra` | pixelRatio 2.0 → 1.5 | 4K 屏上 2.0 会申请 7680×4320 目标（约 530 MB），正是 OOM 源头 |
| `ultra` | MSAA 4 → 2 | 同上 |
| 全部 | GTAO 采样按档位缩放 | 低档不再承担 ultra 的采样成本 |
| — | 头像渲染目标与读回缓冲按尺寸复用 | 此前每次重建都新建 GPU 缓冲 |
| — | 静止帧跳过涂鸦绘制与干燥分支 | 暂停 / 菜单 / 观战时不空转 |

**实测收益（1920×1080，`high` 档）**

| 资源 | 优化前 | 优化后 |
|---|---|---|
| 涂鸦图集 | 4096² = 64.0 MB | 2048² = 16.0 MB |
| 阴影贴图 | 4096² = 64.0 MB | 2048² = 16.0 MB |
| 涂鸦法线图 | 512² = 1.0 MB | 256² = 0.3 MB |
| **GPU 缓冲合计** | **151.0 MB** | **54.3 MB（−64%）** |

`ultra` 档保留 4096 阴影与大图集，供大屏 / 独显使用；`medium`、`low` 未改动。

### 三、修复的上游缺陷

1. **结算页卡死在 0:00** —— `src/ui/hud.js` 的 `judge()` 内有个局部变量 `t`，遮蔽了 i18n 的 `t` 函数，触发 TDZ `ReferenceError`。异常发生在 `Promise` 执行器内部，导致 promise 永不 resolve，比赛结束后永远等不到结算页。已重命名局部变量（11 处）。
2. **低帧率下比赛状态推进极慢** —— `src/game/match.js` 的 `stateT` 原本累加 `THREE.Timer` 钳制过的 `dt`（上限约 0.0208 秒），帧率一低状态切换就要 100+ 帧。已改为基于 `performance.now()` 的真实时长。
3. **动态分辨率泄漏显存** —— `src/core/renderer.js` 的 `setDynamicScale()` 只改 pixelRatio 而不释放旧的 `renderTarget1/2`，每次动态降档都漏掉整个 HDR 缓冲。已补上 `dispose()`。
4. **显存耗尽时静默卡死** —— 新增 `webglcontextlost` 兜底与屏上中文提示，显卡上下文丢失时不再是一块黑屏。

---

## 上游原版特性

- **涂地战，4 v 4。** 三分钟，涂得多的一方赢。三档难度的机器人对手。
- **乌贼形态。** 按住潜进自己的墨里：游得快、补满墨、能爬涂过的墙、还能在水面上跃起。
- **七种武器**，手感各不相同：Spritzer（射击枪）、Swell Roller（滚筒）、Glint Charger（蓄力枪）、Popper Blaster（爆破枪）、Twinfin Dualies（双枪，带翻滚）、Tidebucket Slosher（泼桶）、Gyre Splatling（旋转枪）。每套配装都带喷溅炸弹和一个大招。
- **三张地图，白天或黄昏。** Tidewater Plaza、Kelpline Terminal，以及 Halyard Marina —— 一座真实运作的码头，中间泊着一艘汽车渡轮，水面缺口就是这张图的核心。
- **会流动的墨。** 墨迹会扩散、会定型；新鲜的墨有光泽，随后逐渐变干；墨会顺着墙往下滴；游动会在墨面留下尾迹。
- **看得懂的地图。** 按住 <kbd>Tab</kbd>，镜头抬升成整张实况地图的移轴模型，带队友标记和一键超级跳。
- **更衣室。** 自己捏乌贼小孩：触手样式、头饰、脸、服装。
- **全程序化生成。** 角色、动画、武器、贴图、道具、音效和音乐全部由代码生成。除两款字体外没有任何下载资源。

<p align="center">
  <img src="assets/stages/tidewater-day.webp" width="49%" alt="Tidewater Plaza">
  <img src="assets/stages/kelpline-dusk.webp" width="49%" alt="Kelpline Terminal at dusk">
</p>

## 操作

| 动作 | 键盘 / 鼠标 | 手柄 |
|---|---|---|
| 移动 | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> | 左摇杆 |
| 瞄准 | 鼠标 | 右摇杆 |
| 射击 | 鼠标左键 | RT |
| 乌贼形态 | <kbd>Shift</kbd> | LT |
| 跳跃 / 翻滚 | <kbd>Space</kbd> | A |
| 副武器（炸弹） | 鼠标右键 / <kbd>E</kbd> | RB |
| 大招 | <kbd>F</kbd> | Y |
| 地图 + 超级跳 | 按住 <kbd>Tab</kbd> 或 <kbd>M</kbd>，再按 <kbd>1</kbd>–<kbd>4</kbd> 或点击标记 | View |
| 暂停 | <kbd>Esc</kbd> | Start |

手柄需要 HTTPS 环境；在普通 `http://` 局域网地址下浏览器会禁用 Gamepad API。

## 本地运行

没有构建步骤。任何静态文件服务器都可以；仓库自带的那个还会把服务暴露到局域网，并发送 no-cache 头，模块更新永不过期。

```bash
git clone https://github.com/JackalEthen/InkWave-zh.git
cd InkWave-zh
npm start        # http://localhost:8490
```

常用 URL 参数：`?map=halyard&time=dusk` 选地图，`&autostart=180` 跳过菜单直接开 180 秒的比赛，`&autopilot` 让机器人替你操作。

```bash
npm install      # 只需装一次，给无头工具用
npm run check    # 全量语法检查
npm run smoke    # 无头 Chrome 启动 + 8 秒自动驾驶，控制台报错即失败
npm run build    # 打包 dist/（只含游戏和它真正 import 的 three.js 附加模块）
```

> Windows 用户注意：`package.json` 里的脚本按 POSIX 写的，在 PowerShell 下可能跑不通。可以直接用 `python tools/serve.py 8490` 起服务。

## 技术原理

- **墨是在纹理空间里画的。** 每个可涂面占一张大图集的一块区域；泼溅在 GPU 上画进去，同时一份粗粒度 CPU 网格保持涂地比分和玩法查询同步。关卡着色器把墨叠在表面上，带自己的高度、光泽和干湿。见 [`src/world/paint.js`](src/world/paint.js) 与 [`src/world/inkShading.js`](src/world/inkShading.js)。
- **地图是数据。** 一份布局是竞技场一半的盒子与斜坡列表，另一半是 180° 旋转，所以两队永远拿到完全一致的场地。环境光遮蔽离线烘焙（`tools/bake-ao.mjs`）。见 [`src/world/maps.js`](src/world/maps.js)。
- **角色完全程序化。** 几何、材质、60 骨骼绑定和全部动画（移动、乌贼形态、武器姿态、次级运动）都是代码，由弹簧驱动的姿态系统驱动。见 [`docs/RIG.md`](docs/RIG.md)。
- **系统之间用事件通信。** 武器、演员和比赛发出带类型的事件；特效、HUD 和音频订阅。契约见 [`docs/EVENTS.md`](docs/EVENTS.md) 与 [`docs/CONTRACTS.md`](docs/CONTRACTS.md)。
- **可复现的工具链。** 游戏暴露了 freeze/step 调试接口，所以胶片条、手感测量和机器人模拟都能逐帧复现（`tools/film.py`、`tools/measure-handling.mjs`）。

渲染基于 three.js r186（vendored，纯 ES 模块 + import map），带 GTAO、泛光和自定义调色 pass。

## 平台路线图

| 平台 | 状态 | 说明 |
|---|---|---|
| **Web** | ✅ **已支持** | Chrome / Edge 为主目标，Firefox 可用 |
| **Windows** | ✅ **已支持** | 用 [Tauri 2](https://v2.tauri.app/) 打包，NSIS 安装包约 9 MB，需 Windows 10+ |
| **Android** | 🔜 计划中 | 同一套 Tauri 2 代码库出包；**需要先补触摸操作**（当前仅键鼠 + 手柄） |
| **Linux** | ✅ **已支持** | Tauri 2 打包，提供 `.deb` 与 `.AppImage`，依赖 WebKitGTK 2.40+（Ubuntu 22.04 及以上） |
| **iOS** | ❌ 不支持 | 不在计划内 |
| **macOS** | ❌ 不支持 | 不在计划内 |

## 参与贡献

欢迎提 Issue 和 PR。上游的 [CONTRIBUTING.md](CONTRIBUTING.md) 里有项目结构说明和提交前要跑的检查。

针对本分支的中文化问题（漏翻、错译、排版溢出），请直接在本仓库开 Issue，并附上截图和当时的界面路径。

## 许可与致谢

本项目基于 **MIT** 许可发布。

```
MIT License
Copyright (c) 2026 Jayden Davis
```

- **原始项目**：[DevFrancois/inkwave](https://github.com/DevFrancois/inkwave) · 作者 **Jayden Davis**
- **本分支**：由 **[@JackalEthen](https://github.com/JackalEthen)** 维护，在上游基础上增加中文本地化与性能优化
- 上游的 `LICENSE` 文件与版权声明**完整保留**，未做任何修改

INKWAVE 是一个独立项目，与任天堂没有任何关联；Splatoon 是任天堂的商标。