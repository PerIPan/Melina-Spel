# Tekenbord — Ontwerp

**Datum:** 2026-05-30
**Project:** melina-spel (game-hub)
**Status:** Goedgekeurd

## Doel

Een nieuw spel "Tekenbord" toevoegen aan de Melina-hub waarmee een jong kind vrij
kan tekenen, kleuren, stempelen en kleurplaten kan inkleuren — op tablet (vinger)
en desktop (muis). Past in het bestaande patroon: een component in `games/` met
een `onBack`-knop, een kaart op het startscherm, en een eigen sticker/achievement-set
in `localStorage`.

## Niet in scope (YAGNI)

- Permanente galerij van tekeningen in de app. Opslaan = PNG-download. Later uit te breiden.
- Server/database-opslag. Alles blijft client-side.
- Lagen, vormgereedschap (rechthoek/cirkel), tekst.

## Architectuur

Eén zelfstandige component met eigen CSS, conform de bestaande games.

- `src/games/DrawGame.tsx` — alle teken-logica en UI
- `src/games/DrawGame.css` — opmaak
- `src/games/coloringPages.ts` — ingebouwde kleurplaten als SVG-padpunten/lijntekeningen
- Integratie in `src/App.tsx`:
  - `Screen`-union uitbreiden met `'tekenen'`
  - kaart "🎨 Tekenen" toevoegen aan `.game-cards`
  - render `<DrawGame onBack={...} />` wanneer `screen === 'tekenen'`
  - sticker-sectie "🎨 Tekenen" in de stickermuur met `DRAW_STICKER_DEFS`

### Tekenvlak

- Eén `<canvas>` dat het gehele tekenvlak vormt; tekenen via **Pointer Events**
  (`pointerdown` / `pointermove` / `pointerup`), zodat vinger én muis werken.
- Tekenen gebeurt door lijnstukjes te trekken tussen opeenvolgende pointer-posities
  (`lineTo` + `stroke`, met `lineCap: round` en `lineJoin: round` voor vloeiende lijnen).
- Canvas-resolutie volgt de container met `devicePixelRatio` voor scherpe lijnen.

### Gereedschapsstaat

Per-tool state in de component:

- `tool`: `'brush' | 'rainbow' | 'eraser' | 'stamp'`
- `color`: huidige kleur (hex)
- `size`: penseeldikte — 3 vaste stappen (dun/normaal/dik)
- `stamp`: gekozen emoji bij stempel-modus

### Ongedaan maken (undo)

- Na elke afgeronde streek/stempel een snapshot opslaan via `canvas.toDataURL()`
  in een ring-buffer van max ~10 stappen.
- Undo herstelt de vorige snapshot door het beeld terug op het canvas te tekenen.

### Kleurplaten

- `coloringPages.ts` bevat een handvol simpele lijntekeningen (kat, vis, vlinder,
  bloem, hartje, ster, huis, auto) als inline SVG-paden.
- Kiezen van een kleurplaat tekent de omtrek licht (grijs) als achtergrond op het
  canvas; het kind kleurt eroverheen. Bij opslaan/wissen wordt het geheel platgeslagen.
- Implementatie: de SVG renderen naar een `Image`/`Path2D` en op het canvas tekenen.

### Opslaan

- "Opslaan"-knop genereert een PNG via `canvas.toDataURL('image/png')` en triggert
  een download met een `<a download>`-element.

## UI / layout

- **Boven:** terug-knop (← of 🏠) linksboven.
- **Midden:** groot tekenvlak (vult het meeste scherm).
- **Onder:** dikke, kindvriendelijke knoppenbalk:
  - kleurenpalet (rij vrolijke kleuren) + kleurenkiezer (`<input type="color">`)
  - 🌈 regenboog-kwast
  - ✏️ 3 diktes · 🩹 gum
  - 🐾 stempel-kiezer
  - 📄 kleurplaat-kiezer
  - ↩️ ongedaan maken · 🗑️ wissen (met bevestiging) · 💾 opslaan
- Grote knoppen, hoge contrasten, geschikt voor jong kind op tablet.

## Geluid

Hergebruik `utils/sounds.ts` waar logisch (klik bij knop, "leuk"-geluidje bij sticker),
en respecteer de globale mute-status.

## Stickers / achievements

Eigen set in `localStorage` onder sleutel `drawStickers` (array van id-strings),
zelfde patroon als `snakeStickers` / `animalStickers` / `memoryStickers`.

| id              | emoji | naam                  | voorwaarde                         |
|-----------------|-------|-----------------------|------------------------------------|
| first_draw      | 🖌️    | Eerste Tekening       | eerste streek gezet                |
| rainbow_used    | 🌈    | Regenboog Kunst       | regenboog-kwast gebruikt           |
| all_colors      | 🎨    | Kleurenmeester        | alle paletkleuren gebruikt         |
| stamp_fan       | 🐾    | Stempel Fan           | 10 stempels geplaatst              |
| saved_5         | 🖼️    | Kunstenaar            | 5 tekeningen opgeslagen            |
| first_coloring  | 📄    | Kleurplaat Held       | eerste kleurplaat ingekleurd+opgeslagen |

Bij verdienen: korte sticker-popup (zoals in SnakeGame). De hub leest `drawStickers`
opnieuw in bij terugkeer (zie `onBack` in `App.tsx`).

## Testen / verificatie

- `npm run build` (tsc + vite) moet slagen.
- `npm run lint` moet schoon zijn.
- Handmatig in de browser: tekenen met muis, kleur wisselen, regenboog, gum, undo,
  wissen-bevestiging, stempel plaatsen, kleurplaat kiezen + inkleuren, opslaan
  (PNG download), sticker verschijnt en staat in de stickermuur.

## Open vragen

- Leeftijd Melina niet bevestigd → standaard jong kind (grote knoppen).
