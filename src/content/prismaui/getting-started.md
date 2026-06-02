---
title: 'Getting Started'
---
# Getting Started with PrismaUI_F4

## Step 1 — Install the Framework

Download the main file from Nexus and install it with your mod manager. This is the framework DLL that every PrismaUI plugin depends on. You need this before anything else will work.

## Step 2 — Try the Example Plugin

Download the optional **F4SE Prisma Bridge Example** file from Nexus and install it the same way.

Load a save game and press **F3**. A panel opens with three tabs:

- **Papyrus Bridge** — live input fields to call `prisma.getGlobal` and `prisma.getProperty` against any mod in your load order. Enter an `.esp` name and a form ID and read or write values in real time — no code required.
- **C++ Bridge** — shows the focus state of the view and lets you send a text message directly to the plugin's C++ code, verified in the F4SE log.
- **Event Log** — running log of every bridge call and response fired during the session.

Press **F3** again or click Close to dismiss.

This is also the best way to test `window.prisma` against your own mod's data before writing any code.

<callout type="important">The compiled example is a demo tool, not something you can ship as your own mod. The DLL is binary — you cannot change the key binding, plugin name, or HTML it loads without rebuilding from source. To make your own mod, follow Step 3.</callout>

## Step 3 — Build Your Own Plugin

The example source in [NomadsReach/framework-F4-Conversion](https://github.com/NomadsReach/framework-F4-Conversion) is the starting point. Fork it, rename it, and build your own plugin.

### Prerequisites

- **Fallout 4 runtime ≥ 1.10.162** + **F4SE**
- **C++23 compiler** — [MSVC Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2019), free, select "Desktop development with C++" during install
- **CommonLibF4** — download [Dear-Modding-FO4/commonlibf4](https://github.com/Dear-Modding-FO4/commonlibf4) and place it at `lib/commonlibf4` inside the repo
- **xmake**

### Clone and Set Up

```bash
git clone https://github.com/<your-username>/framework-F4-Conversion.git
```

Place the CommonLibF4 source at `framework-F4-Conversion/lib/commonlibf4`.

### Rename the Project

Open `example-f4se-plugin/xmake.lua` and update the target name, filename, and plugin metadata. Keep these in sync:

- target name in `xmake.lua`
- the `name` field in `add_rules("commonlibf4.plugin", { ... })`
- the plugin name string in `main.cpp`

### Build

Run `build.bat` from inside `example-f4se-plugin/`:

```
build.bat
```

This sets up the MSVC environment and runs xmake automatically. If you already have a vcvars terminal open:

```bash
xmake f -m release -y
xmake build <your-plugin-name>
```

### Deploy

Copy the built DLL to `F4SE/Plugins/` and your HTML view to `Data/PrismaUI_F4/views/`. The example already shows the correct layout.
