# Artwork Library

**Release date: October 18, 2026**  
**Status: Work in Progress (WIP)**

ArcadeWeaver Studio includes **22,296 searchable artwork entries**: 22,236 atlas-indexed vector illustrations plus 60 high-resolution PNG artwork listings, which refer to 36 unique PNG images.

## Atlases

Rather than requiring thousands of small SVG files, vector illustrations have been rasterized into **62 WebP atlases**. Each entry's metadata identifies an atlas sheet and the source rectangle `[x, y, width, height]`. The game renderer draws that rectangle directly into the requested space. Duplicate source artwork shares an atlas cell, reducing processing and storage overhead.

Most atlas images are rendered at 112 × 112 pixels per cell for in-game icons and character art. This is a raster preview, not the original unlimited-resolution SVG. The 36 detailed PNG images remain at their original resolution.

Atlas sheets are loaded as needed; exports include only the selected sheets. Images are available offline after extracting the complete studio archive.

Some illustrations use Font Awesome Free under CC BY 4.0; see `THIRD_PARTY_ASSET_CREDITS.txt` for attribution.
