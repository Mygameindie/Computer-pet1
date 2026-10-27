// ===========================================================
// 🚻 pet_gender.js — ONE pet, boy or girl (the single setting)
// ===========================================================
//
//  This template has only ONE pet. This file is where you say whether that
//  pet is a GIRL or a BOY. Everything else follows automatically:
//
//    • the pet's body art          (base.png  ->  base_2.png)
//    • the clothes it can wear     (outfit_config.js: girl list / boy list)
//    • the boy clothing rules      (no dress, no skirt, no top underwear,
//                                   no one-piece — he wears boxers + pants)
//    • the outfit presets          (outfit_presets.js: per-gender looks)
//
//  ── HOW TO SET THE GENDER ────────────────────────────────────────────────
//  Change ONE word below:      gender: "girl"      or      gender: "boy"
//  Refresh. Done.
//
//  The gender is FIXED: the line below is the only thing that decides it.
//  There is no in-game switch and nothing is remembered on the device, so a
//  girl pet is always a girl and a boy pet is always a boy. (To let players
//  flip it again, set showSwitchButton and remember back to true.)
//
//  ── ART NAMING ───────────────────────────────────────────────────────────
//  Girl art keeps the plain names you already have:
//      base.png, base_1.png, base_sick.png, base_disgust.png, base_bath2.png …
//  Boy art is the same name with "_2" added before ".png":
//      base_2.png, base_1_2.png, base_sick_2.png, base_disgust_2.png …
//  (Same "_2" convention the boy clothes use: top1 -> top1_2.)
//
//  MISSING BOY ART IS SAFE: if base_sick_2.png doesn't exist yet, the pet
//  just uses the normal base_sick.png instead — nothing breaks, nothing goes
//  invisible. So you can add boy art one picture at a time.
//
//  Want a different suffix (e.g. "_boy")? Change art.boy.suffix below and
//  name your files that way instead.
// ===========================================================

window.PET_GENDER_CONFIG = window.PET_GENDER_CONFIG || {

  // 👇 THE SETTING: "girl" or "boy"
  gender: "boy",

  // Show the Girl/Boy switch inside the Dress Up panel? (off: the gender is fixed)
  showSwitchButton: false,

  // Remember the player's choice on this device (localStorage)?
  // Set false if the gender above should always win on refresh.
  // (While true, a gender the player picked in-game beats the setting above
  //  on this device — run  PetGender.forget()  in the console to clear it.)
  remember: false,

  // File-name suffix for each gender's body art.
  art: {
    girl: { suffix: "" },    // base.png
    boy:  { suffix: "_2" },  // base_2.png
  },
};

// ===========================================================
// ⚙️ Engine (no need to edit below to change the gender)
// ===========================================================
(() => {
  const cfg = window.PET_GENDER_CONFIG;
  cfg.art = Object.assign({ girl: { suffix: "" }, boy: { suffix: "_2" } }, cfg.art || {});

  const STORAGE_KEY = "petTemplate.gender";
  const norm = g => (String(g || "").trim().toLowerCase() === "boy" ? "boy" : "girl");

  let current = norm(cfg.gender);
  if (cfg.remember !== false) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) current = norm(saved);
    } catch (_) { /* private mode / storage off — just use the config */ }
  }
  cfg.gender = current;

  function suffixFor(g) {
    const entry = cfg.art[norm(g)] || {};
    return typeof entry.suffix === "string" ? entry.suffix : "";
  }
  function allSuffixes() {
    return Object.keys(cfg.art).map(suffixFor).filter(Boolean);
  }

  // ---- Body art: "base*.png" is the pet itself, so it swaps with the gender --
  const BODY_ART = /^base[a-z0-9_-]*\.(png|jpe?g|webp|gif|avif)$/i;
  const isBodyArt = name => BODY_ART.test(String(name || "").trim());
  function withSuffix(name, sfx) {
    return sfx ? String(name).replace(/\.([a-z0-9]+)$/i, sfx + ".$1") : String(name);
  }

  // Every pet-body <img> we rewrote, so a live gender switch can re-point them
  // without reloading the page. WeakRef where available so they can still be
  // garbage-collected when a mode unloads.
  const canWeak = typeof WeakRef === "function";
  const tracked = [];
  function track(im) { tracked.push(canWeak ? new WeakRef(im) : im); }
  function eachTracked(fn) {
    for (let i = tracked.length - 1; i >= 0; i--) {
      const im = canWeak ? tracked[i].deref() : tracked[i];
      if (!im) { tracked.splice(i, 1); continue; }
      fn(im);
    }
  }

  // asset_path_fix.js has already patched src (it adds "images/"). We capture
  // that setter and wrap it, so we see the plain name ("base.png") first and
  // hand it on for the folder prefix afterwards.
  const desc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
  const hookable = !!(desc && desc.set && desc.get) && !HTMLImageElement.prototype.__petGenderArtHooked;

  function setRaw(im, value) { desc.set.call(im, value); }

  // If this gender's art doesn't exist, fall back to the plain (girl) file once.
  function armImage(im) {
    if (im.__petGenderArmed) return;
    im.__petGenderArmed = true;
    track(im);
    im.addEventListener("error", () => {
      const fb = im.__petGenderFallback;
      if (!fb) return;
      im.__petGenderFallback = null; // one retry only — never loop
      setRaw(im, fb);
    });
    // A mode's own onerror set _failed = true before we retried; the fallback
    // loading successfully makes the image drawable again.
    im.addEventListener("load", () => { im._failed = false; });
  }

  function pointAtGender(im, rawName) {
    const sfx = suffixFor(current);
    im.__petGenderRaw = rawName;
    im.__petGenderFallback = sfx ? rawName : null;
    armImage(im);
    setRaw(im, withSuffix(rawName, sfx));
  }

  if (hookable) {
    Object.defineProperty(HTMLImageElement.prototype, "__petGenderArtHooked", { value: true });
    Object.defineProperty(HTMLImageElement.prototype, "src", {
      configurable: true,
      enumerable: desc.enumerable,
      get: desc.get,
      set(value) {
        const name = String(value == null ? "" : value).trim();
        if (!isBodyArt(name)) return setRaw(this, value);
        return pointAtGender(this, name);
      },
    });
  }

  // ---- Change notifications -------------------------------------------------
  const listeners = [];
  function notify() {
    listeners.slice().forEach(cb => { try { cb(current); } catch (e) { console.warn("gender listener", e); } });
    try {
      document.dispatchEvent(new CustomEvent("petgenderchange", { detail: { gender: current } }));
    } catch (_) {}
  }

  function apply(g) {
    const next = norm(g);
    if (next === current) return current;
    current = next;
    cfg.gender = current;
    if (cfg.remember !== false) {
      try { localStorage.setItem(STORAGE_KEY, current); } catch (_) {}
    }
    // Swap every pet-body image that is already on screen.
    eachTracked(im => {
      if (!im.__petGenderRaw) return;
      im._failed = false;
      pointAtGender(im, im.__petGenderRaw);
    });
    notify();
    return current;
  }

  // ---- Public API -----------------------------------------------------------
  window.PetGender = {
    // "girl" | "boy"
    get() { return current; },
    isBoy() { return current === "boy"; },
    isGirl() { return current === "girl"; },
    label(g) { return norm(g || current) === "boy" ? "Boy" : "Girl"; },
    emoji(g) { return norm(g || current) === "boy" ? "👦" : "👧"; },
    genders() { return ["girl", "boy"]; },

    // File-name suffix for a gender ("" for girl, "_2" for boy by default).
    suffix(g) { return suffixFor(g || current); },

    // "base_sick.png" -> "base_sick_2.png" when the pet is a boy.
    artName(name) { return isBodyArt(name) ? withSuffix(name, suffixFor(current)) : name; },

    // Translate a clothing id between genders: "top1" <-> "top1_2".
    itemId(id, g) {
      if (id == null || id === 0 || id === "0") return id;
      let bare = String(id);
      allSuffixes().forEach(s => {
        if (bare.length > s.length && bare.endsWith(s)) bare = bare.slice(0, -s.length);
      });
      const sfx = suffixFor(g || current);
      return sfx ? bare + sfx : bare;
    },

    // Set / flip the gender at runtime. Returns the gender now in use.
    set(g) { return apply(g); },
    toggle() { return apply(current === "boy" ? "girl" : "boy"); },

    // Drop the remembered choice and go back to the gender set in this file.
    forget() {
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
      return apply(norm(window.PET_GENDER_CONFIG.gender));
    },

    // Should the in-game switch be shown?
    canSwitch() { return cfg.showSwitchButton !== false; },

    // cb(gender) whenever it changes. Returns an unsubscribe function.
    onChange(cb) {
      if (typeof cb !== "function") return () => {};
      listeners.push(cb);
      return () => {
        const i = listeners.indexOf(cb);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
  };

  // Handy shortcut for the console / other scripts: setPetGender("boy")
  window.setPetGender = g => window.PetGender.set(g);
})();
