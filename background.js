// Pixel-art noise background + white overlay used by all pages.
//
// The canvas is a low-resolution offscreen buffer (1 noise cell == 10 screen
// pixels); CSS image-rendering: pixelated upscales it without smoothing.
// A separate <div> sits on top of the canvas as a white overlay whose
// opacity is driven by the active page (see admin.js / player.js).

const Background = (() => {
  const CELL = 10;
  let canvas = null;
  let overlay = null;
  let ctx = null;

  function init() {
    canvas = document.getElementById("noise-canvas");
    overlay = document.getElementById("white-overlay");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
  }

  function resize() {
    if (!canvas) return;
    canvas.width = Math.max(1, Math.ceil(window.innerWidth / CELL));
    canvas.height = Math.max(1, Math.ceil(window.innerHeight / CELL));
    paint();
  }

  // Repaint the noise with fresh random values.
  // Each cell is a grayscale value in [0, 100] (out of 255), so the noise
  // reads as dark dots that show through the white overlay.
  function paint() {
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let i = 0; i < w * h; i++) {
      const v = (Math.random() * 101) | 0;
      const j = i * 4;
      d[j] = v;
      d[j + 1] = v;
      d[j + 2] = v;
      d[j + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  // smooth = true: animate over 300ms (used for per-Enter steps).
  // smooth = false: instant (used to snap at movement boundaries).
  function setOpacity(value, smooth = false) {
    if (!overlay) return;
    overlay.style.transition = smooth ? "opacity 0.3s ease" : "none";
    overlay.style.opacity = String(value);
  }

  return { init, paint, setOpacity };
})();

document.addEventListener("DOMContentLoaded", () => Background.init());
