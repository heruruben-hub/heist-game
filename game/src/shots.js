// Vaultfall — deterministic scenes for the screenshots in screenshots/.
// Opening game/index.html?shot=N freezes the game in one composed frame (the maker's
// camera, essentially): fixed positions, fixed angles, a fixed alarm level, so the
// PNG the browser renders is the same every time. main.js renders these instead of
// running the loop. The scenes are numbered to match the screenshot file names.

function placeGuard(world, index, x, y, angle, seen = false) {
  const guard = world.guards[index];
  guard.x = x;
  guard.y = y;
  guard.angle = angle;
  guard.seen = seen;
}

function placeCamera(world, index, angle, seen = false) {
  const cam = world.cameras[index];
  cam.angle = angle;
  cam.seen = seen;
}

// Compose scene `n` (1..4) on a fresh world of the first floor.
// Returns which overlay the frame wears: 'title' or 'none'.
export function applyShot(world, n) {
  const thief = world.thief;
  if (n === 1) {
    // The cover: the title over a live-looking floor — thief mid-crossing,
    // one cone sweeping the middle, the vault glowing in its alcove.
    world.time = 12;
    thief.x = 520; thief.y = 430; thief.angle = 0;
    placeGuard(world, 0, 480, 210, 0.6);
    placeGuard(world, 1, 140, 300, Math.PI / 2);
    placeGuard(world, 2, 1100, 620, Math.PI);
    placeCamera(world, 0, Math.PI / 2 + 0.4);
    placeCamera(world, 1, Math.PI - 0.3);
    return 'title';
  }
  if (n === 2) {
    // Mid-crossing: a guard's cone has just caught the thief; the alarm climbs.
    world.time = 47;
    world.alarm = 58;
    world.wasSeen = true;
    thief.x = 540; thief.y = 420; thief.angle = 0; thief.seen = true;
    placeGuard(world, 0, 690, 315, 2.53, true);
    placeGuard(world, 1, 140, 300, Math.PI / 2);
    placeGuard(world, 2, 1100, 620, Math.PI);
    placeCamera(world, 0, Math.PI / 2 - 0.5);
    placeCamera(world, 1, Math.PI + 0.2);
    world.lootTaken[0] = true;
    world.lootValue = 400;
    return 'none';
  }
  if (n === 3) {
    // Hands on the vault: the crack is two-thirds done and a patrol is close.
    world.time = 83;
    world.alarm = 34;
    thief.x = 1096; thief.y = 214; thief.angle = -0.6;
    world.crackProgress = 0.62;
    world.cracking = true;
    placeGuard(world, 0, 760, 180, 0);
    placeGuard(world, 1, 140, 520, -Math.PI / 2);
    placeGuard(world, 2, 1010, 600, -Math.PI / 2);
    placeCamera(world, 0, Math.PI / 2 + 0.55);
    placeCamera(world, 1, Math.PI - 0.45);
    world.lootTaken[1] = true;
    world.lootValue = 600;
    return 'none';
  }
  // n === 4: the getaway — vault open, alarm screaming, one guard on his heels
  // and the stairs a few steps away.
  world.time = 129;
  world.alarm = 81;
  world.wasSeen = true;
  world.vaultCracked = true;
  world.crackProgress = 1;
  thief.x = 150; thief.y = 424; thief.angle = Math.PI; thief.seen = true;
  placeGuard(world, 0, 480, 210, 0.6);
  placeGuard(world, 1, 252, 424, Math.PI, true);
  placeGuard(world, 2, 1100, 620, Math.PI);
  placeCamera(world, 0, Math.PI / 2);
  placeCamera(world, 1, Math.PI);
  world.lootTaken[0] = true;
  world.lootTaken[2] = true;
  world.lootValue = 6200;
  return 'none';
}
