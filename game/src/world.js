// Vaultfall — the simulation: thief movement and collision, guard patrols, camera
// sweeps, line-of-sight detection, the alarm, vault cracking, loot and the escape.
// Pure state and step functions; drawing lives in render.js, sound triggers are
// returned as event names so this file never touches WebAudio.

import {
  FLOOR, THIEF_RADIUS, THIEF_SPEED, GUARD_RADIUS,
  GUARD_VIEW_RANGE, GUARD_VIEW_HALF_ANGLE,
  CAMERA_VIEW_RANGE, CAMERA_VIEW_HALF_ANGLE,
  ALARM_MAX, ALARM_FILL_PER_SECOND, ALARM_DECAY_PER_SECOND, CRACK_RANGE,
} from './config.js';

// Build a fresh, mutable world for one level definition.
export function createWorld(level) {
  return {
    level,
    time: 0,
    thief: {
      x: level.spawn.x,
      y: level.spawn.y,
      angle: 0,
      hidden: false,
      seen: false,
      moving: false,
      stepAcc: 0,
    },
    guards: level.guards.map((def) => ({
      x: def.path[0][0],
      y: def.path[0][1],
      path: def.path,
      speed: def.speed,
      pauseTime: def.pause,
      target: 1 % def.path.length,
      pauseLeft: 0,
      angle: Math.atan2(def.path[1 % def.path.length][1] - def.path[0][1], def.path[1 % def.path.length][0] - def.path[0][0]),
      seen: false,
    })),
    cameras: level.cameras.map((def) => ({
      x: def.x,
      y: def.y,
      baseAngle: def.baseAngle,
      sweep: def.sweep,
      period: def.period,
      phase: def.phase,
      angle: def.baseAngle,
      seen: false,
    })),
    alarm: 0,
    wasSeen: false,
    crackProgress: 0,
    cracking: false,
    crackTickAcc: 0,
    vaultCracked: false,
    lootTaken: level.loot.map(() => false),
    lootValue: 0,
    caught: false,
    caughtReason: '',
    escaped: false,
  };
}

// Is the point inside any wall rectangle (optionally grown by `pad`)?
function pointInWalls(x, y, walls, pad = 0) {
  for (const [wx, wy, ww, wh] of walls) {
    if (x >= wx - pad && x <= wx + ww + pad && y >= wy - pad && y <= wy + wh + pad) return true;
  }
  return false;
}

// Move a circle by (dx, dy), sliding along wall rectangles and the floor's edge.
// Axis-separated: try x, resolve, then try y, so corners feel like sliding, not sticking.
function moveCircle(body, radius, dx, dy, walls) {
  body.x += dx;
  for (const [wx, wy, ww, wh] of walls) {
    if (body.x + radius > wx && body.x - radius < wx + ww && body.y + radius > wy && body.y - radius < wy + wh) {
      body.x = dx > 0 ? wx - radius : wx + ww + radius;
    }
  }
  body.x = Math.max(FLOOR.x + radius, Math.min(FLOOR.x + FLOOR.w - radius, body.x));
  body.y += dy;
  for (const [wx, wy, ww, wh] of walls) {
    if (body.x + radius > wx && body.x - radius < wx + ww && body.y + radius > wy && body.y - radius < wy + wh) {
      body.y = dy > 0 ? wy - radius : wy + wh + radius;
    }
  }
  body.y = Math.max(FLOOR.y + radius, Math.min(FLOOR.y + FLOOR.h - radius, body.y));
}

// Is the straight line between two points free of walls? Marched in small steps,
// which is plenty for room-sized sight lines and keeps the code obvious.
export function lineOfSightClear(x1, y1, x2, y2, walls) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(1, Math.ceil(dist / 9));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (pointInWalls(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, walls)) return false;
  }
  return true;
}

// How far a ray travels from (x, y) along `angle` before a wall or `maxDist` stops it.
// render.js uses this to draw vision cones that stop at walls instead of leaking through.
export function rayDistance(x, y, angle, maxDist, walls) {
  const step = 6;
  let d = 0;
  while (d < maxDist) {
    d += step;
    const px = x + Math.cos(angle) * d;
    const py = y + Math.sin(angle) * d;
    if (pointInWalls(px, py, walls)) return d - step / 2;
    if (px < FLOOR.x || px > FLOOR.x + FLOOR.w || py < FLOOR.y || py > FLOOR.y + FLOOR.h) return d;
  }
  return maxDist;
}

// The smallest signed difference between two angles, in (-PI, PI].
function angleDelta(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Can this watcher (a guard or a camera) see the thief right now?
function watcherSees(watcher, range, halfAngle, world) {
  const t = world.thief;
  if (t.hidden) return false;
  const dx = t.x - watcher.x;
  const dy = t.y - watcher.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (Math.abs(angleDelta(Math.atan2(dy, dx), watcher.angle)) > halfAngle) return false;
  return lineOfSightClear(watcher.x, watcher.y, t.x, t.y, world.level.walls);
}

function updateGuard(guard, dt) {
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    // Paused at a waypoint, the guard holds his last heading and watches.
    return;
  }
  const [tx, ty] = guard.path[guard.target];
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  const step = guard.speed * dt;
  if (dist <= step) {
    guard.x = tx;
    guard.y = ty;
    guard.target = (guard.target + 1) % guard.path.length;
    guard.pauseLeft = guard.pauseTime;
  } else {
    guard.x += (dx / dist) * step;
    guard.y += (dy / dist) * step;
    guard.angle = Math.atan2(dy, dx);
  }
}

// Advance the whole world by dt seconds. `wish` is the thief's unit move vector,
// `useHeld` whether the interact key (E) is down. Returns a list of event names
// ('step', 'pickup', 'crackTick', 'spotted', 'cracked', 'caught', 'escaped').
export function stepWorld(world, wish, useHeld, dt) {
  const events = [];
  const level = world.level;
  const thief = world.thief;
  world.time += dt;

  // --- the thief ------------------------------------------------------------
  thief.moving = wish.x !== 0 || wish.y !== 0;
  if (thief.moving) {
    thief.angle = Math.atan2(wish.y, wish.x);
    moveCircle(thief, THIEF_RADIUS, wish.x * THIEF_SPEED * dt, wish.y * THIEF_SPEED * dt, level.walls);
    thief.stepAcc += THIEF_SPEED * dt;
    if (thief.stepAcc > 34) {
      thief.stepAcc = 0;
      events.push('step');
    }
  }
  thief.hidden = level.shadows.some(([sx, sy, sw, sh]) => thief.x >= sx && thief.x <= sx + sw && thief.y >= sy && thief.y <= sy + sh);

  // --- guards and cameras -----------------------------------------------------
  for (const guard of world.guards) updateGuard(guard, dt);
  for (const cam of world.cameras) {
    cam.angle = cam.baseAngle + Math.sin((world.time / cam.period) * Math.PI * 2 + cam.phase) * cam.sweep;
  }

  // --- being seen, and the alarm ---------------------------------------------
  let watchers = 0;
  for (const guard of world.guards) {
    guard.seen = watcherSees(guard, GUARD_VIEW_RANGE, GUARD_VIEW_HALF_ANGLE, world);
    if (guard.seen) watchers++;
  }
  for (const cam of world.cameras) {
    cam.seen = watcherSees(cam, CAMERA_VIEW_RANGE, CAMERA_VIEW_HALF_ANGLE, world);
    if (cam.seen) watchers++;
  }
  thief.seen = watchers > 0;
  if (thief.seen) {
    if (!world.wasSeen) events.push('spotted');
    world.alarm = Math.min(ALARM_MAX, world.alarm + ALARM_FILL_PER_SECOND * watchers * dt);
  } else {
    world.alarm = Math.max(0, world.alarm - ALARM_DECAY_PER_SECOND * dt);
  }
  world.wasSeen = thief.seen;

  // A guard who lays a hand on the thief ends it at once, alarm or no alarm.
  for (const guard of world.guards) {
    if (Math.hypot(guard.x - thief.x, guard.y - thief.y) < GUARD_RADIUS + THIEF_RADIUS - 2) {
      world.caught = true;
      world.caughtReason = 'A guard grabbed you.';
      events.push('caught');
      return events;
    }
  }
  if (world.alarm >= ALARM_MAX) {
    world.caught = true;
    world.caughtReason = 'The alarm hit full and the floor locked down.';
    events.push('caught');
    return events;
  }

  // --- the vault ----------------------------------------------------------------
  world.cracking = false;
  if (!world.vaultCracked) {
    const nearVault = Math.hypot(level.vault.x - thief.x, level.vault.y - thief.y) < CRACK_RANGE;
    if (nearVault && useHeld && !thief.moving) {
      world.cracking = true;
      world.crackProgress += dt / level.vault.crackTime;
      world.crackTickAcc += dt;
      if (world.crackTickAcc > 0.24) {
        world.crackTickAcc = 0;
        events.push('crackTick');
      }
      if (world.crackProgress >= 1) {
        world.crackProgress = 1;
        world.vaultCracked = true;
        world.lootValue += level.vault.value;
        events.push('cracked');
      }
    } else {
      world.crackProgress = Math.max(0, world.crackProgress - dt * 0.6);
    }
  }

  // --- loose loot -----------------------------------------------------------------
  level.loot.forEach((gem, i) => {
    if (!world.lootTaken[i] && Math.hypot(gem.x - thief.x, gem.y - thief.y) < THIEF_RADIUS + 12) {
      world.lootTaken[i] = true;
      world.lootValue += gem.value;
      events.push('pickup');
    }
  });

  // --- the escape -------------------------------------------------------------------
  if (world.vaultCracked) {
    const e = level.exit;
    if (thief.x >= e.x && thief.x <= e.x + e.w && thief.y >= e.y && thief.y <= e.y + e.h) {
      world.escaped = true;
      events.push('escaped');
    }
  }
  return events;
}

// The HUD's one-line objective for the current state of the world.
export function objectiveText(world) {
  if (world.vaultCracked) return 'ESCAPE! Get back to the stairs';
  const v = world.level.vault;
  const near = Math.hypot(v.x - world.thief.x, v.y - world.thief.y) < CRACK_RANGE;
  if (near) return world.cracking ? 'Cracking the vault…' : 'Hold E to crack the vault';
  return 'Reach the vault — stay out of the cones, hide in the dark';
}
