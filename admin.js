// Admin page: loads the three fixed-media files, then plays them gaplessly
// with a 5-second cue countdown. A diagnostic panel shows the current file,
// time within the file, and overall piece time.

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
  const diagFile = document.getElementById("diag-file");
  const diagFileTime = document.getElementById("diag-file-time");
  const diagTotalTime = document.getElementById("diag-total-time");

  loadBtn.addEventListener("click", async () => {
    show("progress");
    try {
      await engine.load(["fixed"], ({ loaded, total }) => {
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

  function startPiece() {
    show("playing");

    // Schedule all three buffers back-to-back using AudioContext time
    // for sample-accurate gapless playback.
    const startAt = engine.now() + 0.1;
    const files = MEDIA.fixed.files;
    const sourceStarts = []; // AudioContext time at which each file begins
    let t = startAt;
    for (let i = 0; i < files.length; i++) {
      sourceStarts.push(t);
      engine.play("fixed", files[i], t);
      t += engine.buffer("fixed", files[i]).duration;
    }
    const endAt = t;

    // Track which fixed-media file is current so we can snap the white
    // overlay opacity at each movement boundary.
    let lastIdx = -1;

    // Update the diagnostic panel at ~30fps.
    function tick() {
      const now = engine.now();
      if (now >= endAt) {
        diagFile.textContent = "—";
        diagFileTime.textContent = `${fmtTime(0)} / ${fmtTime(0)}`;
        diagTotalTime.textContent = `${fmtTime(TOTAL_DURATION)} / ${fmtTime(TOTAL_DURATION)}`;
        show("done");
        return;
      }

      let idx = 0;
      while (idx < sourceStarts.length - 1 && now >= sourceStarts[idx + 1]) idx += 1;

      if (now < startAt) {
        diagFile.textContent = "(starting…)";
        diagFileTime.textContent = `${fmtTime(0)} / ${fmtTime(SECTION_DURATIONS[0])}`;
        diagTotalTime.textContent = `${fmtTime(0)} / ${fmtTime(TOTAL_DURATION)}`;
      } else {
        const fileTime = now - sourceStarts[idx];
        const fileDur = engine.buffer("fixed", files[idx]).duration;
        const totalTime = now - startAt;
        diagFile.textContent = `${files[idx]}  (${idx + 1} / ${files.length})`;
        diagFileTime.textContent = `${fmtTime(fileTime)} / ${fmtTime(fileDur)}`;
        diagTotalTime.textContent = `${fmtTime(totalTime)} / ${fmtTime(TOTAL_DURATION)}`;

        // Snap overlay opacity at movement boundaries.
        if (idx !== lastIdx) {
          lastIdx = idx;
          Background.setOpacity(MOVEMENT_OPACITY[idx + 1].start, false);
          Background.paint();
        }
      }

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
})();
