---
title: VS Code / Cursor 扩展开发教程
category:
  - Cursor
  - VScode
---

# VS Code / Cursor 扩展开发教程，从零开始，不需要发布，直接本地使用。

## 第一步：环境准备

需要安装 Node.js（建议 18+）和两个工具：

```bash
npm install -g yo generator-code   # 脚手架
npm install -g @vscode/vsce         # 打包工具
```

---

## 第二步：创建项目

```bash
yo code
```

运行后会出现交互式提问，按如下选择：

```
     _-----_     ╭──────────────────────────╮
    |       |    │   Welcome to the Visual  │
    |--(o)--|    │   Studio Code Extension  │
   `---------´   │        generator!        │
    ( _´U`_ )    ╰──────────────────────────╯
    /___A___\   /
     |  ~  |
   __'.___.'__
 ´   `  |° ´ Y `

? What type of extension do you want to create?
  ❯ New Extension (TypeScript)      ← 选这个

? What's the name of your extension?
  my-tool                           ← 随便起名

? What's the identifier of your extension?
  my-tool                           ← 回车默认

? What's the description of your extension?
  My personal tool                  ← 随便写

? Initialize a git repository?      ← 看个人情况选择
  Yes

? Which bundler to use?             
❯ unbundled                         ← 本地插件选这个
  webpack
  esbuild

? Which package manager to use?
  pnpm
```


生成后的目录结构：

```
my-tool/
├── .vscode/
│   ├── extensions.json
│   ├── launch.json       ← F5 调试配置（已自动生成）
│   ├── settings.json
│   └── tasks.json        ← 编译任务
├── node_modules/
├── src/
│   ├── test/
│   │   └── extension.test.ts
│   └── extension.ts      ← ✅ 主文件，你将在这里提供命令的实现。
├── .gitignore
├── .npmrc
├── .vscode-test.mjs
├── .vscodeignore
├── CHANGELOG.md
├── eslint.config.mjs
├── package.json         ← 扩展清单，注册命令/快捷键等
├── pnpm-lock.yaml
├── README.md
├── tsconfig.json
└── vsc-extension-quickstart.md

```

### 关键文件说明

- **`package.json`** — 扩展的清单文件，用于声明扩展和命令。示例插件在此注册命令并定义其标题和命令名称。VS Code 通过这些信息在命令面板中展示命令，且在命令执行前无需加载插件。

- **`src/extension.ts`** — 主文件，你将在这里提供命令的具体实现。文件导出一个 `activate` 函数，在扩展首次被激活时调用（本例中通过执行命令触发）。在 `activate` 函数内部，通过 `registerCommand` 注册命令，第二个参数即为命令的具体实现函数。

---

## 第三步：Hello World 代码详解

用 Cursor 打开项目目录，打开 `src/extension.ts`，默认内容就是一个 Hello World：

```typescript
import * as vscode from 'vscode';

// 扩展激活时调用（首次执行命令时触发）
export function activate(context: vscode.ExtensionContext) {

    // 注册一个命令，命令 ID 必须与 package.json 里一致
    const disposable = vscode.commands.registerCommand(
        'my-tool.helloWorld',   // 命令 ID
        () => {
            // 弹出一个通知消息
            vscode.window.showInformationMessage('Hello from My Tool!');
        }
    );

    // 把命令加入 context，扩展停用时自动释放
    context.subscriptions.push(disposable);
}

// 扩展停用时调用（可选清理）
export function deactivate() {}
```

对应的 `package.json` 关键部分：

```json
{
  "name": "my-tool",
  "publisher": "my-publisher",
  "version": "0.0.1",
  "engines": { "vscode": "^1.74.0" },
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "my-tool.helloWorld",
        "title": "My Tool: Hello World"
      }
    ]
  }
}
```

---

## 第四步：运行和调试

### 运行扩展

1. 按 `F5` 启动调试，会打开一个新的 VS Code/Cursor 窗口(**Extension Development Host**)
2. 按 `Ctrl+Shift+P`（Mac: `Cmd+Shift+P`）打开命令面板
3. 输入 `My Tool: Hello World` 并回车，右下角弹出通知即成功

### 调试方式

- **断点调试**：在 `src/extension.ts` 中设置断点
- **查看输出**：在调试控制台查看扩展日志

### 热更新

修改代码后重新加载：
- 从调试工具栏重启，或
- 按 `Ctrl+R`（Mac: `Cmd+R`）

---

## 第五步：做几个实用例子

下面三个例子比 Hello World 更实用，直接粘贴到 `extension.ts` 即可：

### 例子 A：选中文字转大写

```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    // 命令1：选中文字转大写
    const toUpper = vscode.commands.registerCommand(
        'my-tool.toUpperCase',
        () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;

            const selection = editor.selection;
            const text = editor.document.getText(selection);

            editor.edit(editBuilder => {
                editBuilder.replace(selection, text.toUpperCase());
            });
        }
    );

    context.subscriptions.push(toUpper);
}

export function deactivate() {}
```

`package.json` 的 `contributes` 里加上：

```json
"commands": [
  { "command": "my-tool.toUpperCase", "title": "My Tool: 转大写" }
],
"keybindings": [
  {
    "command": "my-tool.toUpperCase",
    "key": "ctrl+shift+u",
    "mac": "cmd+shift+u",
    "when": "editorTextFocus"
  }
]
```

### 例子 B：在状态栏显示当前行列号

```typescript
const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right, 100
);
statusBar.text = '$(info) Line: 1';
statusBar.show();

// 光标移动时更新
const updateStatus = vscode.window.onDidChangeTextEditorSelection(e => {
    const pos = e.textEditor.selection.active;
    statusBar.text = `$(info) L${pos.line + 1}:C${pos.character + 1}`;
});

context.subscriptions.push(statusBar, updateStatus);
```

### 例子 C：右键菜单 → 插入当前时间戳

```typescript
const insertTime = vscode.commands.registerCommand(
    'my-tool.insertTimestamp',
    () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        const now = new Date().toISOString();
        editor.edit(b => b.insert(editor.selection.active, now));
    }
);
context.subscriptions.push(insertTime);
```

`package.json` 里添加右键菜单：

```json
"menus": {
  "editor/context": [
    {
      "command": "my-tool.insertTimestamp",
      "group": "navigation"
    }
  ]
}
```

---

## 第六步：编译

```bash
cd my-tool
npm run compile
```

---


## 第七步：打包为 `.vsix` 并本地安装（不发布）

### 本地插件打包（unbundled）

无需额外配置，直接打包即可：

```bash
# 编译
npm run compile

# 打包
vsce package
# 会生成 my-tool-0.0.1.vsix
```

然后在 Cursor / VS Code 里安装：

**方法一（GUI）：**
扩展面板 → 右上角 `···` → `Install from VSIX...` → 选择 `.vsix` 文件

**方法二（命令行）：**
```bash
# VS Code
code --install-extension my-tool-0.0.1.vsix

# Cursor
cursor --install-extension my-tool-0.0.1.vsix
```

安装后重启编辑器即可永久使用，完全不需要发布到任何市场。

---

### 发布插件打包（esbuild）

如果希望打包产物更精简、加载更快，需要先配置 esbuild。

**1. 安装 esbuild**
```bash
npm install --save-dev esbuild
# 或
pnpm install --save-dev esbuild
```

**2. 在 `package.json` 的 scripts 里添加**
```json
"scripts": {
  "vscode:prepublish": "npm run esbuild-base -- --minify",
  "esbuild-base": "esbuild ./src/extension.ts --bundle --outfile=dist/extension.js --external:vscode --format=cjs --platform=node",
  "esbuild": "npm run esbuild-base -- --sourcemap",
  "esbuild-watch": "npm run esbuild-base -- --sourcemap --watch"
}
```

**3. 更新 `.vscodeignore`**，排除不需要打进 `.vsix` 的文件：
```
src/
node_modules/
.vscode/
```

**4. 确认 `package.json` 里 `main` 指向打包输出**
```json
"main": "./dist/extension.js"
```

**5. 打包**
```bash
vsce package
# vsce 会自动先执行 vscode:prepublish（即 esbuild 构建），再生成 .vsix
```

安装方式与本地打包相同，选择 `.vsix` 文件安装即可。

---

## 本地插件 vs 发布插件

### 概览

| 对比项 | 本地插件（unbundled） | 发布插件（esbuild） |
|--------|----------------------|---------------------|
| 额外配置 | 无需配置，开箱即用 | 需要安装并配置 esbuild |
| 打包产物 | 编译后的多个 `.js` 文件 + 完整 `node_modules` | 单个 `dist/extension.js`（依赖已内联） |
| 包体积 | 较大 | 较小 |
| 加载速度 | 较慢 | 更快 |
| 调试便利性 | 高（每个文件独立，报错定位准确） | 低（需配合 sourcemap） |
| 适用场景 | 本地自用、开发调试阶段 | 发布到市场、分发给他人 |

---

### 本地插件打包（unbundled）

开发阶段默认选项，无需额外配置，直接编译打包即可。

#### `vscode:prepublish` 执行的内容

```json
"vscode:prepublish": "npm run compile"
```

只是将 TypeScript 编译为 JavaScript，**不做任何打包处理**。

#### `.vsix` 包含的内容

```
my-tool-0.0.1.vsix
├── out/              ← 每个 .ts 对应一个 .js 文件
└── node_modules/     ← 完整的依赖目录（体积大）
```

#### 打包步骤

```bash
# 1. 编译
npm run compile

# 2. 打包
vsce package
```

#### 优缺点

**✅ 优点**
- 零配置，生成项目后直接可用
- 报错堆栈清晰，调试方便

**❌ 缺点**
- 包体积大（包含完整 `node_modules`）
- 加载较慢

---

### 发布插件打包（esbuild）

需要手动配置，适合对包体积和性能有要求的场景。

#### `vscode:prepublish` 执行的内容

```json
"vscode:prepublish": "npm run esbuild-base -- --minify"
```

使用 esbuild 将所有代码和依赖**打包并压缩为单个文件**。

#### `.vsix` 包含的内容

```
my-tool-0.0.1.vsix
└── dist/
    └── extension.js  ← 所有代码 + 依赖打包压缩进一个文件
```

注意：`node_modules` 已内联进 `extension.js`，无需打入包中。

#### 配置步骤

**1. 安装 esbuild**

```bash
npm install --save-dev esbuild
```

**2. 修改 `package.json` 的 scripts**

```json
"scripts": {
  "vscode:prepublish": "npm run esbuild-base -- --minify",
  "esbuild-base": "esbuild ./src/extension.ts --bundle --outfile=dist/extension.js --external:vscode --format=cjs --platform=node",
  "esbuild": "npm run esbuild-base -- --sourcemap",
  "esbuild-watch": "npm run esbuild-base -- --sourcemap --watch"
}
```

**3. 修改 `package.json` 的 main 入口**

```json
"main": "./dist/extension.js"
```

**4. 更新 `.vscodeignore`**，排除不需要打入包的文件

```
src/
node_modules/
.vscode/
```

**5. 打包**

```bash
vsce package
# vsce 会自动先执行 vscode:prepublish（esbuild 构建），再生成 .vsix
```

#### 优缺点

**✅ 优点**
- 包体积小，加载更快
- 适合分发和发布到扩展市场

**❌ 缺点**
- 需要额外配置
- 调试时需要 sourcemap 辅助定位

---

### 如何选择

```
本地自用 / 开发调试   →  unbundled（简单省事）
分发他人 / 发布市场   →  esbuild（体积小、加载快）
```

> 两种方式生成的 `.vsix` 安装方式完全相同，区别仅在于包内结构和体积。

---

## 常用 VS Code API 速查

| 功能 | API |
|------|-----|
| 弹出通知 | `vscode.window.showInformationMessage()` |
| 弹出输入框 | `vscode.window.showInputBox()` |
| 弹出下拉选择 | `vscode.window.showQuickPick()` |
| 获取当前编辑器 | `vscode.window.activeTextEditor` |
| 读取选中文字 | `editor.document.getText(editor.selection)` |
| 替换文字 | `editor.edit(b => b.replace(...))` |
| 状态栏 | `vscode.window.createStatusBarItem()` |
| 读取配置 | `vscode.workspace.getConfiguration()` |
| 监听文件保存 | `vscode.workspace.onDidSaveTextDocument()` |
| 打开终端 | `vscode.window.createTerminal()` |


打开 node_modules/@types/vscode/index.d.ts 文件，你可以查看我们完整的 API 集合。

完整 API 文档：[Extension API | Visual Studio Code](https://code.visualstudio.com/api/references/vscode-api)

---

## 进阶：延伸阅读


| 主题 | 官方文档 | 与本文的关系 |
|------|----------|----------------|
| **UX 指南** | [Extension Guidelines](https://code.visualstudio.com/api/ux-guidelines/overview)（遵循与 VS Code 原生界面一致的交互与文案模式） | 写完功能后用来统一命令命名、通知文案、设置项布局等 |
| **打包与体积** | [Bundling Extensions](https://code.visualstudio.com/api/working-with-extensions/bundling-extension)（减小体积、加快启动） | 与上文「第七步 → 发布插件打包（esbuild）」配套；细节与边界情况以官方为准 |
| **发布到市场** | [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) | 需 Publisher、Personal Access Token、`vsce publish`；本地 `.vsix` 安装方式仍见上文第七步 |
| **持续集成** | [Continuous Integration](https://code.visualstudio.com/api/working-with-extensions/continuous-integration) | 在仓库里自动 `compile` / `vsce package`，减少手工打包出错 |
| **问题反馈** | Wrapping Up → [Issue reporting](https://code.visualstudio.com/api/get-started/wrapping-up#issue-reporting) | 在 `package.json` 中配置 `bugs`、`repository`，便于用户从扩展页跳到 Issue |
