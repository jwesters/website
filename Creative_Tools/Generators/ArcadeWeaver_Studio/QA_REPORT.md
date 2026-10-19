# QA and Compatibility Notes

**Status: Work in Progress (WIP)**  
**Release date: October 18, 2026**

## Automated checks completed

- 22,236 SVG artwork records were packed into 62 WebP atlas sheets; 11,750 unique SVG sources were rasterized and 10,486 duplicate-source records share atlas slots. No rasterization errors were reported.
- Browser-based mobile-sized testing with Chromium emulation (390 × 844) verified that the creator initializes all 360 catalog choices and all 22,296 artwork entries without JavaScript exceptions.
- The **Ask questions first → Generate game** flow displayed a running Wildlife Photo Safari engine in a lightweight `srcdoc` iframe. Its high-resolution wildlife image loaded successfully.
- Touch input on the game canvas reduced remaining photo film, demonstrating a working gameplay action.
- Character-art revisions and decorative atlas-art revisions were exported as standalone ZIPs. The ZIPs included the required PNG or WebP artwork and passed archive integrity checks.
- Both standalone game ZIPs ran in a mobile-sized browser simulation with no JavaScript exceptions, and the atlas scenery sprite loaded from the correct rectangle.
- The tested creator layout and game exports did not require horizontal page scrolling at a 390-pixel viewport.


## Measured startup comparison

Using Chromium mobile emulation (390 × 844) with local-resource interception, three page-initialization measurements were collected for each package. The original package took 1.959, 1.286, and 1.049 seconds (median **1.286 s**); the optimized package took 0.199, 0.217, and 0.209 seconds (median **0.209 s**). This is approximately a **6.2× reduction in page-init time in this particular test harness**. Local file extraction and physical iOS Safari speed were not measured.

After obsolete files were removed, the optimized studio contained **564 files**, compared with **22,710 files** in the previous archive, a reduction of approximately **97.5%**. The higher-quality PNG files remain separate, and WebP atlas sheets are loaded only when needed.

## Important limitations

The browser harness prevented direct navigation to local `file://` URLs and local HTTP pages. To test the browser logic, pages were rendered using a local-resource interception harness rather than by launching them through the normal browser address bar. **Actual iOS Safari on a physical iPhone has not been tested**, and opening a standalone HTML file from the iOS Files app may prevent relative resources from loading. For iOS, use a static website that serves the extracted folder without altering its paths.

The 360 catalog entries have not received exhaustive human playthroughs. Graphics in atlases are rasterized to 112-pixel cells, so enlarging them substantially can be less sharp than the original vector artwork. This remains a work in progress.
