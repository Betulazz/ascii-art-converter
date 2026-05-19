# 字符画转换器

一个基于 Tauri + React + Rust 的本地桌面字符画转换工具。它可以将图片、GIF 和文本转换为等宽字符画，并支持复制、导出 TXT，以及将 GIF 字符画导出为动画 GIF。

## 功能特性

- 图片转字符画：支持 PNG、JPG、JPEG、BMP、WEBP。
- GIF 转字符画：保留帧延迟并提供动画预览，最多支持 300 帧。
- 文本转字符画：内置 FIGlet 字体，可实时生成文字字符画。
- 自定义参数：输出宽度、自定义字符集、反色、保持比例、彩色预览。
- 导出能力：复制到剪贴板、导出 TXT、导出 GIF 字符画动画。
- 本地处理：图片和文本转换在本地桌面应用中完成。

## 下载安装

Windows 安装包可以从 GitHub Release 下载：

[下载 v0.1.0 Windows 安装包](https://github.com/Betulazz/ascii-art-converter/releases/download/v0.1.0/ascii-art-converter_0.1.0_x64-setup.exe)

也可以查看完整 release 页面：

[https://github.com/Betulazz/ascii-art-converter/releases/tag/v0.1.0](https://github.com/Betulazz/ascii-art-converter/releases/tag/v0.1.0)

## 使用说明

### 图片转字符画

1. 打开应用后进入“图片转字符画”标签页。
2. 选择图片或 GIF 文件。
3. 设置输出宽度、字符集和其他参数。
4. 点击“生成字符画”。
5. 根据需要复制结果、导出 TXT，或对 GIF 结果导出动画 GIF。

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
- 彩色预览只影响界面预览，不改变 TXT 的纯文本内容。
- MSI 打包依赖 WiX 工具链；如果 MSI 构建失败，可以优先使用 NSIS 安装包。

## 许可证

当前仓库尚未声明许可证。如需开源分发，建议补充 `LICENSE` 文件。
