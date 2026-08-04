// ===========================================================
// 🐾 pet_desktop.js — the overlay scene (one instance per display)
// ===========================================================
// Every overlay window runs this file and renders the SAME single pet. What
// differs is the window's display origin: a pet at global screen position
// (3000, 400) draws at x = 3000 - originX, so it appears on exactly one
// monitor and slides between them while you drag.
//
// Click-through is the important part: the window ignores mouse events by
// default, so the desktop, icons, taskbar and browser underneath stay
// clickable. We only take control back while the cursor is over an opaque
// pixel of the pet sprite (alpha hit-test, not the bounding box — the
// transparent corners of the image stay click-through) or over the wardrobe UI.
// ===========================================================

(() => {
  const api = window.petAPI;
  const PET_HEIGHT = 250;          // drawn height in CSS pixels
  const FALLBACK_ASPECT = 400 / 450;
  const ALPHA_THRESHOLD = 10;      // a pixel counts as "the pet" above this alpha

  const BASE_SRC = 'images/base.png';

  // ---- Window origin ------------------------------------------------------
  const params = new URLSearchParams(location.search);
  let origin = {
    x: Number(params.get('originX')) || 0,
    y: Number(params.get('originY')) || 0,
    w: Number(params.get('width')) || window.innerWidth,
    h: Number(params.get('height')) || window.innerHeight,
  };

  // ---- Local mirror of the shared state ----------------------------------
  let shared = {
    pet: { x: 0, y: 0, visible: true },
    gravity: true,
    outfit: null,
    outfitRev: 0,
    ui: { dressupOpen: false, presetsOpen: false },
  };
  let applyingRemote = false;   // guards against echoing state back to main
  let seenOutfitRev = -1;       // last outfit revision this window has applied
  let seenLanding = 0;          // last landing timestamp, for the squash

  // ---- DOM ---------------------------------------------------------------
  const dock = document.getElementById('wardrobe-dock');
  const dressPanel = document.getElementById('dressup-panel');
  const presetPanel = document.getElementById('preset-panel');

  const petEl = document.getElementById('pet');
  const canvas = petEl.querySelector('.pet-canvas');
  const pet = {
    el: petEl,
    canvas,
    ctx: canvas.getContext('2d', { willReadFrequently: true }),
    img: null,
    w: PET_HEIGHT * FALLBACK_ASPECT,
    h: PET_HEIGHT,
  };

  // ---- Art loading --------------------------------------------------------
  function loadBase() {
    const im = new Image();
    im.onload = () => { sizePet(); requestRedraw(); };
    im.onerror = () => { pet.img = null; requestRedraw(); };
    im.src = BASE_SRC;
    pet.img = im;
  }

  function sizePet() {
    const im = pet.img;
    const aspect = (im && im.naturalWidth && im.naturalHeight)
      ? im.naturalWidth / im.naturalHeight
      : FALLBACK_ASPECT;
    pet.h = PET_HEIGHT;
    pet.w = Math.round(PET_HEIGHT * aspect);

    // Back the canvas at device resolution so the sprite stays crisp on HiDPI
    // and Retina screens, but keep the CSS box in layout pixels.
    const dpr = window.devicePixelRatio || 1;
    pet.canvas.width = Math.round(pet.w * dpr);
    pet.canvas.height = Math.round(pet.h * dpr);
    pet.canvas.style.width = pet.w + 'px';
    pet.canvas.style.height = pet.h + 'px';
    pet.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // The main process needs the real drawn size: it is what decides where the
    // floor is and how far right the pet may travel.
    if (api && typeof api.reportPetSize === 'function') api.reportPetSize(pet.w, pet.h);
  }

  sizePet();
  loadBase();

  // ---- Drawing ------------------------------------------------------------
  let redrawQueued = false;
  function requestRedraw() {
    if (redrawQueued) return;
    redrawQueued = true;
    requestAnimationFrame(() => { redrawQueued = false; draw(); });
  }

  function draw() {
    const { ctx } = pet;
    ctx.clearRect(0, 0, pet.w, pet.h);
    if (!shared.pet || !shared.pet.visible) return;

    if (pet.img && pet.img.complete && pet.img.naturalWidth) {
      ctx.drawImage(pet.img, 0, 0, pet.w, pet.h);
    }

    // Clothes on top, layered by z and tinted, straight from the outfit system.
    if (typeof window.drawOutfitOverlay === 'function') {
      window.drawOutfitOverlay(ctx, 'stand', 0, 0, pet.w, pet.h);
    }
  }

  // Re-draw whenever a clothing image finishes loading.
  window.addEventListener('outfit:art-changed', requestRedraw);

  // ---- Layout -------------------------------------------------------------
  function layout() {
    const s = shared.pet;
    if (!s || !s.visible) { pet.el.style.display = 'none'; placeDock(); return; }
    pet.el.style.display = 'flex';
    pet.el.style.left = (s.x - origin.x) + 'px';
    pet.el.style.top = (s.y - origin.y) + 'px';
    placeDock();
  }

  // The dock is pinned to the top of the screen by CSS, so there is no geometry
  // to compute here — only the question of WHICH overlay should show it. Every
  // window runs this same scene, so without that check a two-monitor setup
  // would sprout a wardrobe bar on each screen. The screen the pet is standing
  // on gets it.
  function placeDock() {
    const s = shared.pet;
    if (!s || !s.visible) { dock.style.display = 'none'; return; }

    const cx = s.x + pet.w / 2 - origin.x;
    const cy = s.y + pet.h / 2 - origin.y;
    const onThisDisplay = cx >= 0 && cx < origin.w && cy >= 0 && cy < origin.h;
    dock.style.display = onThisDisplay ? 'flex' : 'none';
  }

  // ---- Click-through ------------------------------------------------------
  // The window ignores mouse events by default; mousemove is still forwarded to
  // us, which is what lets this run at all. We hand interaction back only for
  // the pixels that are actually the pet, or for the wardrobe UI.
  let ignoring = true;
  function setIgnore(next) {
    if (next === ignoring) return;   // don't spam IPC on every mousemove
    ignoring = next;
    api.setIgnoreMouseEvents(next);
  }

  // cx/cy are relative to the canvas's on-screen rectangle. That rectangle is
  // not always the sprite's natural size — the landing squash animates a
  // transform on the canvas — so map through the measured rect instead of
  // assuming 1:1, or the pet becomes ungrabbable for the length of the bounce.
  function opaqueAt(cx, cy, rect) {
    const rw = (rect && rect.width) || pet.w;
    const rh = (rect && rect.height) || pet.h;
    cx = cx * (pet.w / rw);
    cy = cy * (pet.h / rh);
    if (cx < 0 || cy < 0 || cx >= pet.w || cy >= pet.h) return false;
    const dpr = window.devicePixelRatio || 1;
    try {
      const d = pet.ctx.getImageData(Math.floor(cx * dpr), Math.floor(cy * dpr), 1, 1).data;
      return d[3] > ALPHA_THRESHOLD;
    } catch (_) {
      // Canvas unexpectedly tainted — fall back to an inset bounding box so the
      // pet stays draggable rather than becoming impossible to grab.
      const m = 0.12;
      return cx > pet.w * m && cx < pet.w * (1 - m) && cy > pet.h * m && cy < pet.h * (1 - m);
    }
  }

  function overPet(clientX, clientY) {
    const s = shared.pet;
    if (!s || !s.visible) return false;
    const r = pet.canvas.getBoundingClientRect();
    if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return false;
    return opaqueAt(clientX - r.left, clientY - r.top, r);
  }

  function overDock(clientX, clientY) {
    if (dock.style.display === 'none') return false;
    const el = document.elementFromPoint(clientX, clientY);
    return !!(el && dock.contains(el));
  }

  document.addEventListener('mousemove', (e) => {
    if (drag.active) { setIgnore(false); return; }
    const interactive = overPet(e.clientX, e.clientY) || overDock(e.clientX, e.clientY);
    setIgnore(!interactive);
  });

  // Cursor left this monitor entirely — go back to click-through.
  document.addEventListener('mouseleave', () => { if (!drag.active) setIgnore(true); });

  // ---- Dragging -----------------------------------------------------------
  // Offsets are kept in global screen coordinates so a drag that starts on one
  // monitor keeps working after the cursor crosses onto another.
  const drag = { active: false, dx: 0, dy: 0, pointerId: null, trail: [] };

  const THROW_WINDOW = 120;   // ms of pointer history a flick is measured over

  function globalFromClient(clientX, clientY) {
    return { x: clientX + origin.x, y: clientY + origin.y };
  }

  // Speed of the cursor over the last few frames, in px/second. That is the
  // velocity the pet keeps when you let go, so a flick actually throws it.
  function throwVelocity() {
    const trail = drag.trail;
    const last = trail[trail.length - 1];
    if (!last) return { vx: 0, vy: 0 };
    const first = trail.find(p => last.t - p.t <= THROW_WINDOW) || trail[0];
    const dt = (last.t - first.t) / 1000;
    if (dt < 0.008) return { vx: 0, vy: 0 };   // too short to be meaningful
    return { vx: (last.x - first.x) / dt, vy: (last.y - first.y) / dt };
  }

  document.addEventListener('pointerdown', (e) => {
    if (e.button === 2) return;                    // right-click opens the menu
    // Clicks in the wardrobe belong to the panel, never to a drag.
    if (overDock(e.clientX, e.clientY)) return;
    if (!overPet(e.clientX, e.clientY)) return;

    const g = globalFromClient(e.clientX, e.clientY);
    const s = shared.pet;
    drag.active = true;
    drag.dx = g.x - s.x;
    drag.dy = g.y - s.y;
    drag.pointerId = e.pointerId;
    drag.trail = [{ t: e.timeStamp, x: s.x, y: s.y }];

    pet.el.classList.add('dragging');
    api.grabPet();                 // physics lets go while the cursor holds it
    // Pointer capture keeps move/up events coming to this window even after the
    // cursor leaves it — that's what allows dragging onto another display.
    try { pet.canvas.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  });

  document.addEventListener('pointermove', (e) => {
    if (!drag.active || (drag.pointerId !== null && e.pointerId !== drag.pointerId)) return;
    const g = globalFromClient(e.clientX, e.clientY);
    const x = g.x - drag.dx;
    const y = g.y - drag.dy;

    // Move locally right away so the drag feels attached to the cursor; main
    // clamps and mirrors the position to the other windows.
    shared.pet.x = x;
    shared.pet.y = y;
    drag.trail.push({ t: e.timeStamp, x, y });
    while (drag.trail.length > 2 && e.timeStamp - drag.trail[0].t > THROW_WINDOW) drag.trail.shift();
    layout();
    api.movePet(x, y);
    e.preventDefault();
  });

  function endDrag(e) {
    if (!drag.active) return;
    pet.el.classList.remove('dragging');
    try { if (e && drag.pointerId !== null) pet.canvas.releasePointerCapture(drag.pointerId); } catch (_) {}
    // Hand the flick over to gravity: the pet keeps the momentum of the throw
    // and falls from wherever it was released.
    const { vx, vy } = throwVelocity();
    api.dropPet(vx, vy);
    drag.active = false;
    drag.pointerId = null;
    drag.trail = [];
  }
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);

  // ---- Right-click menu ---------------------------------------------------
  document.addEventListener('contextmenu', (e) => {
    if (!overPet(e.clientX, e.clientY)) return;
    e.preventDefault();
    api.petContextMenu();
  });

  // ---- Outfit state sync --------------------------------------------------
  function currentOutfit() {
    return {
      selectedClothes: JSON.parse(JSON.stringify(window.selectedClothes || {})),
      clothingColors: JSON.parse(JSON.stringify(window.clothingColors || {})),
    };
  }

  function pushOutfit() {
    if (applyingRemote) return;
    api.patchState({
      outfit: currentOutfit(),
      ui: {
        dressupOpen: dressPanel.style.display !== 'none',
        presetsOpen: presetPanel.style.display !== 'none',
      },
    });
  }

  // Any interaction inside the wardrobe UI can change what the pet is wearing.
  // The outfit system re-renders synchronously, so read the result on the next
  // tick and mirror it to the other windows.
  [dressPanel, presetPanel, document.getElementById('dock-bar')].forEach(el => {
    el.addEventListener('click', () => {
      setTimeout(() => { pushOutfit(); requestRedraw(); placeDock(); }, 0);
    });
  });

  function applyOutfit(outfit) {
    if (!outfit) return;
    applyingRemote = true;
    try {
      if (outfit.selectedClothes) window.selectedClothes = outfit.selectedClothes;
      if (outfit.clothingColors) window.clothingColors = outfit.clothingColors;
      if (typeof window.refreshDressUpUI === 'function') window.refreshDressUpUI();
    } finally {
      applyingRemote = false;
    }
  }

  // ---- State from main ----------------------------------------------------
  api.onOrigin((o) => {
    origin = { x: o.originX, y: o.originY, w: o.width, h: o.height };
    layout();
  });

  // State arrives on every physics frame while the pet is falling, so this path
  // has to be cheap AND must not touch the wardrobe DOM unless something the
  // wardrobe cares about actually changed — rebuilding the Dress Up panel 60
  // times a second made it flicker and swallowed clicks.
  api.onState((s) => {
    shared = s;

    applyingRemote = true;
    try {
      if (s.ui) {
        setPanel(dressPanel, !!s.ui.dressupOpen, window.refreshDressUpUI);
        setPanel(presetPanel, !!s.ui.presetsOpen, window.renderPresetPanel);
      }
    } finally {
      applyingRemote = false;
    }

    // The outfit only changes when someone touches the wardrobe, and main bumps
    // a revision counter when it does — so the expensive compare is rare.
    if (s.outfit && s.outfitRev !== seenOutfitRev) {
      seenOutfitRev = s.outfitRev;
      if (JSON.stringify(s.outfit) !== JSON.stringify(currentOutfit())) applyOutfit(s.outfit);
    }

    // Landing squash, driven by the impact main reported.
    if (s.pet && s.pet.landedAt && s.pet.landedAt !== seenLanding) {
      seenLanding = s.pet.landedAt;
      if (s.pet.visible) squash(s.pet.impact || 0);
    }

    layout();
    requestRedraw();
  });

  // Show or hide a wardrobe panel, re-rendering its contents only on the
  // transition into "open".
  function setPanel(panel, open, render) {
    const isOpen = panel.style.display !== 'none';
    if (isOpen === open) return;
    panel.style.display = open ? 'block' : 'none';
    if (open && typeof render === 'function') render();
  }

  function squash(impact) {
    const c = pet.canvas;
    c.style.setProperty('--squash', (0.08 + 0.16 * Math.max(0, Math.min(1, impact))).toFixed(3));
    c.classList.remove('landing');
    void c.offsetWidth;          // restart the animation from the top
    c.classList.add('landing');
  }

  // Drop the class as soon as the bounce is over, so the canvas goes back to
  // its untransformed size and nothing has to compensate for it.
  pet.canvas.addEventListener('animationend', () => pet.canvas.classList.remove('landing'));

  api.onCommand((cmd) => {
    if (!cmd) return;
    if (cmd.name === 'open-dressup' || cmd.name === 'open-presets') {
      const wantDress = cmd.name === 'open-dressup';
      setPanel(dressPanel, wantDress, window.refreshDressUpUI);
      setPanel(presetPanel, !wantDress, window.renderPresetPanel);
      placeDock();
      pushOutfit();
    }
  });

  // First window to load seeds the shared outfit state from the config defaults.
  layout();
  requestRedraw();
  setTimeout(() => { if (!shared.outfit) pushOutfit(); }, 120);
})();
