// ===========================================================
// 🎀 outfit_presets.js — Save & apply whole outfit "looks"
// ===========================================================
//
//  A PRESET is a named set of clothes (and optional colors) that you can
//  apply to the pet with a single tap. Think of it as a saved outfit.
//
//  HOW TO ADD / EDIT A PRESET (one place — the list below):
//    1. Add an object to window.OUTFIT_PRESETS.
//    2. `clothes` maps a category -> the item id from outfit_config.js.
//       Categories: topUnderwear, bottomUnderwear, onepieceUnderwear,
//                   top, bottom, dress, shoes, hat.
//       Any category you leave out is treated as "None" (taken off).
//    3. `colors` is OPTIONAL. Map a category -> a color name:
//       Original, Red, Orange, Yellow, Green, Cyan, Blue, Purple, Pink.
//    4. Refresh. A button for the preset appears in the 🎀 Outfits panel.
//
//  Example:
//    { name: "Cool", emoji: "😎",
//      clothes: { top: "top1", bottom: "pants1", shoes: "shoes1" },
//      colors:  { top: "Blue", bottom: "Green" } }
//
//  There is only ONE pet in this build, so a preset is a single look — no
//  per-character variants. Anything the pet doesn't have (no item listed in
//  outfit_config.js, or a missing PNG) is simply skipped, so a preset can
//  safely name garments you haven't drawn yet.
// ===========================================================

window.OUTFIT_PRESETS = [
  {
    name: "Mozzarella Cookie",
    emoji: "🧀",
    clothes: {
      topUnderwear: "topunderwear1",
      bottomUnderwear: "bottomunderwear1",
      dress: "dress1",
      shoes: "shoes1",
      hat: "hat1",
    },
    // Art is already coloured — leave it as drawn.
  },
  {
    name: "Party Dress",
    emoji: "🎀",
    clothes: { dress: "dress1", shoes: "shoes1", hat: "hat1" },
    colors:  { dress: "Red", hat: "Yellow" },
  },
  {
    name: "Comfy",
    emoji: "🩲",
    clothes: { topUnderwear: "topunderwear1", bottomUnderwear: "bottomunderwear1" },
  },
  {
    name: "Swimsuit",
    emoji: "🩱",
    clothes: { topUnderwear: "topunderwear2", bottomUnderwear: "bottomunderwear1" },
    // Bikini top + matching bottoms, drawn as a set — no colour override.
  },
  {
    name: "Birthday Suit",
    emoji: "🚫",
    clothes: {}, // take everything off
  },
];

// ===========================================================
// ⚙️ Apply logic + UI (no need to edit below to add presets)
// ===========================================================
(() => {
  const DEFAULT_COLOR = "Original";

  function categoryKeys() {
    if (window.OUTFIT_CONFIG && Array.isArray(window.OUTFIT_CONFIG.categories)) {
      return window.OUTFIT_CONFIG.categories.map(c => c.key);
    }
    // Fallback: whatever the current outfit object already has.
    return Object.keys(window.selectedClothes || {});
  }

  // An item the pet doesn't have (not in the catalog, or its art failed to
  // load) resolves to 0 (None), so a preset that names a garment you haven't
  // drawn yet still applies — the pet just doesn't wear that piece.
  function resolveItem(category, id) {
    if (id === 0 || id === "0" || id == null) return 0;
    const items = (window.dressUpCatalog && window.dressUpCatalog[category] &&
      window.dressUpCatalog[category].items) || null;
    if (!items) return id;
    const it = items[id];
    return (it && (!it.img || !it.img._failed)) ? id : 0;
  }

  // Apply a full preset. Every category not named by the preset is cleared, so
  // a preset always defines the complete look.
  function applyPreset(preset) {
    if (!preset) return;

    if (!window.selectedClothes || typeof window.selectedClothes !== "object") window.selectedClothes = {};
    if (!window.clothingColors || typeof window.clothingColors !== "object") window.clothingColors = {};
    const sel = window.selectedClothes;
    const col = window.clothingColors;

    const clothes = preset.clothes || {};
    const colors = preset.colors || {};

    categoryKeys().forEach(k => {
      sel[k] = (clothes[k] != null) ? resolveItem(k, clothes[k]) : 0;
      col[k] = colors[k] || DEFAULT_COLOR;
    });

    // Refresh the Dress Up panel/button if the outfit system exposes the hook.
    if (typeof window.refreshDressUpUI === "function") window.refreshDressUpUI();
  }

  // Public API so other code can apply a preset by name.
  window.applyOutfitPreset = function (name) {
    const list = window.OUTFIT_PRESETS || [];
    const preset = list.find(p => p && p.name === name);
    applyPreset(preset);
    return !!preset;
  };

  // -------------------------------------------------------------------------
  // UI: floating "🎀 Outfits" button + popup of preset buttons
  // -------------------------------------------------------------------------
  const btnCss =
    "position:fixed;left:10px;bottom:calc(65px + env(safe-area-inset-bottom));" +
    "z-index:9998;padding:6px 12px;font-size:clamp(11px,2.5vw,14px);cursor:pointer;" +
    "border-radius:8px;border:none;background:rgba(255,255,255,.92);" +
    "box-shadow:0 2px 8px rgba(0,0,0,.15);white-space:nowrap;";

  let presetBtn = document.getElementById("preset-btn");
  if (!presetBtn) {
    presetBtn = document.createElement("button");
    presetBtn.id = "preset-btn";
    presetBtn.textContent = "🎀 Outfits";
    presetBtn.style.cssText = btnCss;
    document.body.appendChild(presetBtn);
  }

  let panel = document.getElementById("preset-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "preset-panel";
    panel.style.cssText =
      "position:fixed;left:10px;bottom:calc(108px + env(safe-area-inset-bottom));" +
      "width:min(280px,calc(100vw - 20px));max-height:54vh;overflow:auto;display:none;" +
      "z-index:9999;padding:10px;border-radius:12px;background:rgba(255,255,255,.97);" +
      "box-shadow:0 6px 24px rgba(0,0,0,.22);" +
      "font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;";
    document.body.appendChild(panel);
  }

  function renderPanel() {
    panel.innerHTML = "";

    const title = document.createElement("div");
    title.style.cssText =
      "font-weight:700;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:8px;";
    title.innerHTML = "<span>Outfit Presets</span>";
    const close = document.createElement("button");
    close.textContent = "✕";
    close.style.cssText = "border:0;border-radius:9px;padding:4px 8px;background:rgba(0,0,0,.08);cursor:pointer;";
    close.onclick = () => { panel.style.display = "none"; };
    title.appendChild(close);
    panel.appendChild(title);

    const list = document.createElement("div");
    list.style.cssText = "display:flex;flex-direction:column;gap:6px;";
    (window.OUTFIT_PRESETS || []).forEach(preset => {
      if (!preset || !preset.name) return;
      const b = document.createElement("button");
      b.textContent = `${preset.emoji ? preset.emoji + " " : ""}${preset.name}`;
      b.style.cssText =
        "text-align:left;border:1px solid rgba(0,0,0,.12);border-radius:10px;padding:9px 12px;" +
        "background:#fff;cursor:pointer;font-size:14px;";
      b.onmouseenter = () => { b.style.background = "#fff7e6"; b.style.borderColor = "#f59e0b"; };
      b.onmouseleave = () => { b.style.background = "#fff"; b.style.borderColor = "rgba(0,0,0,.12)"; };
      b.onclick = () => { applyPreset(preset); };
      list.appendChild(b);
    });
    panel.appendChild(list);

    const note = document.createElement("div");
    note.textContent = "Tip: add or edit looks in outfit_presets.js.";
    note.style.cssText = "font-size:11px;opacity:.6;margin-top:8px;";
    panel.appendChild(note);
  }

  presetBtn.onclick = () => {
    const opening = panel.style.display === "none";
    panel.style.display = opening ? "block" : "none";
    if (opening) {
      // Both panels hang in the same slot under the bar — show one at a time.
      const dress = document.getElementById("dressup-panel");
      if (dress) dress.style.display = "none";
      renderPanel();
    }
  };

  // Lets the desktop shell open the panel from the tray / right-click menu.
  window.renderPresetPanel = renderPanel;
})();
