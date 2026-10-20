// Shared photo for the TV and the computer's canvas displays.
export const wallpaper = new Image();
wallpaper.src = new URL('../assets/screen-photo.jpg', import.meta.url).href;

export function drawWallpaper(g, width, height) {
  g.fillStyle = '#171610';
  g.fillRect(0, 0, width, height);
  if (!wallpaper.complete || !wallpaper.naturalWidth) return;
  // Keep the entire portrait visible, with dark bars on wide displays.
  const scale = Math.min(width / wallpaper.naturalWidth, height / wallpaper.naturalHeight);
  const w = wallpaper.naturalWidth * scale, h = wallpaper.naturalHeight * scale;
  g.drawImage(wallpaper, (width - w) / 2, (height - h) / 2, w, h);
}
