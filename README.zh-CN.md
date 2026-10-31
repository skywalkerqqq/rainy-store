# ☔ 星降マート — 雨夜街角微缩场景

> 一个可交互、像手办一样的 3D 微缩立体场景：雨夜中坐落在方形底座上的日本便利店街角。基于 Three.js 构建，完全程序化生成，无任何外部素材。

[![许可证: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Three.js](https://img.shields.io/badge/Three.js-r160-000000.svg)](https://threejs.org/)
[![语言: JavaScript](https://img.shields.io/badge/language-JavaScript-F7DF1E.svg)](https://developer.mozilla.org/docs/Web/JavaScript)
[![便携构建](https://img.shields.io/badge/build-单文件%20HTML-ff69b4.svg)](#-便携构建)
[![免构建](https://img.shields.io/badge/运行-零配置%20HTML-00bcd4.svg)](#-快速开始)

---

## ✨ 这是什么

一个自包含的 WebGL 微缩场景：雨夜里，一家日本便利店（**星降マート / HOSHIFURI MART**）坐落在方形底座上。采用第三人称环绕相机、动画风格的卡通着色、湿润的霓虹倒影与实时降雨——**没有任何界面浮层**。所有内容都在加载时由程序化生成。

## 🎯 特性

- 🏪 **发光便利店** —— 玻璃门面、突出 Blade 招牌、自动玻璃滑门、雨棚、温暖的室内灯光
- 🌧️ **实时降雨** —— 雨丝、水洼，以及湿润反光的路面
- 💡 **卡通着色** —— 对中型/大型网格自动描边、霓虹辉光、暖色室内光与冷色路灯的对比
- 🛣️ **完整的街角** —— 道路、反光的斑马线、自动售货机、自行车、路灯、电线杆、小巷，以及一家咖啡馆（喫茶 月灯）和远处的酒吧（スナック星屑）
- 🖱️ **环绕相机** —— 拖拽旋转、滚轮 / 双指缩放；无按钮、无标签
- 🧩 **完全程序化** —— 无图片、无字体文件、无网络请求；可直接以 `file://` 打开运行
- 📦 **单文件便携构建**，位于 `dist/`

## 🧰 技术栈

| 部分 | 说明 |
|------|------|
| 渲染器 | Three.js **r160**（以 UMD 形式内置在 `vendor/three.min.js`） |
| 语言 | 原生 JavaScript，普通 `<script>` 全局变量（`window.DIORAMA`） |
| 着色 | 自定义卡通材质 + 描边通道 + 叠加辉光贴花（无后期处理依赖） |
| 素材 | 100% 程序化几何与 Canvas 纹理 |

## 🚀 快速开始

直接用浏览器打开 **`index.html`** 即可——支持 `file://` 协议，无需启动服务器。
想要单文件便携版？改为打开 **`dist/hoshifuri-mart-rainy-night.html`**。

如需从源码重新生成单文件便携构建：

```bash
npm install      # 可选；three 已内置
npm run build    # -> dist/hoshifuri-mart-rainy-night.html
```

## 🕹️ 操作方式

- **拖拽** —— 环绕场景旋转相机
- **滚轮 / 双指** —— 缩放远近

刻意不设置任何屏幕界面；所有招牌都存在于 *3D 模型内部*。

## 📂 项目结构

```
rainy-store/
├── index.html              # 开发入口；按顺序加载 vendor 与 src 脚本
├── vendor/
│   └── three.min.js        # Three.js r160（内置 UMD）
├── src/
│   ├── core.js             # 公共工具：调色板、卡通材质、几何与招牌辅助、描边通道
│   ├── street.js           # 底座、道路、人行道、湿润标线、斑马线
│   ├── store.js            # 便利店：外壳、室内、招牌、雨棚、滑门
│   ├── props.js            # 街道家具：售货机、自行车、灯杆、垃圾桶、护栏
│   ├── background.js       # 周边建筑、小巷、咖啡馆、绿化
│   ├── ambient.js          # 灯光布置 + 降雨系统
│   └── main.js             # 渲染器、相机、环绕交互、装配与合批
├── tools/
│   └── build.js            # 将所有运行时素材内联为单个便携 HTML 文件
└── dist/                   # 生成的单文件构建（已纳入版本控制）
```

## 🛠️ 装配方式

`index.html` 按固定顺序加载脚本；随后 `main.js` 逐一调用各模块的构建函数：

```js
D.buildStreet(D.groups.street, D.groups.base);
D.buildBackground(D.groups.background);
D.buildStore(D.groups.store);
D.buildProps(D.groups.props);
D.buildAmbient(D.groups.ambient);
```

每个构建函数把网格挂到各自独立的 `THREE.Group` 图层上，从而在不相互冲突的前提下合成同一个模型。共享辅助函数（几何、材质、文字纹理、辉光）集中在 `src/core.js`，位于 `window.DIORAMA`（`D`）命名空间下。

## 📜 许可证

基于 [MIT 许可证](LICENSE) 发布 © 2026 **skywalkerqqq**。
