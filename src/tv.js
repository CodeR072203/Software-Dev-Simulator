// A wall-mounted TV that actually plays: four little animated channels drawn to a canvas.
const HEADLINES = [
  'Local dev fixes one bug, discovers two more',
  'Study finds 9 in 10 meetings could have been a commit message',
  'Rubber duck promoted to senior engineer',
  'Tabs and spaces sign historic peace accord',
  'Cat walks across keyboard, ships feature',
  'Weather: light rain, perfect for refactoring',
];
const CHANNELS = ['Lo-fi Sunset', 'Dev News', 'Reef Cam', 'Retro Pong'];
const FRAME = 1 / 12; // the picture only needs a dozen frames a second

export function createTV({ THREE, kit, parent, x, y, z, turn, width = 1.5 }) {
  const { box, canvasTexture } = kit;
  const W = 480, H = 270, height = (width * H) / W;
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = turn;
  parent.add(group);
  box(width + 0.04, height + 0.04, 0.04, '#0b0b0d', 0, 0, 0, group, { r: 0.012 });
  const tex = canvasTexture(W, H);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  screen.position.z = 0.022;
  group.add(screen);
  const g = tex.image.getContext('2d');

  const state = { on: true, channel: 0, t: 0, wait: 0, banner: 0 };
  const pong = { x: W / 2, y: H / 2, vx: 150, vy: 95, left: H / 2, right: H / 2, score: [0, 0] };
  const fish = Array.from({ length: 7 }, (_, i) => ({ y: 50 + i * 28, speed: 22 + ((i * 37) % 30), size: 9 + (i % 3) * 5, hue: (i * 53) % 360, dir: i % 2 ? 1 : -1, phase: i * 61 }));

  const scenes = [
    function sunset(t) {
      const sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#2b1f5c'); sky.addColorStop(0.5, '#c0527a'); sky.addColorStop(0.8, '#f6a75c'); sky.addColorStop(1, '#ffd98a');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.fillStyle = '#fff1c4'; g.beginPath(); g.arc(W * 0.62, H * 0.62 + Math.sin(t * 0.2) * 6, 34, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.35)';
      for (let i = 0; i < 4; i++) { const cx = ((t * (8 + i * 3) + i * 150) % (W + 160)) - 80; g.beginPath(); g.ellipse(cx, 50 + i * 22, 46, 10, 0, 0, Math.PI * 2); g.fill(); }
      [['#5b2f6b', 0.7, 14, 26], ['#3a1f52', 0.8, 26, 20], ['#1f1238', 0.9, 44, 14]].forEach(([color, base, speed, amp], layer) => {
        g.fillStyle = color; g.beginPath(); g.moveTo(0, H);
        for (let px = 0; px <= W; px += 12) g.lineTo(px, H * base + Math.sin((px + t * speed) * 0.018 + layer * 2) * amp + Math.sin((px + t * speed) * 0.05) * amp * 0.3);
        g.lineTo(W, H); g.fill();
      });
    },
    function news(t) {
      g.fillStyle = '#10244a'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#17346b'; for (let i = 0; i < 6; i++) g.fillRect(((t * 20 + i * 90) % (W + 90)) - 90, 0, 40, H);
      g.fillStyle = '#e8c9a8'; g.beginPath(); g.arc(120, 105 + Math.sin(t * 2.2) * 1.5, 30, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#2f3a55'; g.beginPath(); g.roundRect(72, 138, 96, 90, 22); g.fill();
      g.fillStyle = '#d62839'; g.fillRect(0, 196, W, 40);
      g.fillStyle = '#ffffff'; g.font = 'bold 15px Segoe UI, sans-serif';
      g.fillText(HEADLINES[Math.floor(t / 6) % HEADLINES.length], 14, 221);
      g.fillStyle = '#0b1730'; g.fillRect(0, 236, W, 34);
      g.fillStyle = '#ffd166'; g.font = '13px Segoe UI, sans-serif';
      const ticker = HEADLINES.join('   •   ');
      g.fillText(ticker + '   •   ' + ticker, W - ((t * 60) % (ticker.length * 7.2 + 30)), 258);
      g.fillStyle = '#ffffff'; g.font = 'bold 22px Segoe UI, sans-serif'; g.fillText('DEV NEWS', 230, 70);
      g.font = '13px Segoe UI, sans-serif'; g.fillStyle = '#9fb8e8'; g.fillText('live from the standup', 232, 92);
    },
    function reef(t) {
      const water = g.createLinearGradient(0, 0, 0, H);
      water.addColorStop(0, '#2aa7c9'); water.addColorStop(1, '#0b3d66');
      g.fillStyle = water; g.fillRect(0, 0, W, H);
      g.fillStyle = '#1d6b4f';
      for (let i = 0; i < 9; i++) { const bx = 20 + i * 55; g.beginPath(); g.moveTo(bx, H); g.quadraticCurveTo(bx + Math.sin(t * 1.2 + i) * 14, H - 50, bx + Math.sin(t * 1.2 + i) * 20, H - 80 - (i % 3) * 18); g.lineTo(bx + 10, H); g.fill(); }
      for (const f of fish) {
        const px = ((f.dir > 0 ? 1 : -1) * (t * f.speed + f.phase) % (W + 80) + (W + 80)) % (W + 80) - 40;
        const py = f.y + Math.sin(t * 1.4 + f.phase) * 7;
        g.fillStyle = `hsl(${f.hue}, 85%, 62%)`;
        g.beginPath(); g.ellipse(px, py, f.size, f.size * 0.55, 0, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.moveTo(px - f.dir * f.size, py); g.lineTo(px - f.dir * f.size * 1.8, py - f.size * 0.6); g.lineTo(px - f.dir * f.size * 1.8, py + f.size * 0.6); g.fill();
        g.fillStyle = '#10151a'; g.beginPath(); g.arc(px + f.dir * f.size * 0.55, py - 2, 1.6, 0, Math.PI * 2); g.fill();
      }
      g.strokeStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 10; i++) { g.beginPath(); g.arc(40 + i * 46 + Math.sin(t + i) * 5, H - ((t * (26 + i * 3) + i * 40) % H), 2 + (i % 3), 0, Math.PI * 2); g.stroke(); }
    },
    function retroPong(t, dt) {
      const p = pong;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y < 8 || p.y > H - 8) { p.vy = -p.vy; p.y = Math.max(8, Math.min(H - 8, p.y)); }
      // each paddle chases the ball, a little too slowly to be perfect
      const chase = (pos, speed) => pos + Math.max(-speed * dt, Math.min(speed * dt, p.y - pos));
      if (p.vx < 0) p.left = chase(p.left, 115); else p.right = chase(p.right, 112);
      if (p.x < 22 && Math.abs(p.y - p.left) < 30) { p.vx = Math.abs(p.vx); p.vy += (p.y - p.left) * 2; }
      if (p.x > W - 22 && Math.abs(p.y - p.right) < 30) { p.vx = -Math.abs(p.vx); p.vy += (p.y - p.right) * 2; }
      p.vy = Math.max(-190, Math.min(190, p.vy));
      if (p.x < 0 || p.x > W) {
        const leftMissed = p.x < 0;
        p.score[leftMissed ? 1 : 0]++;
        Object.assign(p, { x: W / 2, y: H / 2, vx: leftMissed ? 150 : -150, vy: 95 * (Math.sin(t) > 0 ? 1 : -1) });
      }
      g.fillStyle = '#0a0a0a'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#7CFFB2';
      for (let dash = 6; dash < H; dash += 22) g.fillRect(W / 2 - 2, dash, 4, 12);
      g.fillRect(10, p.left - 26, 8, 52); g.fillRect(W - 18, p.right - 26, 8, 52);
      g.fillRect(p.x - 5, p.y - 5, 10, 10);
      g.font = 'bold 34px Consolas, monospace'; g.fillText(String(p.score[0] % 10), W / 2 - 56, 44); g.fillText(String(p.score[1] % 10), W / 2 + 36, 44);
    },
  ];

  function draw(dt) {
    if (!state.on) {
      g.fillStyle = '#050506'; g.fillRect(0, 0, W, H);
    } else {
      scenes[state.channel](state.t, dt);
      if (state.banner > 0) {
        g.fillStyle = 'rgba(0,0,0,0.6)'; g.beginPath(); g.roundRect(W - 190, 12, 178, 30, 8); g.fill();
        g.fillStyle = '#ffffff'; g.font = '14px Segoe UI, sans-serif';
        g.fillText(`${state.channel + 1}  ${CHANNELS[state.channel]}`, W - 178, 32);
      }
    }
    tex.needsUpdate = true;
  }

  // `watched` is false when nobody can see the screen, so it stops redrawing
  function update(dt, watched) {
    state.t += dt;
    state.banner = Math.max(0, state.banner - dt);
    state.wait += dt;
    if (!watched || state.wait < FRAME) return;
    draw(Math.min(state.wait, 0.2));
    state.wait = 0;
  }
  function toggle() { state.on = !state.on; state.banner = 2.5; draw(0); }
  function next(step) { state.channel = (state.channel + step + CHANNELS.length) % CHANNELS.length; state.banner = 2.5; }

  draw(0);
  return { group, state, update, toggle, next, channelName: () => CHANNELS[state.channel] };
}
