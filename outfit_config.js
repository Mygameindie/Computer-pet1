// ===========================================================
// 👗 outfit_config.js — THE one place to add / edit clothes
// ===========================================================
//
//  HOW TO ADD A NEW CLOTHING ITEM (3 steps):
//    1. Save the artwork as   images/<name>.png   (transparent PNG, same
//       canvas size as the pet base so it lines up).
//    2. Add "<name>" to the matching list under `pet` below.
//       Example: add a 2nd top -> "top2".
//    3. Refresh. Done. It shows up in the Dress Up panel automatically.
//
//  LABELS are made automatically from the name:  "top2" -> "Top 2".
//    Want a custom name? Use an object instead of a string:
//        { id: "top2", label: "Cool Hoodie" }
//
//  THIS BUILD HAS ONE PET. There is no second character and no "_2" artwork:
//  everything listed below dresses the one pet. An item whose PNG doesn't
//  exist in images/ is hidden automatically, and a category with nothing left
//  in it doesn't get a tab at all — so the panel always matches the art you
//  actually have.
//
//  UNDERWEAR: a one-piece is a complete set and replaces the separate top +
//  bottom. Switching OFF a one-piece to a separate piece completes the set
//  (top1 -> also bottom1). Once you're already in separates you can mix any
//  top with any bottom (top1 + bottom2) — they are not re-paired.
//
//  This is a plain JS file (no network/JSON loading) so it can't glitch or
//  fail to load mid-run — it's the smoothest, simplest setup.
// ===========================================================

window.OUTFIT_CONFIG = {

  // -------------------------------------------------------------------------
  // CATEGORIES — order, display name, and draw layer (z). Higher z = on top.
  // Add a line here to create a brand-new clothing category, then add a
  // matching list under `pet` below.
  // -------------------------------------------------------------------------

  categories: [
    { key: "topUnderwear",      label: "Top Underwear",             z: 60  },
    { key: "bottomUnderwear",   label: "Bottom Underwear / Boxers", z: 50  },
    { key: "onepieceUnderwear", label: "One-Piece Underwear",       z: 65  },
    { key: "top",               label: "Top",                       z: 120 },
    { key: "bottom",            label: "Pants / Skirt",             z: 110 },
    { key: "dress",             label: "Dress",                     z: 130 },
    { key: "bodysuit",          label: "Bodysuit",                  z: 128 },
    { key: "shoes",             label: "Shoes",                     z: 90  },
    { key: "glove",             label: "Glove",                     z: 140 },
    { key: "bunnysuitbow",      label: "Bunnysuit Bow",             z: 150 },
    { key: "glasses",           label: "Glasses",                   z: 160 },
    { key: "ears",              label: "Ears",                      z: 170 },
    { key: "hat",               label: "Hat",                       z: 180 },
  ],

  // -------------------------------------------------------------------------
  // THE WARDROBE — every garment the one pet can wear.
  // -------------------------------------------------------------------------
  pet: {
    topUnderwear:      ["topunderwear1", "topunderwear2", "topunderwear3", "topunderwear4"],
    bottomUnderwear:   ["bottomunderwear1", "bottomunderwear2", "bottomunderwear3", "bottomunderwear4"],
    onepieceUnderwear: ["onepieceunderwear1"],
    top:               ["top1"],
    bottom:            ["pants1", "skirt1"],
    dress:             ["dress1"],
    bodysuit:          ["bodysuit1"],
    shoes:             ["shoes1"],
    glove:             ["glove1"],
    bunnysuitbow:      ["bunnysuitbow1"],
    glasses:           ["glasses1"],
    ears:              ["ears1"],
    hat:               ["hat1"],
  },

  // What the pet is wearing on a fresh start. Anything left out starts as None.
  // This is the Mozzarella Cookie look: horned hat, blue dress, gold shoes,
  // with the matching separate underwear set underneath.
  defaults: {
    topUnderwear: "topunderwear1",
    bottomUnderwear: "bottomunderwear1",
    dress: "dress1",
    shoes: "shoes1",
    hat: "hat1",
  },
};
