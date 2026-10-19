# Quality and Compatibility Notes

**Development status: Work in Progress (WIP).** These results are limited tests, not a guarantee that every game or feature works without errors.


**Release date: October 18, 2026**

## Verification scope

The packaged program contains 360 selectable game configurations and a local library of graphical assets. The source JavaScript and markup are checked for missing references and parse errors during packaging. The ZIP is checked for integrity.

Browser checks were completed using an embedded-page test because the test environment blocks direct page navigation. The creator initialized with 360 selectable configurations and loaded its artwork catalog without script exceptions. A Rail Switch Yard game was generated, previewed, and downloaded as a standalone ZIP; its integrity check passed, and it ran in the embedded browser test at a phone-size viewport without scrolling or JavaScript errors. Direct double-click launching remains unverified in this environment. These checks focus on startup, prompt routing, game preview, common keyboard/touch input, standalone ZIP contents, and viewport sizing. The entire catalog has **not** been exhaustively human-playtested, and successful initialization alone does not guarantee that a game is fully balanced or free from logical bugs.

## Practical considerations

- Browser storage may be cleared by privacy settings or when local website data is removed. Export important projects.
- Some advanced actions work best with a keyboard and mouse; mobile controls vary by engine.
- Some browser restrictions can affect direct `file://` launching or permissions for local files.
- The creator does not supply hosted services, online multiplayer, or cloud-saved accounts.
- A request involving an unsupported mechanic may not be fully implemented; check the generated game and its controls.

Please preserve the full folder structure when extracting the creator or an exported game.
