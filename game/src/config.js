// Vaultfall — shared constants: stage size, palette and tuning numbers.
// Everything else reads its numbers from here so the game's feel lives in one place.

export const VIEW_W = 1280;
export const VIEW_H = 800;
export const HUD_H = 64;

// The playable floor: the HUD band sits on top of it.
export const FLOOR = { x: 24, y: HUD_H + 24, w: VIEW_W - 48, h: VIEW_H - HUD_H - 48 };

export const THIEF_RADIUS = 13;
export const THIEF_SPEED = 178; // px per second
export const GUARD_RADIUS = 14;

export const GUARD_VIEW_RANGE = 218;
export const GUARD_VIEW_HALF_ANGLE = 0.46; // radians either side of facing
export const CAMERA_VIEW_RANGE = 252;
export const CAMERA_VIEW_HALF_ANGLE = 0.37;

export const ALARM_MAX = 100;
export const ALARM_FILL_PER_SECOND = 30; // per watcher who can see the thief
export const ALARM_DECAY_PER_SECOND = 15;
export const CRACK_RANGE = 66; // how close to the vault the thief must stand

export const COLORS = {
  floorA: '#141a29',
  floorB: '#121724',
  floorLine: '#1c2438',
  wall: '#2e3a56',
  wallTop: '#46587e',
  wallEdge: '#1a2236',
  shadow: 'rgba(4, 6, 14, 0.78)',
  shadowEdge: 'rgba(90, 120, 200, 0.25)',
  exit: '#1d5c3a',
  exitGlow: '#37d67a',
  vaultRing: '#8d99b8',
  vaultGold: '#f5c542',
  loot: '#ffd94d',
  thief: '#e8e4d8',
  thiefHood: '#23202e',
  guard: '#31435f',
  guardCap: '#c33d4e',
  camera: '#57617a',
  coneCalm: 'rgba(250, 204, 21, 0.16)',
  coneEdge: 'rgba(250, 204, 21, 0.35)',
  coneAlert: 'rgba(248, 80, 60, 0.30)',
  coneAlertEdge: 'rgba(248, 80, 60, 0.55)',
  hudBar: '#0a0d16',
  hudText: '#dbe4f5',
  hudDim: '#7d8db0',
  alarmLow: '#37d67a',
  alarmMid: '#f5c542',
  alarmHigh: '#f8503c',
};
