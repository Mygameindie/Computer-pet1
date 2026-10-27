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
//  BOY / GIRL: the pet's gender is set in pet_gender.js. A preset can give the
//  boy his own version of the look with a `boy` block (and the girl a `girl`
//  block); the top-level clothes/colors are the default for whoever has no
//  block. This is how the same preset dresses the girl in a dress and the boy
//  in a top + pants:
//
//    { name: "Party", emoji: "🎀",
//      clothes: { dress: "dress1", shoes: "shoes1" },       // girl (default)
//      colors:  { dress: "Red" },
//      boy: {                                               // boy version
//        clothes: { top: "top1", bottom: "pants1", shoes: "shoes1" },
//        colors:  { top: "Red" },
//      } }
//
//  You can write ids either way ("top1" or "top1_2") — they are translated to
//  the id that exists for the gender being dressed, and anything that gender
//  doesn't have is simply skipped (taken off).
//
//  NOTE: presets only use item ids that exist in outfit_config.js. If you add
//  new clothes there, you can reference them here right away.
// ===========================================================

window.OUTFIT_PRESETS = [
  {
    name: "Casual",
    emoji: "👕",
	boy: {
    clothes: { bottomUnderwear: "boxers1_2",
      bodysuit: "bodysuit1_2",
    },
	  },
  },
  {
    name: "Comfy",
    emoji: "🩲",
    boy: {
      clothes: { bottomUnderwear: "boxers1" },
    // Boy version: no top underwear — just boxers.
   },
  },
  {
    name: "Swimsuit",
    emoji: "🩱",
    clothes: { topUnderwear: "topunderwear1", bottomUnderwear: "bottomunderwear1" },
    // Boy version: no one-piece — he swims in boxers.
    boy: {
      clothes: { bottomUnderwear: "boxers1" },
      colors:  { bottomUnderwear: "Cyan" },
    },
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
    // Fallback: whatever the active outfit object already has.
    return Object.keys((window.selectedClothes && window.selectedClothes[0]) || {});
  }

  function gender() {
    return (window.PetGender && window.PetGender.get()) === "boy" ? "boy" : "girl";
  }

  // Presets are written with plain ids ("top1"). The boy's wardrobe uses the
  // "_2" names ("top1_2"), so translate each id to the one that actually
  // exists for the gender being dressed. An item that gender doesn't have
  // (a dress on a boy) resolves to 0 (None) instead of breaking the look.
  function resolveItem(category, id) {
    if (id === 0 || id === "0" || id == null) return 0;
    const items = (window.dressUpCatalog && window.dressUpCatalog[0] &&
      window.dressUpCatalog[0][category] && window.dressUpCatalog[0][category].items) || null;
    if (!items) return id;
    if (window.PetGender) {
      const forGender = window.PetGender.itemId(id);
      if (items[forGender]) return forGender;
    }
    if (items[id]) return id;
    const stripped = String(id).replace(/_\d+$/, "");
    if (items[stripped]) return stripped;
    return 0;
  }

  // A preset can define a different look per gender: a `girl`/`boy` block
  // ({ clothes, colors }) wins for that gender; otherwise the preset's
  // top-level clothes/colors are used.
  function outfitForGender(preset) {
    const per = preset[gender()];
    // A per-gender clothes list is a complete look of its own, so it does NOT
    // inherit the other look's colors (those may belong to garments this
    // gender isn't wearing) — omit colors and you get Original.
    if (per && per.clothes) return { clothes: per.clothes, colors: per.colors || {} };
    // Colors-only override: same clothes, different colors for this gender.
    if (per && per.colors) return { clothes: preset.clothes || {}, colors: per.colors };
    return { clothes: preset.clothes || {}, colors: preset.colors || {} };
  }

  // Apply a full preset to the pet (index 0). Every category not named by the
  // preset is cleared, so a preset always defines the complete look.
  function applyPreset(preset) {
    if (!preset) return;
    if (window._modeName === "shower") return; // clothes are off in the shower

    if (!Array.isArray(window.selectedClothes)) window.selectedClothes = [{}];
    if (!Array.isArray(window.clothingColors)) window.clothingColors = [{}];
    const sel = (window.selectedClothes[0] = window.selectedClothes[0] || {});
    const col = (window.clothingColors[0] = window.clothingColors[0] || {});

    const { clothes, colors } = outfitForGender(preset);

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
    if (window._modeName === "shower") return;
    panel.style.display = panel.style.display === "none" ? "block" : "none";
    if (panel.style.display === "block") renderPanel();
  };

  // -------------------------------------------------------------------------
  // Stay in sync with the shower rules: clothes (and presets) are hidden there.
  // -------------------------------------------------------------------------
  function hidePresetUI() {
    presetBtn.style.display = "none";
    panel.style.display = "none";
  }
  function showPresetUI() {
    presetBtn.style.display = "block";
  }

  const _enterShower = window.enterShowerClothesRules;
  window.enterShowerClothesRules = function () {
    hidePresetUI();
    if (typeof _enterShower === "function") return _enterShower.apply(this, arguments);
  };
  const _exitShower = window.exitShowerClothesRules;
  window.exitShowerClothesRules = function () {
    showPresetUI();
    if (typeof _exitShower === "function") return _exitShower.apply(this, arguments);
  };

  if (window._modeName === "shower") hidePresetUI();
})();
