// Web Audio API engine for Rage Room.
//
// Design:
//   - One shared AudioContext per page.
//   - Each audio file is fetched once and decoded into an immutable AudioBuffer.
//   - To play a sound we create a lightweight AudioBufferSourceNode that
//     references the shared buffer, so any number of overlapping playbacks
//     cost almost nothing in memory.

const AUDIO_BASE = "res";

const MEDIA = {
  fixed: { folder: "FIXED_MEDIA", files: ["RageRoomF1.wav", "RageRoomF2.wav", "RageRoomF3.wav"] },
  alphabet: {
    folder: "ALPHABET",
    files: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(c => `${c}.wav`)
  },
  inorganic: {
    folder: "INORGANIC",
    files: ["wreck1.wav", "wreck2.wav", "wreck3.wav", "wreck4.wav", "wreck5.wav", "wreck6.wav"]
  },
  organic: {
    folder: "ORGANIC",
    files: ["gasp.wav", "Mouth1.wav", "Mouth2.wav", "Mouth3.wav", "Mouth4.wav",
            "wet1.wav", "Wet2.wav", "Wet3.wav", "Wet4.wav"]
  },
  moveon: {
    folder: "MoveOn",
    files: ["moveon1.wav", "moveon2.wav", "moveon3.wav"]
  }
};

function audioUrl(folder, file) {
  return `${AUDIO_BASE}/${folder}/${file}`;
}

class AudioEngine {
  constructor() {
    this.ctx = null;
    // category -> { fileName -> AudioBuffer }
    this.buffers = {};
  }

  _ensureContext() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
    }
    // Some browsers start the context suspended until a user gesture.
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  async _loadOne(folder, file) {
    const res = await fetch(audioUrl(folder, file));
    if (!res.ok) throw new Error(`Failed to fetch ${folder}/${file}: ${res.status}`);
    const arr = await res.arrayBuffer();
    return await this.ctx.decodeAudioData(arr);
  }

  // Load one or more categories from MEDIA.
  // onProgress({loaded, total, file}) is called after each file decodes.
  async load(categories, onProgress) {
    this._ensureContext();

    const jobs = [];
    for (const cat of categories) {
      const { folder, files } = MEDIA[cat];
      this.buffers[cat] = this.buffers[cat] || {};
      for (const file of files) jobs.push({ cat, folder, file });
    }

    let loaded = 0;
    const total = jobs.length;
    await Promise.all(jobs.map(async ({ cat, folder, file }) => {
      const buf = await this._loadOne(folder, file);
      this.buffers[cat][file] = buf;
      loaded += 1;
      if (onProgress) onProgress({ loaded, total, file });
    }));
  }

  buffer(category, file) {
    return this.buffers[category] && this.buffers[category][file];
  }

  // Plays a sound now (or at a scheduled AudioContext time). Returns the source node.
  play(category, file, when = 0) {
    const buf = this.buffer(category, file);
    if (!buf) return null;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.ctx.destination);
    src.start(when || 0);
    return src;
  }

  randomFile(category) {
    return MEDIA[category].files[Math.floor(Math.random() * MEDIA[category].files.length)];
  }

  // currentTime in seconds since the AudioContext was created.
  now() { return this.ctx ? this.ctx.currentTime : 0; }
}

// Utility: format seconds as M:SS.
function fmtTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
