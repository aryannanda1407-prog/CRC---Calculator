/* ==========================================================
   CRC Calculator - JavaScript
   Ported from the original C++ project.
   ========================================================== */

// ===== CORE CRC LOGIC (no HTML needed; easy to read and test) =====

// Returns true if the text is not empty and contains only 0 and 1
function isBinary(text) {
  return /^[01]+$/.test(text);
}

// XOR two equal-length binary strings, bit by bit: same -> '0', different -> '1'
function xorBits(a, b) {
  let result = "";
  for (let i = 0; i < a.length; i++) {
    result += (a[i] === b[i]) ? "0" : "1";
  }
  return result;
}

// Modulo-2 division. Returns the remainder and a list of the steps taken.
// Same algorithm as calculateRemainder() in the C++ code.
function calculateRemainder(data, generator) {
  const genLen = generator.length;
  const zeros = "0".repeat(genLen);
  const steps = [];

  let remainder = data.slice(0, genLen);

  for (let i = genLen; i <= data.length; i++) {
    const current = remainder;
    // Leading bit 1 -> XOR with generator, otherwise XOR with zeros (no change)
    const divisor = (remainder[0] === "1") ? generator : zeros;
    remainder = xorBits(remainder, divisor);
    steps.push({ current: current, divisor: divisor, result: remainder });

    // Remove the leftmost bit
    remainder = remainder.slice(1);

    // Bring down the next bit (if any are left)
    if (i < data.length) {
      remainder += data[i];
    }
  }

  return { remainder: remainder, steps: steps };
}

// Checks the generator. Returns an error message, or "" if it is valid.
function checkGenerator(generator) {
  if (generator === "") return "Please enter the generator polynomial.";
  if (!isBinary(generator)) return "Generator must contain only 0 and 1.";
  if (generator.length < 2) return "Generator must contain at least 2 bits.";
  if (generator[0] !== "1") return "Generator must start with 1.";
  return "";
}

// Generate CRC. Returns { error } or the full result.
function generateCRC(data, generator) {
  if (data === "") return { error: "Please enter the original data." };
  if (!isBinary(data)) return { error: "Data must contain only 0 and 1." };
  const genError = checkGenerator(generator);
  if (genError) return { error: genError };

  const zerosAdded = generator.length - 1;
  const padded = data + "0".repeat(zerosAdded);
  const division = calculateRemainder(padded, generator);

  return {
    data: data,
    generator: generator,
    zerosAdded: zerosAdded,
    padded: padded,
    crc: division.remainder,
    transmitted: data + division.remainder,
    steps: division.steps
  };
}

// Verify received data. Returns { error } or the full result.
function verifyCRC(received, generator) {
  if (received === "") return { error: "Please enter the received data." };
  if (!isBinary(received)) return { error: "Received data must contain only 0 and 1." };
  const genError = checkGenerator(generator);
  if (genError) return { error: genError };
  if (received.length < generator.length) {
    return { error: "Received data must be at least as long as the generator (it contains the data plus the CRC bits)." };
  }

  const division = calculateRemainder(received, generator);
  return {
    received: received,
    generator: generator,
    remainder: division.remainder,
    hasError: division.remainder.includes("1"),
    steps: division.steps
  };
}

// ===== END CORE =====


// ===== PAGE CODE (buttons, tabs, display) =====

if (typeof document !== "undefined") {

  const $ = (id) => document.getElementById(id);

  // Examples: 100100 with 1101 gives CRC 001 -> 100100001
  const EXAMPLE_DATA = "100100";
  const EXAMPLE_POLY = "1101";
  const EXAMPLE_GOOD = "100100001";
  const EXAMPLE_BAD  = "100110001"; // one bit flipped

  let lastGenerate = null;
  let lastVerify = null;

  // Remove spaces and line breaks the user may have typed
  function clean(id) {
    return $(id).value.replace(/\s+/g, "");
  }

  // ---------- Tabs ----------
  function showTab(name) {
    document.querySelectorAll(".tab").forEach((tab) => {
      const active = tab.dataset.tab === name;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll(".panel").forEach((panel) => {
      const active = panel.id === "tab-" + name;
      panel.classList.toggle("active", active);
      panel.hidden = !active;
    });
  }

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => showTab(tab.dataset.tab));
  });

  // ---------- Helpers ----------
  function showError(boxId, message, inputIds) {
    const box = $(boxId);
    box.textContent = message;
    box.hidden = false;
    inputIds.forEach((id) => $(id).classList.remove("invalid"));
  }

  function clearError(boxId, inputIds) {
    $(boxId).hidden = true;
    inputIds.forEach((id) => $(id).classList.remove("invalid"));
  }

  // Marks the field that probably caused the error
  function markInvalid(message, dataId, polyId) {
    const lower = message.toLowerCase();
    if (lower.includes("generator")) $(polyId).classList.add("invalid");
    else $(dataId).classList.add("invalid");
  }

  // Turn the division steps into readable text
  function stepsToText(steps) {
    return steps.map((s, i) => {
      return "Step " + (i + 1) + "\n" +
             "  bits   : " + s.current + "\n" +
             "  XOR    : " + s.divisor + (/^0+$/.test(s.divisor) ? "  (zeros)" : "  (generator)") + "\n" +
             "  result : " + s.result;
    }).join("\n\n");
  }

  // Copy text. Uses the modern API and falls back to an older method.
  function copyText(text, messageBoxId) {
    const done = () => {
      const box = $(messageBoxId);
      box.textContent = "Copied to clipboard.";
      box.hidden = false;
      setTimeout(() => { box.hidden = true; }, 2000);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try { document.execCommand("copy"); done(); } catch (e) { alert("Copy failed. Please copy manually."); }
    document.body.removeChild(area);
  }

  // ---------- Generate CRC ----------
  const GEN_INPUTS = ["gen-data", "gen-poly"];

  function onGenerate() {
    clearError("gen-error", GEN_INPUTS);
    const result = generateCRC(clean("gen-data"), clean("gen-poly"));

    if (result.error) {
      $("gen-results").hidden = true;
      showError("gen-error", result.error, GEN_INPUTS);
      markInvalid(result.error, "gen-data", "gen-poly");
      return;
    }

    lastGenerate = result;
    $("r-data").textContent = result.data;
    $("r-poly").textContent = result.generator;

    // Show appended zeros in a different colour
    $("r-padded").innerHTML = "";
    $("r-padded").append(result.data);
    const zeroSpan = document.createElement("span");
    zeroSpan.className = "added";
    zeroSpan.textContent = result.padded.slice(result.data.length);
    $("r-padded").append(zeroSpan);
    $("r-padded-note").textContent =
      result.zerosAdded + " zero(s) appended (generator length " + result.generator.length + " - 1).";

    $("r-crc").textContent = result.crc;

    // Final data: original + CRC (CRC highlighted)
    $("r-final").innerHTML = "";
    $("r-final").append(result.data);
    const crcSpan = document.createElement("span");
    crcSpan.className = "crc-part";
    crcSpan.textContent = result.crc;
    $("r-final").append(crcSpan);

    $("gen-steps").textContent = stepsToText(result.steps);
    $("gen-copy-msg").hidden = true;
    $("gen-results").hidden = false;
    $("gen-results").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  $("gen-btn").addEventListener("click", onGenerate);

  $("gen-example").addEventListener("click", () => {
    $("gen-data").value = EXAMPLE_DATA;
    $("gen-poly").value = EXAMPLE_POLY;
    onGenerate();
  });

  $("gen-reset").addEventListener("click", () => {
    $("gen-data").value = "";
    $("gen-poly").value = "";
    clearError("gen-error", GEN_INPUTS);
    $("gen-results").hidden = true;
    lastGenerate = null;
    $("gen-data").focus();
  });

  $("copy-final").addEventListener("click", () => {
    if (lastGenerate) copyText(lastGenerate.transmitted, "gen-copy-msg");
  });

  $("copy-gen-all").addEventListener("click", () => {
    if (!lastGenerate) return;
    const r = lastGenerate;
    const text =
      "CRC Generation Result\n" +
      "Original Data    : " + r.data + "\n" +
      "Generator        : " + r.generator + "\n" +
      "Data + Zeros     : " + r.padded + "\n" +
      "CRC Remainder    : " + r.crc + "\n" +
      "Transmitted Data : " + r.transmitted;
    copyText(text, "gen-copy-msg");
  });

  // ---------- Verify ----------
  const VER_INPUTS = ["ver-data", "ver-poly"];

  function onVerify() {
    clearError("ver-error", VER_INPUTS);
    const result = verifyCRC(clean("ver-data"), clean("ver-poly"));

    if (result.error) {
      $("ver-results").hidden = true;
      showError("ver-error", result.error, VER_INPUTS);
      markInvalid(result.error, "ver-data", "ver-poly");
      return;
    }

    lastVerify = result;
    $("v-data").textContent = result.received;
    $("v-poly").textContent = result.generator;
    $("v-rem").textContent = result.remainder;
    $("ver-steps").textContent = stepsToText(result.steps);

    const box = $("ver-status");
    if (result.hasError) {
      box.className = "status bad";
      $("ver-status-icon").textContent = "\u2715";
      $("ver-status-text").textContent = "ERROR DETECTED";
      $("ver-status-explain").textContent =
        "The remainder contains at least one 1, so the received data does not match what the sender transmitted. Some bits were changed during transmission and the data should be sent again.";
    } else {
      box.className = "status ok";
      $("ver-status-icon").textContent = "\u2713";
      $("ver-status-text").textContent = "NO ERROR DETECTED";
      $("ver-status-explain").textContent =
        "The remainder is all zeros, so the received data is exactly divisible by the generator. The data is accepted as correct. (CRC detects almost all errors, but no checksum can prove the data is perfect.)";
    }

    $("ver-copy-msg").hidden = true;
    $("ver-results").hidden = false;
    $("ver-results").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  $("ver-btn").addEventListener("click", onVerify);

  $("ver-example-ok").addEventListener("click", () => {
    $("ver-data").value = EXAMPLE_GOOD;
    $("ver-poly").value = EXAMPLE_POLY;
    onVerify();
  });

  $("ver-example-bad").addEventListener("click", () => {
    $("ver-data").value = EXAMPLE_BAD;
    $("ver-poly").value = EXAMPLE_POLY;
    onVerify();
  });

  $("ver-reset").addEventListener("click", () => {
    $("ver-data").value = "";
    $("ver-poly").value = "";
    clearError("ver-error", VER_INPUTS);
    $("ver-results").hidden = true;
    lastVerify = null;
    $("ver-data").focus();
  });

  $("copy-ver").addEventListener("click", () => {
    if (!lastVerify) return;
    const r = lastVerify;
    const text =
      "CRC Verification Result\n" +
      "Received Data : " + r.received + "\n" +
      "Generator     : " + r.generator + "\n" +
      "Remainder     : " + r.remainder + "\n" +
      "Result        : " + (r.hasError ? "ERROR DETECTED" : "NO ERROR DETECTED");
    copyText(text, "ver-copy-msg");
  });

  // ---------- How it works: jump to example ----------
  $("how-try").addEventListener("click", () => {
    showTab("generate");
    $("gen-example").click();
  });

  // Press Enter inside an input to run the action
  [["gen-data", onGenerate], ["gen-poly", onGenerate], ["ver-data", onVerify], ["ver-poly", onVerify]]
    .forEach(([id, fn]) => {
      $(id).addEventListener("keydown", (e) => { if (e.key === "Enter") fn(); });
    });
}
