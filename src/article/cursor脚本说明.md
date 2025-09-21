---
title: cursor脚本说明
category:
  - cursor
date: 2025-09-21
---

![](file/cursor脚本.txt)

好的，以下是对这个 PowerShell 脚本 `cursor_win_id_modifier.txt` 的**中文详细解读**。此脚本的主要功能是：

> **修改 Cursor 编辑器 的设备 ID**，包括配置文件中的 machineId/macMachineId/sqmId 等，以及 Windows 系统的注册表中的 `MachineGuid`，并提供可选功能来**禁用 Cursor 自动更新**。

------

## 🧩 1. 脚本初始化设置

### 设置输出编码为 UTF-8：

```powershell
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

目的是让终端正确显示中文和其他 UTF-8 字符，防止乱码。

------

### 定义颜色变量用于打印美化：

```powershell
$RED = "`e[31m"
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$BLUE = "`e[34m"
$NC = "`e[0m"
```

这些是 ANSI 控制码，设置输出文字颜色（红、绿、黄、蓝）和清除颜色。

------

### 定义配置文件路径：

```powershell
$STORAGE_FILE = "$env:APPDATA\Cursor\User\globalStorage\storage.json"
$BACKUP_DIR = "$env:APPDATA\Cursor\User\globalStorage\backups"
```

- `STORAGE_FILE` 是 Cursor 的配置文件路径。
- `BACKUP_DIR` 是备份目录，用于保存旧的配置。

------

## 🔐 2. 权限检测（是否管理员）

```powershell
function Test-Administrator {
    ...
}

if (-not (Test-Administrator)) {
    Write-Host "$RED[错误]$NC 请以管理员身份运行此脚本"
    ...
    exit 1
}
```

这部分检测当前是否以管理员身份运行，如果不是，则提示并退出。

------

## 🎨 3. 显示 Logo 和提示信息

打印一个 ASCII 艺术的 LOGO，以及关于公众号【煎饼果子卷AI】的宣传语和使用说明。目的是美观和引导用户。

------

## 🔍 4. 获取 Cursor 当前版本

```powershell
function Get-CursorVersion {
    ...
}
$cursorVersion = Get-CursorVersion
```

从 `package.json` 文件中读取 Cursor 的版本信息，支持主路径和备用路径。

------

## 🛑 5. 检测并关闭 Cursor 进程

```powershell
function Close-CursorProcess { ... }
Close-CursorProcess "Cursor"
Close-CursorProcess "cursor"
```

- 检查是否有 Cursor 编辑器在运行。
- 如果有，会尝试强制关闭，最多重试 5 次，每次等待 1 秒。

------

## 💾 6. 创建备份目录并备份配置文件

```powershell
if (Test-Path $STORAGE_FILE) {
    ...
    Copy-Item $STORAGE_FILE ...
}
```

确保配置文件存在，若存在则进行备份，防止出错后无法恢复。

------

## 🔧 7. 生成新 ID

包括以下几个 ID 的生成：

| ID 名称        | 说明                  |
| -------------- | --------------------- |
| `machineId`    | 替代原始机器标识      |
| `macMachineId` | UUID 样式生成         |
| `devDeviceId`  | 随机 GUID             |
| `sqmId`        | 用大写 GUID 包裹 `{}` |
| `MachineGuid`  | 系统注册表中的 GUID   |

核心函数如下：

```powershell
function Get-RandomHex { ... }
function New-StandardMachineId { ... }
```

------

## 🧱 8. 更新注册表的 MachineGuid

```powershell
function Update-MachineGuid {
    ...
}
```

- 创建注册表路径（若不存在）。
- 获取旧的 `MachineGuid` 并备份。
- 设置新的随机 GUID。
- 更新失败会尝试自动导入备份文件。

------

## ⚙️ 9. 修改 Cursor 配置文件中的 ID

```powershell
$config.'telemetry.machineId' = $MACHINE_ID
$config.'telemetry.macMachineId' = $MAC_MACHINE_ID
$config.'telemetry.devDeviceId' = $UUID
$config.'telemetry.sqmId' = $SQM_ID
```

- 更新配置文件中 `telemetry` 下的 4 个设备标识。
- 写入前会先将配置备份。
- 出错会还原为原始内容。

------

## 📴 10. 询问是否禁用 Cursor 自动更新

```powershell
Write-Host "$YELLOW[询问]$NC 是否要禁用 Cursor 自动更新功能？"
```

用户可以选择：

- `0`：不禁用（默认）
- `1`：禁用，方式为：
  - 删除 `cursor-updater` 目录
  - 创建同名空文件
  - 设置只读权限
  - 用 `icacls` 设置访问权限为只读

并提供手动操作说明以防自动操作失败。

------

## 📁 11. 打印文件结构

以树状图形式展示：

```text
C:\Users\<用户名>\AppData\Roaming\Cursor\User
├── globalStorage
│   ├── storage.json (已修改)
│   └── backups
│       └── storage.json.backup_20250409...
```

------

## ✍️ 12. 补充：专用配置文件写入函数

```powershell
function Write-ConfigFile {
    ...
}
```

使用 UTF-8（无 BOM）编码 + Linux 风格换行符 LF (`\n`) 写入 JSON 文件，防止跨平台兼容问题。

------

## 📦 总结

此脚本功能丰富，涵盖了：

✅ 自动关闭 Cursor 进程
 ✅ 修改配置文件中的设备 ID
 ✅ 修改注册表中的 MachineGuid
 ✅ 自动备份原始数据
 ✅ 提供自动和手动两种方式禁用更新
 ✅ 用颜色和结构化信息优化用户交互体验

------

如果你希望我把这些内容**整理成 Markdown 文档**或者制作成**图解流程图/操作指引**，我也可以帮你完成。需要吗？