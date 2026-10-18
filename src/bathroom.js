// A small tiled bathroom built onto the far side of an existing wall.
//
// `wallX` is the wall's face on the bathroom side and `dir` (+1 or -1) is which way the room
// extends from it, so the same code builds the condo's bathroom (to the west) and the lounge's
// (to the east). Distances "into the room" below are measured from that wall.
const DEPTH = 2.4, H = 3, DOOR_HEIGHT = 2.1;

export function createBathroom({ THREE, room, kit, wallX, dir, z0, z1, doorZ0, doorZ1, shower, key, onUse }) {
  const { box, cyl, mat, add, canvasTexture, collide, interactive } = kit;
  const at = (into) => wallX + dir * into;
  const zMid = (z0 + z1) / 2;
  // there is no lamp in here, so the tiles are slightly self-lit to keep the room bright at night
  const tile = (color = '#eef1f2') => mat(color, { emissive: color, emissiveIntensity: 0.3, roughness: 0.5 });
  const WHITE = '#fbfbfa', CHROME = { metalness: 0.3, roughness: 0.3 };

  // ── shell ──
  const floorTex = canvasTexture(256, 256, (g, w) => {
    g.fillStyle = '#c9d2d6'; g.fillRect(0, 0, w, w);
    g.fillStyle = '#e9eef0';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) g.fillRect(i * 64 + 2, j * 64 + 2, 60, 60);
  });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(2, 2);
  const floor = add(new THREE.PlaneGeometry(DEPTH, z1 - z0), mat('#ffffff', { map: floorTex, emissive: '#ffffff', emissiveIntensity: 0.12 }), at(DEPTH / 2), 0.001, zMid);
  floor.rotation.x = -Math.PI / 2;
  add(new THREE.BoxGeometry(0.2, H, z1 - z0 + 0.4), tile(), at(DEPTH + 0.1), H / 2, zMid);
  for (const z of [z0 - 0.1, z1 + 0.1]) add(new THREE.BoxGeometry(DEPTH, H, 0.2), tile(), at(DEPTH / 2), H / 2, z);
  add(new THREE.BoxGeometry(DEPTH + 0.2, 0.2, z1 - z0 + 0.4), tile('#f6f6f4'), at(DEPTH / 2), H + 0.1, zMid);
  const lightPanel = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), new THREE.MeshBasicMaterial({ color: '#fff6e6' }));
  lightPanel.position.set(at(DEPTH / 2), H - 0.004, zMid);
  lightPanel.rotation.x = Math.PI / 2;
  room.add(lightPanel);
  // the strip of floor under the door, inside the wall's thickness
  const sill = add(new THREE.PlaneGeometry(0.26, doorZ1 - doorZ0), mat('#3a3a40'), wallX - dir * 0.1, 0.002, (doorZ0 + doorZ1) / 2);
  sill.rotation.x = -Math.PI / 2;

  // ── door (swings into the bathroom) ──
  const pivot = new THREE.Group();
  pivot.position.set(wallX - dir * 0.1, 0, doorZ0);
  room.add(pivot);
  const width = doorZ1 - doorZ0;
  box(0.05, DOOR_HEIGHT, width, '#e8e6e2', 0, DOOR_HEIGHT / 2, width / 2, pivot, { r: 0.01 });
  for (const side of [-0.05, 0.05]) cyl(0.018, 0.018, 0.12, '#c9ccd1', side, 1.0, width - 0.1, pivot);
  const door = { open: false, swing: 0 };
  interactive(pivot, `${key}Door`, () => (door.open ? 'Close the bathroom door' : 'Open the bathroom door'), () => { door.open = !door.open; });

  // ── vanity and mirror, along the z0 wall ──
  const vanity = new THREE.Group();
  room.add(vanity);
  box(0.9, 0.78, 0.48, '#6e4a32', at(0.95), 0.39, z0 + 0.25, vanity);
  box(0.94, 0.04, 0.52, WHITE, at(0.95), 0.8, z0 + 0.27, vanity, { r: 0.012 });
  cyl(0.19, 0.15, 0.09, WHITE, at(0.95), 0.865, z0 + 0.29, vanity);
  cyl(0.15, 0.12, 0.01, '#cfe3ee', at(0.95), 0.906, z0 + 0.29, vanity);
  cyl(0.014, 0.014, 0.2, '#d5d7db', at(0.95), 0.92, z0 + 0.08, vanity, CHROME);
  box(0.03, 0.03, 0.14, '#d5d7db', at(0.95), 1.01, z0 + 0.14, vanity, CHROME);
  const mirrorTex = canvasTexture(128, 160, (g, w, h) => {
    const sheen = g.createLinearGradient(0, 0, w, h);
    sheen.addColorStop(0, '#dfeef5'); sheen.addColorStop(0.45, '#b9d3df'); sheen.addColorStop(0.55, '#e9f4f8'); sheen.addColorStop(1, '#a9c5d3');
    g.fillStyle = sheen; g.fillRect(0, 0, w, h);
  });
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.0), new THREE.MeshBasicMaterial({ map: mirrorTex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  mirror.position.set(at(0.95), 1.6, z0 + 0.008);
  vanity.add(mirror);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.03), new THREE.MeshBasicMaterial({ color: '#fff3d6' }));
  strip.position.set(at(0.95), 2.16, z0 + 0.03);
  vanity.add(strip);
  collide(Math.min(at(0.48), at(1.42)), Math.max(at(0.48), at(1.42)), z0, z0 + 0.52);
  interactive(vanity, `${key}Sink`, 'Wash your face', () => onUse('sink'));

  // ── toilet, against the far wall ──
  const toiletZ = shower ? z0 + 1.25 : zMid + 0.5;
  const toilet = new THREE.Group();
  room.add(toilet);
  box(0.52, 0.4, 0.38, WHITE, at(DEPTH - 0.42), 0.2, toiletZ, toilet, { r: 0.13 });
  box(0.5, 0.04, 0.4, WHITE, at(DEPTH - 0.42), 0.42, toiletZ, toilet, { r: 0.018 });
  box(0.2, 0.4, 0.44, WHITE, at(DEPTH - 0.1), 0.62, toiletZ, toilet, { r: 0.04 });
  cyl(0.02, 0.02, 0.012, '#d5d7db', at(DEPTH - 0.1), 0.83, toiletZ, toilet, CHROME);
  box(0.12, 0.12, 0.13, WHITE, at(DEPTH - 0.02), 0.7, toiletZ - 0.5, toilet, { r: 0.05 }); // paper roll
  collide(Math.min(at(DEPTH - 0.7), at(DEPTH)), Math.max(at(DEPTH - 0.7), at(DEPTH)), toiletZ - 0.22, toiletZ + 0.22);
  interactive(toilet, `${key}Toilet`, 'Use the toilet', () => onUse('toilet'));

  // ── towel and bath mat ──
  box(0.5, 0.62, 0.05, key === 'homeBath' ? '#d9a441' : '#8fb8a8', at(0.6), 1.2, z1 - 0.03, room, { r: 0.02 });
  cyl(0.012, 0.012, 0.6, '#d5d7db', at(0.6), 1.52, z1 - 0.05, room, CHROME).rotation.z = Math.PI / 2;
  box(0.7, 0.02, 0.45, '#8c8f96', at(1.0), 0.012, zMid + 0.1, room, { r: 0.008 });

  // ── walk-in shower, in the far corner by the z1 wall ──
  let spray = () => {};
  if (shower) {
    const stall = new THREE.Group();
    room.add(stall);
    box(0.95, 0.05, 0.95, '#dfe5e8', at(DEPTH - 0.48), 0.025, z1 - 0.48, stall, { r: 0.02 });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 2.0), new THREE.MeshStandardMaterial({ color: '#bfe0f5', transparent: true, opacity: 0.2, roughness: 0.1, side: THREE.DoubleSide, depthWrite: false }));
    glass.position.set(at(DEPTH - 0.48), 1.05, z1 - 0.96);
    stall.add(glass);
    cyl(0.012, 0.012, 1.3, '#d5d7db', at(DEPTH - 0.04), 1.5, z1 - 0.48, stall, CHROME);
    cyl(0.012, 0.012, 0.4, '#d5d7db', at(DEPTH - 0.24), 2.14, z1 - 0.48, stall, CHROME).rotation.z = Math.PI / 2;
    cyl(0.13, 0.13, 0.025, '#d5d7db', at(DEPTH - 0.44), 2.12, z1 - 0.48, stall, CHROME);
    cyl(0.03, 0.03, 0.05, '#d5d7db', at(DEPTH - 0.03), 1.1, z1 - 0.48, stall, CHROME).rotation.z = Math.PI / 2;
    // falling water, shown only while you shower
    const drops = [];
    for (let i = 0; i < 14; i++) {
      const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 5), new THREE.MeshBasicMaterial({ color: '#d9efff', transparent: true, opacity: 0.6 }));
      drop.userData.offset = [Math.cos(i * 2.4) * 0.09 * (0.4 + (i % 3) * 0.3), Math.sin(i * 2.4) * 0.09 * (0.4 + (i % 3) * 0.3), i / 14];
      drop.visible = false;
      stall.add(drop);
      drops.push(drop);
    }
    spray = (t, on) => drops.forEach((drop) => {
      const [dx, dz, phase] = drop.userData.offset;
      drop.visible = on;
      drop.position.set(at(DEPTH - 0.44) + dx, 2.1 - ((t * 1.6 + phase) % 1) * 2.0, z1 - 0.48 + dz);
    });
    interactive(stall, `${key}Shower`, 'Take a shower', () => onUse('shower'));
  }

  // walkable areas: the room itself, and its doorway while the door is open
  const zones = [
    { minX: Math.min(at(0), at(DEPTH)), maxX: Math.max(at(0), at(DEPTH)), minZ: z0, maxZ: z1 },
    { minX: Math.min(at(-0.8), at(0.5)), maxX: Math.max(at(-0.8), at(0.5)), minZ: doorZ0, maxZ: doorZ1, pad: 0.1, gate: () => door.swing > 0.8 },
  ];
  // where the camera stands while you shower
  const showerPose = { pos: [at(DEPTH - 0.5), 1.6, z1 - 0.5], look: [at(0), 1.5, zMid] };

  function update(dt, t, showering) {
    door.swing += ((door.open ? 1 : 0) - door.swing) * Math.min(1, dt * 6);
    pivot.rotation.y = dir * door.swing * 1.5;
    spray(t, showering);
  }
  return { zones, update, door, showerPose };
}
