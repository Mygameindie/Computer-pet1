// Bridge between the overlay renderer and the main process.
// contextIsolation is on and nodeIntegration is off, so this is the only
// surface the page can reach — nothing else from Node is exposed.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  // Click-through: true = clicks pass to whatever is behind the overlay
  // (desktop icons, browser, taskbar). Flipped to false only while the cursor
  // is over an opaque pet pixel or the wardrobe UI.
  setIgnoreMouseEvents: (ignore) => ipcRenderer.send('set-ignore-mouse-events', !!ignore),

  // Pet position in GLOBAL screen coordinates, so it can cross monitors.
  movePet: (x, y) => ipcRenderer.send('move-pet', { x, y }),

  // Gravity: main owns the simulation, the renderer only reports what the user
  // did with the cursor. grab = physics off, drop = let go with a flick
  // velocity in px/second.
  grabPet: () => ipcRenderer.send('grab-pet'),
  dropPet: (vx, vy) => ipcRenderer.send('drop-pet', { vx, vy }),

  // The drawn size of the sprite, which is what decides where the floor is.
  reportPetSize: (w, h) => ipcRenderer.send('pet-size', { w, h }),

  // Outfit / panel state, merged in main and mirrored to every window.
  patchState: (patch) => ipcRenderer.send('patch-state', patch),

  hidePet: () => ipcRenderer.send('hide-pet'),
  quit: () => ipcRenderer.send('quit-app'),
  petContextMenu: () => ipcRenderer.send('pet-context-menu'),

  onState: (cb) => ipcRenderer.on('state', (_e, s) => cb(s)),
  onOrigin: (cb) => ipcRenderer.on('origin', (_e, o) => cb(o)),
  onCommand: (cb) => ipcRenderer.on('command', (_e, c) => cb(c)),
});
