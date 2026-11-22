// Vaultfall — everything drawn on the canvas: the floor, walls and shadow zones,
// vision cones that stop at walls, guards, cameras, the vault, the thief, the HUD
// (alarm meter, loot, timer, objective) and the title / pause / win / lose overlays.

import {
  VIEW_W, VIEW_H, HUD_H, FLOOR, COLORS,
  GUARD_VIEW_RANGE, GUARD_VIEW_HALF_ANGLE,
  CAMERA_VIEW_RANGE, CAMERA_VIEW_HALF_ANGLE, ALARM_MAX,
} from './config.js';
import { rayDistance, objectiveText } from './world.js';

function fmtMoney(n) {
  return '$' + n.toLocaleString('en-US');
}

function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// --- the room ---------------------------------------------------------------

function drawFloor(ctx, level) {
  ctx.fillStyle = COLORS.floorA;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // A quiet checker of floor tiles so movement reads against the ground.
  const tile = 46;
  for (let y = FLOOR.y; y < FLOOR.y + FLOOR.h; y += tile) {
    for (let x = FLOOR.x; x < FLOOR.x + FLOOR.w; x += tile) {
      const odd = ((x - FLOOR.x) / tile + (y - FLOOR.y) / tile) % 2 === 0;
      ctx.fillStyle = odd ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.strokeStyle = COLORS.floorLine;
  ctx.lineWidth = 1;
  for (let x = FLOOR.x; x <= FLOOR.x + FLOOR.w; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, FLOOR.y); ctx.lineTo(x, FLOOR.y + FLOOR.h); ctx.stroke();
  }
  for (let y = FLOOR.y; y <= FLOOR.y + FLOOR.h; y += tile) {
    ctx.beginPath(); ctx.moveTo(FLOOR.x, y); ctx.lineTo(FLOOR.x + FLOOR.w, y); ctx.stroke();
  }
  // The floor's outer rim.
  ctx.strokeStyle = COLORS.wallEdge;
  ctx.lineWidth = 4;
  ctx.strokeRect(FLOOR.x - 2, FLOOR.y - 2, FLOOR.w + 4, FLOOR.h + 4);
}

function drawExit(ctx, level, world) {
  const e = level.exit;
  const active = world.vaultCracked;
  ctx.fillStyle = COLORS.exit;
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = active ? COLORS.exitGlow : '#2c7a4e';
  ctx.lineWidth = active ? 3 : 2;
  if (active && Math.floor(world.time * 3) % 2 === 0) ctx.lineWidth = 5;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  // Stair treads.
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  for (let i = 1; i < 5; i++) {
    const y = e.y + (e.h / 5) * i;
    ctx.beginPath(); ctx.moveTo(e.x + 8, y); ctx.lineTo(e.x + e.w - 8, y); ctx.stroke();
  }
  ctx.fillStyle = '#dff5e6';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y - 8);
}

function drawShadows(ctx, level) {
  for (const [x, y, w, h] of level.shadows) {
    ctx.fillStyle = COLORS.shadow;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = COLORS.shadowEdge;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
  }
}

function drawWalls(ctx, level) {
  for (const [x, y, w, h] of level.walls) {
    ctx.fillStyle = COLORS.wallEdge;
    ctx.fillRect(x, y + 4, w, h);
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(x, y, w, 4);
  }
}

function drawLoot(ctx, level, world) {
  level.loot.forEach((gem, i) => {
    if (world.lootTaken[i]) return;
    const bob = Math.sin(world.time * 3 + i * 1.7) * 3;
    const y = gem.y + bob;
    ctx.save();
    ctx.translate(gem.x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = COLORS.loot;
    ctx.fillRect(-7, -7, 14, 14);
    ctx.fillStyle = '#fff3b0';
    ctx.fillRect(-3.5, -3.5, 7, 7);
    ctx.restore();
  });
}

// --- vision cones -------------------------------------------------------------

function drawCone(ctx, x, y, angle, halfAngle, range, walls, alert) {
  const steps = 22;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i <= steps; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / steps;
    const d = rayDistance(x, y, a, range, walls);
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
  ctx.fillStyle = alert ? COLORS.coneAlert : COLORS.coneCalm;
  ctx.fill();
  ctx.strokeStyle = alert ? COLORS.coneAlertEdge : COLORS.coneEdge;
  ctx.lineWidth = 1;
  ctx.stroke();
}

// --- actors -------------------------------------------------------------------

function drawGuard(ctx, guard) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(guard.x, guard.y + 12, 13, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath(); ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2); ctx.fill();
  // The red cap points the way he faces.
  ctx.fillStyle = COLORS.guardCap;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 14, guard.angle - 1.1, guard.angle + 1.1);
  ctx.lineTo(guard.x, guard.y);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#dbe4f5';
  ctx.beginPath(); ctx.arc(guard.x, guard.y, 5, 0, Math.PI * 2); ctx.fill();
  if (guard.seen) drawBang(ctx, guard.x, guard.y - 26);
}

function drawCamera(ctx, cam, time) {
  ctx.fillStyle = COLORS.camera;
  ctx.fillRect(cam.x - 9, cam.y - 9, 18, 18);
  ctx.fillStyle = '#202635';
  ctx.beginPath(); ctx.arc(cam.x, cam.y, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#9fb4d8';
  ctx.beginPath();
  ctx.arc(cam.x + Math.cos(cam.angle) * 3, cam.y + Math.sin(cam.angle) * 3, 3, 0, Math.PI * 2);
  ctx.fill();
  // The recording LED blinks; it burns steady red while it sees the thief.
  const ledOn = cam.seen || Math.floor(time * 1.4) % 2 === 0;
  if (ledOn) {
    ctx.fillStyle = '#ff4d4d';
    ctx.beginPath(); ctx.arc(cam.x + 6, cam.y - 6, 2.6, 0, Math.PI * 2); ctx.fill();
  }
  if (cam.seen) drawBang(ctx, cam.x, cam.y - 24);
}

function drawBang(ctx, x, y) {
  ctx.fillStyle = '#f8503c';
  ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('!', x, y + 5);
}

function drawThief(ctx, thief) {
  ctx.save();
  if (thief.hidden) ctx.globalAlpha = 0.45;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(thief.x, thief.y + 11, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS.thiefHood;
  ctx.beginPath(); ctx.arc(thief.x, thief.y, 13, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = thief.hidden ? 'rgba(140,170,255,0.7)' : 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // The face peers out of the hood toward the way he moves.
  ctx.fillStyle = COLORS.thief;
  ctx.beginPath();
  ctx.arc(thief.x + Math.cos(thief.angle) * 4, thief.y + Math.sin(thief.angle) * 4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (thief.hidden) {
    ctx.fillStyle = 'rgba(140,170,255,0.85)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('hidden', thief.x, thief.y - 20);
  }
  if (thief.seen) drawBang(ctx, thief.x, thief.y - 26);
}

function drawVault(ctx, level, world) {
  const v = level.vault;
  const cracked = world.vaultCracked;
  // A soft gold halo so the target reads from across the room.
  const glow = ctx.createRadialGradient(v.x, v.y, 6, v.x, v.y, 58);
  glow.addColorStop(0, cracked ? 'rgba(55,214,122,0.35)' : 'rgba(245,197,66,0.30)');
  glow.addColorStop(1, 'rgba(245,197,66,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(v.x, v.y, 58, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#11182b';
  ctx.beginPath(); ctx.arc(v.x, v.y, 31, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = cracked ? COLORS.exitGlow : COLORS.vaultRing;
  ctx.lineWidth = 6;
  ctx.stroke();
  if (cracked) {
    ctx.fillStyle = COLORS.vaultGold;
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', v.x, v.y + 7);
  } else {
    // Wheel spokes on the safe door.
    ctx.strokeStyle = COLORS.vaultRing;
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      const a = (Math.PI / 3) * i + 0.4;
      ctx.beginPath();
      ctx.moveTo(v.x - Math.cos(a) * 20, v.y - Math.sin(a) * 20);
      ctx.lineTo(v.x + Math.cos(a) * 20, v.y + Math.sin(a) * 20);
      ctx.stroke();
    }
    ctx.fillStyle = COLORS.vaultGold;
    ctx.beginPath(); ctx.arc(v.x, v.y, 6, 0, Math.PI * 2); ctx.fill();
    // The cracking progress rings the door.
    if (world.crackProgress > 0) {
      ctx.strokeStyle = COLORS.vaultGold;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(v.x, v.y, 40, -Math.PI / 2, -Math.PI / 2 + world.crackProgress * Math.PI * 2);
      ctx.stroke();
    }
    const near = Math.hypot(v.x - world.thief.x, v.y - world.thief.y) < 90;
    if (near && !world.cracking) {
      ctx.fillStyle = '#dbe4f5';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Hold E', v.x, v.y - 48);
    }
  }
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VAULT', v.x, v.y + 52);
}

// --- HUD ------------------------------------------------------------------------

function drawHUD(ctx, world, bankedLoot, bankedTime) {
  ctx.fillStyle = COLORS.hudBar;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = COLORS.floorLine;
  ctx.fillRect(0, HUD_H - 2, VIEW_W, 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.vaultGold;
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.fillText('VAULTFALL', 18, 27);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(world.level.name, 18, 48);

  // The alarm meter, centre stage: it is the game's clock of doom.
  const meterX = VIEW_W / 2 - 190;
  const meterW = 380;
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('A L A R M', VIEW_W / 2, 20);
  ctx.fillStyle = '#1b2338';
  ctx.fillRect(meterX, 28, meterW, 18);
  const frac = world.alarm / ALARM_MAX;
  ctx.fillStyle = frac < 0.45 ? COLORS.alarmLow : frac < 0.75 ? COLORS.alarmMid : COLORS.alarmHigh;
  ctx.fillRect(meterX, 28, meterW * frac, 18);
  ctx.strokeStyle = world.thief.seen ? COLORS.alarmHigh : '#3a4767';
  ctx.lineWidth = world.thief.seen ? 3 : 1;
  ctx.strokeRect(meterX, 28, meterW, 18);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(`${Math.floor(world.alarm)}%`, VIEW_W / 2, 59);

  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.fillText(fmtMoney(bankedLoot + world.lootValue), VIEW_W - 18, 27);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`time ${fmtTime(bankedTime + world.time)}`, VIEW_W - 18, 48);

  // The objective, as a pill along the bottom edge.
  const text = objectiveText(world);
  ctx.font = 'bold 14px system-ui, sans-serif';
  const w = ctx.measureText(text).width + 28;
  ctx.fillStyle = 'rgba(7, 9, 15, 0.82)';
  ctx.beginPath();
  ctx.roundRect(VIEW_W / 2 - w / 2, VIEW_H - 36, w, 26, 13);
  ctx.fill();
  ctx.fillStyle = world.vaultCracked ? COLORS.exitGlow : COLORS.hudText;
  ctx.textAlign = 'center';
  ctx.fillText(text, VIEW_W / 2, VIEW_H - 18);
}

// --- whole frame and overlays -----------------------------------------------------

export function renderScene(ctx, world, bankedLoot, bankedTime) {
  drawFloor(ctx, world.level);
  drawExit(ctx, world.level, world);
  drawShadows(ctx, world.level);
  drawLoot(ctx, world.level, world);
  for (const guard of world.guards) {
    drawCone(ctx, guard.x, guard.y, guard.angle, GUARD_VIEW_HALF_ANGLE, GUARD_VIEW_RANGE, world.level.walls, guard.seen);
  }
  for (const cam of world.cameras) {
    drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA_VIEW_HALF_ANGLE, CAMERA_VIEW_RANGE, world.level.walls, cam.seen);
  }
  drawWalls(ctx, world.level);
  drawVault(ctx, world.level, world);
  for (const cam of world.cameras) drawCamera(ctx, cam, world.time);
  for (const guard of world.guards) drawGuard(ctx, guard);
  drawThief(ctx, world.thief);
  drawHUD(ctx, world, bankedLoot, bankedTime);
}

function dim(ctx, alpha) {
  ctx.fillStyle = `rgba(4, 6, 12, ${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function centerText(ctx, text, y, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, VIEW_W / 2, y);
}

export function drawTitleOverlay(ctx, world) {
  dim(ctx, 0.55);
  centerText(ctx, 'VAULTFALL', 250, 'bold 84px system-ui, sans-serif', COLORS.vaultGold);
  centerText(ctx, 'One thief. Two floors. Every camera awake.', 292, '20px system-ui, sans-serif', COLORS.hudText);
  centerText(ctx, world.level.brief, 340, '17px system-ui, sans-serif', COLORS.hudDim);
  const lines = [
    'Move — WASD or arrow keys',
    'Hold E beside the vault to crack it',
    'Dark patches hide you. Cones fill the alarm. A full alarm is a locked door.',
    'Grab the loose gems on the way — then run for the stairs.',
  ];
  lines.forEach((line, i) => centerText(ctx, line, 402 + i * 27, '15px system-ui, sans-serif', COLORS.hudText));
  centerText(ctx, 'Press ENTER to start the heist', 556, 'bold 22px system-ui, sans-serif', COLORS.exitGlow);
  centerText(ctx, 'P pauses · R restarts the floor', 590, '13px system-ui, sans-serif', COLORS.hudDim);
}

export function drawBriefOverlay(ctx, world) {
  dim(ctx, 0.45);
  centerText(ctx, world.level.name.toUpperCase(), 360, 'bold 40px system-ui, sans-serif', COLORS.vaultGold);
  centerText(ctx, world.level.brief, 402, '18px system-ui, sans-serif', COLORS.hudText);
}

export function drawPauseOverlay(ctx) {
  dim(ctx, 0.5);
  centerText(ctx, 'PAUSED', 380, 'bold 52px system-ui, sans-serif', COLORS.hudText);
  centerText(ctx, 'Press P to keep going', 424, '17px system-ui, sans-serif', COLORS.hudDim);
}

export function drawWinOverlay(ctx, totalLoot, totalTime) {
  dim(ctx, 0.62);
  centerText(ctx, 'CLEAN GETAWAY', 320, 'bold 58px system-ui, sans-serif', COLORS.exitGlow);
  centerText(ctx, 'The Meridian Bank wakes up poorer and none the wiser.', 362, '18px system-ui, sans-serif', COLORS.hudText);
  centerText(ctx, `Loot  ${fmtMoney(totalLoot)}`, 420, 'bold 26px system-ui, sans-serif', COLORS.loot);
  centerText(ctx, `Time  ${fmtTime(totalTime)}`, 456, 'bold 26px system-ui, sans-serif', COLORS.hudText);
  centerText(ctx, 'Press R to rob it again', 540, 'bold 20px system-ui, sans-serif', COLORS.vaultGold);
}

export function drawLoseOverlay(ctx, world, bankedLoot) {
  dim(ctx, 0.62);
  centerText(ctx, 'CAUGHT!', 320, 'bold 64px system-ui, sans-serif', COLORS.alarmHigh);
  centerText(ctx, world.caughtReason, 362, '18px system-ui, sans-serif', COLORS.hudText);
  centerText(ctx, `You were carrying ${fmtMoney(bankedLoot + world.lootValue)}`, 420, 'bold 22px system-ui, sans-serif', COLORS.loot);
  centerText(ctx, 'Press R to try the floor again', 540, 'bold 20px system-ui, sans-serif', COLORS.vaultGold);
}
