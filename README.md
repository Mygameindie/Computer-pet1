# Desktop Pet — Single

A companion pet that lives on your desktop. Drag it anywhere on screen, dress it
up, and keep using your computer normally — clicks pass straight through to
whatever is behind it.

This is the **single-pet** build of
[Computer-pet](https://github.com/Mygameindie/Computer-pet): same overlay, same
gravity, same wardrobe — one pet instead of two, so there is no character
switcher and no `_2` artwork to draw.

Built on Electron, so the same code runs on **Windows** and **macOS**.

---

## What it does

- **Drag the pet anywhere.** The overlay covers the entire screen, so the pet can
  be parked in any corner — over the desktop, over a browser, over the taskbar.
- **Gravity.** Let go of a pet and it falls, squashes as it lands, and settles on
  the floor — the bottom of the work area, so it stands *on* the taskbar rather
  than behind it. Flick it and it keeps the momentum of the throw, bounces off
  the sides of the desktop and slides to a stop. Turn it off from the tray or the
  pet's right-click menu if you'd rather park the pet in mid-air.
- **Doesn't block anything.** The window is click-through everywhere except the
  pet itself. Desktop shortcuts, links, buttons and browser windows underneath
  stay fully clickable, even directly around the pet — hit-testing is done per
  pixel against the sprite's own shape, so the transparent parts of the pet's
  image are click-through too.
- **One pet.** No character picker anywhere — the wardrobe always dresses the
  pet that's on screen.
- **Dress Up + Outfit presets**, carried over from the pet template: layered
  clothing, colour tinting, underwear/dress rules, and one-tap preset outfits.
- **Multi-monitor.** Every display gets its own overlay and the pet slides
  between them as you drag. Plugging in or unplugging a monitor is handled live.
- **No stats.** No hunger, happiness or health — just the pet and its wardrobe.

---

## Running it

### The easy way: download the app

Go to **[Releases](https://github.com/Mygameindie/Computer-pet1/releases)** and
take the file for your system. No Node.js, no `npm install`, nothing to extract
— Electron is packaged inside, which is why each one is around 100 MB.

**Windows — `DesktopPet-<version>.exe`.** Double-click it and the pet appears.
It does not install itself: no setup wizard, no Start Menu entry, nothing added
to your startup, nothing to uninstall. One file you can keep on the Desktop,
move to a USB stick, or delete when you're bored of it.

Windows will probably show a SmartScreen warning the first time, because the
`.exe` isn't signed with a paid certificate — **More info → Run anyway**.

**macOS — `DesktopPet-<version>.dmg`.** Open it and drag the app into
Applications, then launch it from there. Universal, so it runs natively on both
Apple Silicon and Intel. A `.app` is a bundle rather than a single file, so
there's no one-file equivalent of the Windows version — this is the normal Mac
convention.

The app is unsigned, and macOS is stricter about that than Windows: the first
launch needs **right-click → Open** rather than a double-click. If macOS insists
the app "is damaged and can't be opened", that's the quarantine flag, not a
corrupt download — clear it once with:

```bash
xattr -cr "/Applications/Desktop Pet.app"
```

Signing this away properly needs an Apple Developer account ($99/year).

**On both**, the pet never puts a window on your screen: it's drawn on a
transparent always-on-top overlay with no frame, and clicks pass straight
through to whatever's underneath. There's no taskbar button on Windows and no
Dock icon or ⌘-Tab entry on macOS. All you see is the pet, plus a small icon in
the tray (Windows) or menu bar (macOS) — which is how you quit it, though
right-clicking the pet works too.

**No releases listed yet?** Then nobody has built one. See
[Building the app](#building-the-app) below — it's one tag push.

### Getting the files (to change the pet)

Everything below is for editing the pet: adding clothes, changing the art,
altering how it behaves. If you only want to *use* it, the download above is all
you need.

Grab the **whole repository**, not individual files:

- **Code → Download ZIP** on GitHub, then extract it, or
- `git clone https://github.com/Mygameindie/Computer-pet1.git`

**Extract the ZIP first — don't run `start-pet.bat` from inside it.** Double-clicking
a folder in Explorer opens the ZIP in a window that looks exactly like a normal
folder, and Windows will run a `.bat` straight out of it: it copies *only that one
file* to a temp folder and starts it there, without `package.json`, `scripts/` or
`images/`. The launcher stops with an explanation if that happens, so if you see
"This is still inside the .zip", click **Extract all** and run it from the real
folder instead.

Downloading `start-pet.bat` on its own doesn't work: Chrome and Edge block every
`.bat` download by extension, before looking at what's inside — an empty batch
file gets refused too, and `.vbs` gets the same treatment. Inside a ZIP they
come through fine. After extracting, if Windows tagged the files as coming from
the internet, right-click `start-pet.bat` and `start-pet-hidden.vbs` →
Properties → tick **Unblock**.

### Starting it

**Windows** — double-click **`start-pet.bat`**. It installs dependencies on the
first run (a few minutes, it's fetching Electron) and launches the pet after
that. It needs [Node.js](https://nodejs.org) installed first; if it isn't, the
launcher tells you the one command to fix that.

Just installed Node and the launcher still says it isn't there? Sign out of
Windows and back in. Double-clicking a `.bat` runs it with the environment
Explorer started with, and Explorer only reloads `PATH` at sign-in — so a new
PowerShell window finding `node` doesn't mean the launcher can. (It now looks in
the standard install folders as well, so this should be rare.)

That first run is the only one with a window worth looking at. After it, the
batch file hands straight over to `start-pet-hidden.vbs` and quits, so all you
see is a blink of a console as Windows opens and closes it. **Closing that
window does not close the pet**, and neither does the window closing itself:
the pet is started as a process with no console attached to it at all. Quit the
pet from the tray icon by the clock, or by right-clicking the pet.
Double-clicking the launcher again while the pet is already running won't give
you a second pet either; the app holds a single-instance lock and just brings
the existing one back.

**macOS** — there's no double-clickable file in the box, because the Mac
equivalent of a `.bat` is a `.command`, and that opens a Terminal window and
keeps it open. Make a proper app instead — once, in Terminal, in this folder:

```bash
npm install
npm run shortcut
```

That puts a **Desktop Pet.app** on your desktop. Double-click it and the pet
starts with no Terminal window anywhere; drag it into `/Applications` or keep
it in the Dock. It points at this folder, so if you move the folder, run
`npm run shortcut` again. On macOS the pet is menu-bar-only — no Dock icon of
its own — and the icon by the clock shows, hides and quits it. (It needs
[Node.js](https://nodejs.org) too: `brew install node`.)

### Starting it with no window at all

*(Windows. On macOS the app above already opens nothing.)*

Not even a blink: **double-click `start-pet-hidden.vbs`** instead of the batch
file. It's the same launcher with its window hidden, so nothing appears on
screen — the pet just turns up, with its tray icon by the clock. If something
goes wrong it says so in a dialog and offers to run the launcher again in a
visible window, and on a first run (when there are minutes of install output to
show) it leaves the window visible on purpose.

Windows can't hide a `.bat` window itself — `cmd.exe` gets its console from
Windows before the script runs a single line — which is why the windowless
launcher is a separate `.vbs` file. Keep the two side by side in this folder;
each one needs the other.

If `.vbs` files are blocked on your machine (some workplaces switch Windows
Script Host off by policy), the batch file notices and stays as it is —
everything still works, you just get the console window back. The options below
avoid it another way.

**A desktop shortcut** — run this once:

```powershell
npm run shortcut
```

It puts a **Desktop Pet** shortcut on your desktop pointing straight at
Electron. Double-click it and the pet starts with no console window at all,
because Electron is a GUI program and has nothing to flash. Right-click the
shortcut → *Pin to taskbar* or *Pin to Start* and it behaves like any other
background app: an icon to click, and a tray icon by the clock to show, hide
and quit. (The same command on a Mac builds the `.app` described above —
same promise either way: something to double-click that opens no terminal.)

Or do it the long way:

**Build the app** (a real installed program with its own icon, rather than a
shortcut into this folder):

```powershell
npm run build:win
```

`dist\Desktop Pet Single 1.0.0.exe` is a portable build you can double-click or move
anywhere; the installer in the same folder puts it in the Start Menu. Neither
opens a console window, ever.

**Or make the shortcut by hand**, if `npm run shortcut` didn't work:

1. Right-click on the desktop → **New → Shortcut**
2. Location: `C:\path\to\Computer-pet1\node_modules\electron\dist\electron.exe .`
   — note the space and dot at the end, that's the argument telling it which app
   to run
3. Name it *Desktop Pet* → Finish
4. Right-click the new shortcut → **Properties** → set **Start in** to
   `C:\path\to\Computer-pet1`

Double-clicking that launches the pet directly, with no console and no batch
file in the way.

**Any platform** — from a terminal in this folder:

```bash
npm install
npm run start:bg     # start it and let go of it
```

`npm run start:bg` starts the pet in its own process with no console attached,
prints its pid, and exits. **Closing the terminal — PowerShell, Terminal, an SSH
session — leaves the pet running.** Quit it from the tray icon or the pet's
right-click menu.

```bash
npm start            # stays attached to this terminal
```

`npm start` is the one to use while changing the code: the pet dies with the
terminal, and you get the console output. Closing PowerShell after `npm start`
takes the pet with it — that's what `start:bg` is for.

## Building the app

### With GitHub Actions (no Windows or Mac needed)

`.github/workflows/build.yml` builds both apps on GitHub's machines — a Windows
runner and a macOS runner — so **you don't need Node.js, a PC, or a Mac to
produce either app.**

**Every push to any branch** builds both and publishes them to a rolling release
named after that branch (`build-<branch>`). Branches get their own download and
never overwrite each other's, so you can hand someone a link to exactly the
version you're working on.

For a permanent numbered release, from the website: **Releases → Draft a new
release →** type `v1.0.0` in the tag box → **Create new tag on publish**, pick
the branch to build as the target, then **Publish release**. Or from a terminal:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Either way that release gets `DesktopPet-1.0.0.exe` and `DesktopPet-1.0.0.dmg`
as direct downloads. Bump the number each time — a tag can only be used once.

> **Actions → Run workflow** only appears once this file is on the repository's
> default branch. Pushing to a branch, or tagging, works from anywhere.

### On your own machine

```bash
npm run build:win    # Windows: a single self-contained .exe (no installer)
npm run build:mac    # macOS: universal (Intel + Apple Silicon) .dmg
```

Output lands in `dist/`. Each platform's installer must be built on that
platform (or in CI) — electron-builder can't produce a signed macOS app from
Windows or vice versa.

The app icon is `build/icon.ico` (and `build/icon.png` for macOS and Linux). It's
the pet in its default outfit — regenerate it if you change the base art.

> **macOS note:** the app is unsigned. On first launch, right-click it in
> Finder → **Open** to get past Gatekeeper. It runs as a menu-bar-only app
> (`LSUIElement`), so it has no Dock icon.

---

## Using it

| Action | How |
|---|---|
| Move the pet | Drag it |
| Throw the pet | Drag and let go while still moving |
| Change clothes | **👗 Dress Up** in the bar at the top of the screen |
| Apply a whole outfit | **🎀 Outfits** |
| Menu (dress up, gravity, hide, reset, quit) | Right-click the pet |
| Put the pet away / bring it back | **Click the tray icon** by the clock |
| Gravity, reset position, quit | Right-click the tray icon |

With the pet hidden the app is completely invisible — no pet, no wardrobe,
nothing in the taskbar — and it carries on running in the background. One click
on the tray icon brings it all back.

The wardrobe bar is pinned to the top of the screen and the panels drop down
from it — the pet gets dragged, thrown and dropped, and a bar that travels with
it is a moving target. On a multi-monitor setup the bar appears on the screen
the pet is standing on. Only one of the two panels is open at a time.

---

## Adding artwork

Drop PNGs into `images/`. Everything is transparent art drawn at the same canvas
size as the base sprite so the layers line up.

**Base sprite** — `images/base.png` is the pet itself. There is only the one,
and no `_2` variants anywhere: every PNG dresses the same pet.

**Clothes** — add the PNG, then add its name to the matching list under `pet` in
`outfit_config.js`.

```js
pet: {
  top:    ["top1", "top2"],   // images/top1.png, images/top2.png
  bottom: ["pants1", "skirt1"],
},
```

Anything listed without a matching PNG is hidden automatically — no broken
images, no empty slots, and a category left with nothing in it gets no tab at
all. That's why the wardrobe currently looks sparse: this repo only ships
`base.png`. Add more art and the categories appear on their own.

**Outfit presets** live in `outfit_presets.js` — one `clothes` map per look, no
per-character variants to keep in sync.

---

## How it works

| File | Role |
|---|---|
| `main.js` | Electron main process: one transparent always-on-top overlay per display, the pet's shared state in global screen coordinates, the gravity simulation, tray, click-through toggling |
| `preload.js` | The only bridge between page and main (`contextIsolation` on, `nodeIntegration` off) |
| `pet_desktop.js` | The overlay scene: draws the pet, alpha hit-testing, dragging and throwing, which screen shows the wardrobe bar, state sync |
| `outfit_system.js` | Dress Up panel, layering, colour tinting, clothing rules — one wardrobe, no character switcher |
| `outfit_presets.js` | Preset outfits and the 🎀 Outfits panel |
| `outfit_config.js` | The wardrobe — the one file to edit when adding clothes |
| `asset_path_fix.js` | Resolves bare image names to `images/…` |
| `start-pet.bat` | Windows one-click launcher: installs on first run, then hands over to the windowless launcher |
| `start-pet-hidden.vbs` | Runs `start-pet.bat` with its window hidden — double-click this to start the pet with nothing on screen |
| `scripts/start-detached.js` | `npm run start:bg` — launches the app detached so it outlives the terminal |
| `scripts/make-shortcut.js` | `npm run shortcut` — a Windows shortcut that starts the pet with no console window |
| `scripts/make-app.js` | the macOS half of `npm run shortcut` — a `Desktop Pet.app` that starts the pet with no Terminal window |

Three details worth knowing if you change things:

- **The pet's position is in global screen coordinates.** Each overlay subtracts
  its own display origin when drawing, which is what lets the pet cross monitors
  mid-drag.
- **Gravity runs in the main process, not the renderer.** Main owns the
  position, so it is the only place that can integrate it once and have every
  monitor agree. The renderer only reports what the cursor did (grab, move,
  release-with-velocity) and draws the result. The simulation timer stops as soon
  as the pet is asleep on the floor, so an idle pet costs nothing — and because
  state is broadcast on every physics frame while the pet is falling, anything
  listening to it must be cheap and must not rebuild the wardrobe UI.
- **The app is served over a custom `pet://` scheme, not `file://`.** A `file://`
  page can't read pixels back out of a canvas that has a `file://` image drawn on
  it, and those pixel reads are exactly how click-through decides whether the
  cursor is on the pet. Loading over a registered standard scheme keeps
  `getImageData()` legal.
