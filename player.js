// Player page: preloads every keystroke sound, runs a 5-second cue countdown,
// then drives the three movements via an internal clock based on the known
// fixed-media durations (SECTION_DURATIONS in prompts.js).
//
// Within a movement, each letter keystroke produces a sound chosen with
// movement-specific probabilities. Enter advances to the next prompt and
// plays a random "move on" sound.

(function () {
  const engine = new AudioEngine();

  const stages = {
    load: document.getElementById("stage-load"),
    progress: document.getElementById("stage-progress"),
    ready: document.getElementById("stage-ready"),
    countdown: document.getElementById("stage-countdown"),
    playing: document.getElementById("stage-playing"),
    done: document.getElementById("stage-done")
  };

  function show(stageName) {
    for (const [name, el] of Object.entries(stages)) {
      el.classList.toggle("hidden", name !== stageName);
    }
  }

  const loadBtn = document.getElementById("load-btn");
  const startBtn = document.getElementById("start-btn");
  const progressFill = document.getElementById("progress-fill");
  const progressLabel = document.getElementById("progress-label");
  const countdownEl = document.getElementById("countdown");
  const sectionLabel = document.getElementById("section-label");
  const sectionTimer = document.getElementById("section-timer");
  const promptText = document.getElementById("prompt-text");
  const typingArea = document.getElementById("typing-area");

  loadBtn.addEventListener("click", async () => {
    show("progress");
    try {
      await engine.load(["alphabet", "inorganic", "organic", "moveon"], ({ loaded, total }) => {
        const pct = total > 0 ? (loaded / total) * 100 : 0;
        progressFill.style.width = pct + "%";
        progressLabel.textContent = `Loading… ${loaded} / ${total}`;
      });
      show("ready");
    } catch (err) {
      progressLabel.textContent = "Load failed: " + err.message;
    }
  });

  startBtn.addEventListener("click", () => {
    runCountdown();
  });

  function runCountdown() {
    show("countdown");
    let n = 5;
    countdownEl.textContent = n;
    const interval = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(interval);
        startPiece();
      } else {
        countdownEl.textContent = n;
      }
    }, 1000);
  }

  // Boundaries (in seconds since piece start) for each movement.
  // boundaries[i] is the start of movement i+1; piece ends at boundaries[3].
  const boundaries = [
    0,
    SECTION_DURATIONS[0],
    SECTION_DURATIONS[0] + SECTION_DURATIONS[1],
    SECTION_DURATIONS[0] + SECTION_DURATIONS[1] + SECTION_DURATIONS[2]
  ];

  let pieceStart = 0;      // AudioContext time when the piece begins
  let currentMovement = 1; // 1, 2, or 3

  // === Section intro lock ===
  // At the start of each section the typing area is disabled for a short
  // window so participants listen to the therapist before typing.
  const SECTION_LOCK_SECONDS = 7;
  const LOCK_PLACEHOLDER = "please wait for the therapist to finish speaking";
  const READY_PLACEHOLDER = typingArea.getAttribute("placeholder");
  let sectionLockTimer = null;

  function lockTypingForSection() {
    if (sectionLockTimer) clearTimeout(sectionLockTimer);
    typingArea.disabled = true;
    typingArea.value = "";
    typingArea.setAttribute("placeholder", LOCK_PLACEHOLDER);
    sectionLockTimer = setTimeout(() => {
      sectionLockTimer = null;
      typingArea.disabled = false;
      typingArea.setAttribute("placeholder", READY_PLACEHOLDER);
      typingArea.focus();
    }, SECTION_LOCK_SECONDS * 1000);
  }
  // Per-movement prompt index. Prompts display in the order they appear in
  // PROMPTS[m]; when the index runs off the end it loops back to 0.
  let promptIndex = { 1: 0, 2: 0, 3: 0 };

  // === White-overlay opacity state ===
  // The overlay sits on top of the noise canvas. Lower opacity reveals more
  // noise. On movement change we snap to the movement's `start`; every Enter
  // steps toward `end`. Step size scales with the movement's opacity range,
  // so movement 3 (range 0.3) advances ~3x faster per Enter than movement 1.
  let currentOverlayOpacity = 1.0;

  function snapOverlayForMovement(m) {
    currentOverlayOpacity = MOVEMENT_OPACITY[m].start;
    Background.setOpacity(currentOverlayOpacity, false);
    Background.paint();
  }

  function stepOverlayOpacity() {
    const cfg = MOVEMENT_OPACITY[currentMovement];
    const step = (cfg.start - cfg.end) / PROMPTS[currentMovement].length;
    currentOverlayOpacity = Math.max(cfg.end, currentOverlayOpacity - step);
    Background.setOpacity(currentOverlayOpacity, true);
  }

  function startPiece() {
    show("playing");
    pieceStart = engine.now();
    currentMovement = 1;
    promptIndex = { 1: 0, 2: 0, 3: 0 };
    showCurrentPrompt();
    typingArea.value = "";
    snapOverlayForMovement(1);
    lockTypingForSection();
    requestAnimationFrame(tick);
  }

  function showCurrentPrompt() {
    const list = PROMPTS[currentMovement];
    promptText.textContent = list[promptIndex[currentMovement] % list.length];
  }

  function advancePrompt() {
    promptIndex[currentMovement] += 1;
    showCurrentPrompt();
  }

  function tick() {
    const elapsed = engine.now() - pieceStart;

    if (elapsed >= boundaries[3]) {
      show("done");
      return;
    }

    // Which movement are we in?
    let movement = 1;
    if (elapsed >= boundaries[2]) movement = 3;
    else if (elapsed >= boundaries[1]) movement = 2;

    if (movement !== currentMovement) {
      currentMovement = movement;
      // Index for the new movement was already initialized in startPiece.
      typingArea.value = "";
      showCurrentPrompt();
      snapOverlayForMovement(currentMovement);
      lockTypingForSection();
    }

    const remaining = boundaries[currentMovement] - elapsed;
    sectionLabel.textContent = `Section ${currentMovement}`;
    sectionTimer.textContent = fmtTime(Math.max(0, remaining));

    requestAnimationFrame(tick);
  }

  // Keystroke handling. Listen on the textarea (so typing into it works
  // naturally) and let Enter advance the prompt instead of inserting a newline.
  typingArea.addEventListener("keydown", (e) => {
    if (stages.playing.classList.contains("hidden")) return;

    // Ignore modifiers, arrows, function keys, etc. Only act on real
    // character keys (length 1) and Enter.
    if (e.key !== "Enter" && e.key.length !== 1) return;

    // Every meaningful keystroke regenerates the noise pattern.
    Background.paint();

    if (e.key === "Enter") {
      e.preventDefault();
      // Random move-on sound.
      const moveonFile = engine.randomFile("moveon");
      engine.play("moveon", moveonFile);
      // Advance to the next prompt in order (loops back when the list ends).
      advancePrompt();
      typingArea.value = "";
      // Nudge overlay opacity toward this movement's `end` target.
      stepOverlayOpacity();
      return;
    }

    const lower = e.key.toLowerCase();
    if (lower < "a" || lower > "z") {
      // Non-letter character: still play something in movements 2/3 from
      // the non-alphabet pools so the player gets feedback. In movement 1,
      // stay silent since only the alphabet is in play.
      if (currentMovement === 1) return;
      const r = Math.random();
      if (currentMovement === 2) {
        // Without an alphabet sound to pick, fall back to inorganic.
        engine.play("inorganic", engine.randomFile("inorganic"));
      } else {
        // Movement 3: pick between inorganic and organic.
        if (r < 0.5) engine.play("inorganic", engine.randomFile("inorganic"));
        else         engine.play("organic", engine.randomFile("organic"));
      }
      return;
    }

    const alphabetFile = lower.toUpperCase() + ".wav";

    if (currentMovement === 1) {
      engine.play("alphabet", alphabetFile);
    } else if (currentMovement === 2) {
      // 50% alphabet, 50% inorganic.
      if (Math.random() < 0.5) engine.play("alphabet", alphabetFile);
      else                     engine.play("inorganic", engine.randomFile("inorganic"));
    } else {
      // 33% alphabet, 33% inorganic, 34% organic.
      const r = Math.random();
      if (r < 0.33)      engine.play("alphabet", alphabetFile);
      else if (r < 0.66) engine.play("inorganic", engine.randomFile("inorganic"));
      else               engine.play("organic", engine.randomFile("organic"));
    }
  });
})();
