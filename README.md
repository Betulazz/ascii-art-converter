# 字符画转换器

一个基于 Tauri + React + Rust 的本地桌面字符画转换工具。支持图片、GIF、视频和文本转换为等宽字符画，可预览、复制、导出 TXT/PNG/GIF/MP4，并可输出到独立的 Windows CMD 窗口播放。

## 功能特性

- 图片转字符画：支持 PNG、JPG、JPEG、BMP、WEBP。
- GIF 转字符画：保留帧延迟并提供动画预览，最多处理 300 帧。
- 视频转字符画：支持 MP4、WEBM、MOV、AVI、MKV，内置 FFmpeg 抽帧转换，默认采样 8fps，最多处理 600 帧。
- 文本转字符画：内置 FIGlet 字体，可实时生成文字字符画。
- 参数控制：输出宽度、字符集、反色、保持比例、彩色预览、CMD 缩放模式。
- 导出能力：支持复制文本、导出 TXT、PNG、GIF 字符画动画和静音 MP4 字符画视频。
- CMD 输出：图片、GIF、视频和文本结果可输出到新的 CMD 窗口；动画会按帧延迟循环播放。
- 更稳定的 CMD 动画播放：动画帧会自动适配控制台，并使用临时终端屏幕避免滚动和闪烁。
- 本地处理：转换和导出都在本地桌面应用中完成。

## 下载安装

Windows 安装包可从 GitHub Releases 下载：

[查看最新 Release](https://github.com/Betulazz/ascii-art-converter/releases/latest)

历史版本页面：

[https://github.com/Betulazz/ascii-art-converter/releases](https://github.com/Betulazz/ascii-art-converter/releases)

## 使用说明

### 图片和 GIF 转字符画

1. 打开应用后进入“图片转字符画”标签页。
2. 选择图片或 GIF 文件。
3. 设置输出宽度、字符集和其他参数。
4. 点击“生成字符画”。
5. 根据需要复制结果、导出 TXT/PNG，输出到 CMD，或将 GIF 结果导出为动画 GIF。

默认字符集：

```text
@%#*+=-:.
```

### 视频转字符画

1. 切换到“视频转字符画”标签页。
2. 选择本地视频文件。
3. 设置输出宽度、字符集、反色、保持比例、彩色预览和目标 FPS。
4. 点击“生成字符画”。
5. 可预览动画、导出 TXT、导出静音 MP4，或输出到 CMD 循环播放。

视频转换默认采样 8fps，最多 600 帧。较长视频建议先裁剪或降低 FPS。

### 文本转字符画

1. 切换到“文字转字符画”标签页。
2. 输入文本。
3. 选择 FIGlet 字体。
4. 预览区域会实时显示生成结果。
5. 可复制或导出 TXT，也可以输出到 CMD。

### 输出到 CMD

1. 生成图片、GIF、视频或文本字符画。
2. 在导出区域选择 CMD 缩放模式。
3. 点击“输出到 CMD”。
4. 静态结果会显示并等待关闭；GIF 和视频会循环播放，关闭窗口或按 `Ctrl+C` 可停止。

## 开发环境

需要安装：

- Node.js
- npm
- Rust
- Tauri 2 所需的 Windows 构建依赖

安装依赖：

```bash
npm install
```

启动前端开发服务器：

```bash
npm run dev
```

启动 Tauri 桌面开发模式：

```bash
npm run tauri -- dev
```

## 常用脚本

```bash
# 运行前端测试
npm test

# 构建前端
npm run build

# 构建 Tauri 应用和安装包
npm run tauri -- build

# 只构建 NSIS Windows 安装包
npm run tauri -- build --bundles nsis
```

构建完成后，Windows NSIS 安装包通常位于：

```text
src-tauri/target/release/bundle/nsis/
```

## 项目结构

```text
.
├── src/                    # React 前端
│   ├── components/         # 页面组件、预览和导出控件
│   ├── lib/                # Tauri 调用、FIGlet、动画渲染和导出逻辑
│   └── types/              # TypeScript 类型
├── src-tauri/              # Tauri/Rust 后端
│   ├── src/                # 图片/GIF/视频转换和导出命令
│   ├── icons/              # 应用图标
│   └── tauri.conf.json     # Tauri 配置
├── package.json
└── vite.config.ts
```

## 技术栈

- Tauri 2
- React 18
- TypeScript
- Vite
- Rust
- Vitest
- FIGlet
- gifenc
- FFmpeg

## 注意事项

- 图片输出宽度最大为 400。
- GIF 最多支持 300 帧。
- 视频最多支持 600 帧，默认导出为静音 MP4。
- TXT 导出是纯文本；CMD 彩色输出依赖 Windows 终端对 ANSI 真彩色转义序列的支持。
- FFmpeg 会作为 Tauri sidecar 打包；开发环境也可通过 `ASCII_ART_FFMPEG` 或系统 `PATH` 指定 FFmpeg。
- MSI 打包依赖 WiX 工具链；如果 MSI 构建失败，可优先使用 NSIS 安装包。

## 许可证

本项目使用 MIT License，详见 [LICENSE](LICENSE)。
