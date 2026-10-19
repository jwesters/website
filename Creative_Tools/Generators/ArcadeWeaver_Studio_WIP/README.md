# ArcadeWeaver Studio

**Status: Work in Progress (WIP).** This application is actively under development and testing. Some game mechanics, generated assets, and features may be incomplete or contain bugs.

**Release date: October 18, 2026**

ArcadeWeaver Studio is a prompt-first, fully offline HTML game creator. It contains a catalog of playable engines and rule variations, an artwork library, a game preview, conversational editing, and standalone game ZIP export.

## Getting started

Extract the entire ZIP, keep `assets` beside `index.html`, and double-click **index.html** on Windows or macOS. Use a modern browser. No sign-in or internet connection is required for normal operation.

Type an idea in the prompt field and choose **Create / Revise**. Enable **Ask questions first** to answer design questions before you generate. Play the preview with the controls listed in the game. After generation, use the same prompt field to make changes.

## Projects and standalone games

- **Download game ZIP** packages the game's HTML, local scripts and selected artwork, an editable project JSON, and a prompt transcript.
- **Project** saves a creator project that can be reopened using **Open project**.
- **Undo revision** restores the previous edit during the current session.
- Exported games fill the viewport and are designed not to require vertical page scrolling.

## Capabilities and limitations

The catalog contains **360 selectable game types**, including separately implemented engines and themed ruleset variants. Not every catalog choice represents a completely different underlying engine. The creator is offline and rule-based: it can assemble supported mechanics and assets, but cannot autonomously write an arbitrary new game from any possible prompt. It cannot provide hosted multiplayer, cloud leaderboards, or internet-backed accounts while remaining offline.

Artwork includes vector assets and selected raster illustrations; visual fidelity varies. Some genre-specific behaviors require additional manual testing. See **GAME_LIBRARY.md**, **ASSET_LIBRARY_GUIDE.md**, and **QA_REPORT.md** for details.
