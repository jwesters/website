# ArcadeWeaver Studio

**Status: Work in Progress (WIP)**  
**Release date: October 18, 2026**

ArcadeWeaver Studio is an offline, browser-based game creator with a prompt-driven workflow, a searchable artwork library, a playable preview, revisions, and standalone game ZIP exports.

## Getting started

Extract the complete ZIP and open `index.html` in a modern desktop browser. Keep the `assets` folder alongside the HTML file. For iPhone or iPad use, open the extracted application from a static website that serves the whole folder together (such as a private or public static host); opening just `index.html` in the iOS Files preview may not allow its companion scripts and images to load.

Type a game idea and select **Create / Revise**. Optionally enable **Ask questions first**, then select **Generate game**. The preview uses a lightweight document that loads its game engines separately; if a game script fails to load, a visible error appears instead of a blank screen.

The app is rule-based and supports a fixed catalog of engines and variations, not arbitrary AI-generated code.

## Artwork and performance

The original collection of 22,236 SVG artwork entries is indexed in **62 category-grouped WebP atlases**; duplicate drawings share a single atlas cell. A compact index supplies each picture's sheet and coordinates. Transparent high-resolution PNG animal and object images remain as separate files to retain detail. The creator loads atlas images on demand rather than parsing thousands of embedded SVG strings at startup.

When you export a standalone game, the required atlas sheets or detailed PNGs are included with it. Other artwork is not copied into that game's ZIP. Offline export uses lazily loaded binary modules so it does not depend on web-only `fetch()` calls.

## Projects and games

- **Download game ZIP** packages playable code, selected artwork, and a project/prompt record.
- **Project** exports an editable project for backup.
- **Open project** reloads an existing project.
- **Undo revision** returns to the previous configuration.

## Limitations

The catalog contains 360 choices, including variants sharing an engine. Some engines require more testing and improvement, and some art is stylized rather than realistic. Safari on an actual iPhone has not been physically tested in this build; see `QA_REPORT.md`. Keep an independent backup of important project files.
