# 字符画转换器

一个基于 Tauri + React + Rust 的本地桌面字符画转换工具。它可以将图片、GIF 和文本转换为等宽字符画，支持彩色预览、复制、导出 TXT/PNG/GIF，并可以把生成结果输出到独立的 Windows CMD 窗口中。

## 功能特性

- 图片转字符画：支持 PNG、JPG、JPEG、BMP、WEBP。
- GIF 转字符画：保留帧延迟并提供动画预览，最多支持 300 帧。
- 文本转字符画：内置 FIGlet 字体，可实时生成文字字符画。
- 自定义参数：输出宽度、自定义字符集、反色、保持比例、彩色预览。
- 导出能力：复制到剪贴板、导出 TXT、导出 PNG、导出 GIF 字符画动画。
- CMD 输出：图片、GIF 和文本结果可以输出到新的 Windows CMD 窗口；GIF 会按帧延迟循环播放。
- CMD 缩放和彩色输出：支持自动缩放、手动缩放，并在彩色结果中输出 ANSI 真彩色字符。
- 本地处理：图片和文本转换在本地桌面应用中完成。

## 下载安装

Windows 安装包可以从 GitHub Release 下载：

[下载 v0.1.1 Windows 安装包](https://github.com/Betulazz/ascii-art-converter/releases/download/v0.1.1/ascii-art-converter_0.1.1_x64-setup.exe)

也可以查看完整 release 页面：

[https://github.com/Betulazz/ascii-art-converter/releases/tag/v0.1.1](https://github.com/Betulazz/ascii-art-converter/releases/tag/v0.1.1)

## 使用说明

### 图片转字符画

1. 打开应用后进入“图片转字符画”标签页。
2. 选择图片或 GIF 文件。
3. 设置输出宽度、字符集和其他参数。
4. 点击“生成字符画”。
5. 根据需要复制结果、导出 TXT/PNG，输出到 CMD，或对 GIF 结果导出动画 GIF。

默认字符集：

```text
@%#*+=-:. 
```

### 文本转字符画

1. 切换到“文字转字符画”标签页。
2. 输入文本。
3. 选择 FIGlet 字体。
4. 预览区域会实时显示生成结果。
5. 可以复制或导出 TXT。

### 输出到 CMD

1. 生成图片、GIF 或文本字符画。
2. 在导出区域选择 CMD 缩放模式。
3. 点击“输出到 CMD”。
4. 静态图片和文本会在新的 CMD 窗口中显示并等待关闭；GIF 会按原始帧延迟循环播放，关闭窗口或按 `Ctrl+C` 可停止播放。

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
# 运行测试
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
│   ├── lib/                # Tauri 调用、FIGlet、GIF 导出逻辑
│   └── types/              # TypeScript 类型
├── src-tauri/              # Tauri/Rust 后端
│   ├── src/                # 图片/GIF 转换、导出命令
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

## 注意事项

- 图片输出宽度最大为 400。
- GIF 最多支持 300 帧。
- TXT 导出是纯文本；CMD 彩色输出依赖 Windows 终端对 ANSI 真彩色转义序列的支持。
- MSI 打包依赖 WiX 工具链；如果 MSI 构建失败，可以优先使用 NSIS 安装包。

## 许可证

本项目使用 MIT License，详见 [LICENSE](LICENSE)。
