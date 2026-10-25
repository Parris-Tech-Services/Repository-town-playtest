/*
 * SIM-DBO1 Defender Trainer — client-side blue-team awareness game.
 *
 * The player is the DEFENDER. Each round presents a situation at reception,
 * the mantrap, or the SOC console, and asks for the correct defensive move
 * (recognise / refuse / verify / report / triage). Scoring rewards good
 * decisions and fast, correct SOC response. No attack techniques, no
 * operational data — everything is fictional (facility "SIM-DBO1").
 *
 * Self-contained: no network calls, no storage of real data.
 */
(function () {
  "use strict";

  // ---- Fictional world data (all invented) -------------------------------
  var FACILITY = "SIM-DBO1";
  var SOC_LINE = "SIM-SOC x100 (fictional)";

  // Each scenario: prompt, options, the index of the best option, and why.
  // "tag" groups the learning point. Nothing here describes how to attack.
  var SCENARIOS = [
    {
      zone: "Reception",
      tag: "Authority + urgency",
      prompt:
        "A person in a branded polo arrives with no appointment on today's sheet. " +
        "\"Head office sent me for an emergency cooling fault — the hall could overheat. " +
        "I need in right now.\" They sound stressed and senior.",
      options: [
        "Let them straight through — a cooling fault is an emergency.",
        "Call the number on their business card to confirm, then admit them.",
        "Keep them at reception and verify out-of-band via the SOC line before anything else.",
        "Ask a junior tech to escort them in while you keep working."
      ],
      best: 2,
      why:
        "Manufactured urgency + borrowed authority is the classic pressure. Real emergencies " +
        "have a real incident process. Verify out-of-band via the SOC (" + SOC_LINE + ") — never " +
        "a number the visitor supplies. Slowing down is always a correct answer."
    },
    {
      zone: "Mantrap",
      tag: "Tailgating",
      prompt:
        "You badge into a secure area carrying boxes. Someone you half-recognise is right " +
        "behind you, hands full, and says \"cheers\" expecting you to hold the door.",
      options: [
        "Hold it — it would be rude not to, and you recognise them.",
        "Let the door close; ask them to badge in themselves, politely.",
        "Hold it but tell them to badge in once inside.",
        "Say nothing and walk on, leaving it to chance."
      ],
      best: 1,
      why:
        "One badge, one person. Recognising someone is not authorisation. Letting the door close " +
        "and asking them to badge in is the courteous-and-correct move; the mantrap should also flag " +
        "any two-person pass-through to the SOC."
    },
    {
      zone: "Phone",
      tag: "Familiarity + reciprocity",
      prompt:
        "A friendly caller knows the current project name and a manager's first name. After some " +
        "chat they ask for the guest Wi-Fi password and the name of the access-control vendor " +
        "\"just to save time on a ticket\".",
      options: [
        "Share both — they clearly know internal details.",
        "Share only the Wi-Fi password; the vendor name is harmless.",
        "Decline, verify the caller out-of-band via the SOC, and report the request.",
        "Transfer them to a manager without checking."
      ],
      best: 2,
      why:
        "Knowing internal details is not proof of authorisation — it is the familiarity pressure. " +
        "Information is access too. Verify out-of-band and report the attempt, even if it seemed harmless."
    },
    {
      zone: "Comms room",
      tag: "Unknown device",
      prompt:
        "A 'contractor' asks you to plug a small diagnostic box into a spare network port " +
        "\"for ten minutes\", or to accept a USB stick with \"the config files\".",
      options: [
        "Plug the box in — ten minutes is harmless.",
        "Accept the USB and open it on your workstation.",
        "Refuse both, do not connect anything, and report it; treat any unknown connected device as an incident.",
        "Plug it into a 'test' port only."
      ],
      best: 2,
      why:
        "Never connect anyone's hardware or media. An unknown device on the network is an incident, " +
        "not a favour. NAC should quarantine an unrecognised device, and the SOC should see the new-device alert."
    },
    {
      zone: "SOC console",
      tag: "Alert triage",
      prompt:
        "The feed shows a credential read at a side door at 02:00, and the SAME credential at the " +
        "main entrance eight minutes earlier — a walk that isn't physically possible in the time.",
      options: [
        "Ignore it — badge systems glitch sometimes.",
        "Wait to see if it happens again before acting.",
        "Treat it as impossible-travel: suspend the credential, confirm with the holder out-of-band, review its door history.",
        "Disable the whole door controller immediately."
      ],
      best: 2,
      why:
        "Impossible-travel for a badge is a strong misuse/cloning signal. Suspend the credential, " +
        "confirm with the named holder out-of-band, and review every door it touched. Fast, targeted response = low MTTR."
    },
    {
      zone: "SOC console",
      tag: "OT visibility",
      prompt:
        "An environmental-control host on the fictional 10.99.80.0/24 OT segment suddenly starts " +
        "making broad outbound connection attempts across other subnets.",
      options: [
        "Normal — OT devices talk to everything.",
        "Isolate the host, alert, and investigate: OT gear rarely initiates broad connections.",
        "Reboot the host and move on.",
        "Open a ticket for next week."
      ],
      best: 1,
      why:
        "OT devices almost never initiate broad connections — any sweep from one is suspicious. " +
        "Isolate and investigate. If your environment had no east-west OT visibility, you'd never see this, which is itself a finding."
    },
    {
      zone: "Security desk",
      tag: "Verify, don't assume",
      prompt:
        "During a known test window, you find someone in a restricted area. They produce a printed " +
        "\"authorisation letter\" and say they're an authorised tester.",
      options: [
        "The letter is enough — let them continue.",
        "Use force to detain them immediately.",
        "Detain peacefully, do not use force, and verify via the SOC using the daily PIN and roster.",
        "Escort them out of the building and forget it."
      ],
      best: 2,
      why:
        "A document is not verification. Detain peacefully (never force), and confirm out-of-band via " +
        "the SOC with the daily rotating PIN and the operator roster. This is exactly the real verification flow."
    },
    {
      zone: "Reception",
      tag: "Pre-registration",
      prompt:
        "A delivery driver wants to drop equipment directly into the data hall \"like last time\", " +
        "and isn't on today's expected-visitor list.",
      options: [
        "Wave them through to the hall; deliveries are routine.",
        "Take the delivery at the loading area only, verify the drop against the register, and keep them out of the hall.",
        "Let them into the hall if they leave ID at the desk.",
        "Ask another staff member to escort them into the hall."
      ],
      best: 1,
      why:
        "Deliveries belong at the separated loading/staging area, never the data hall, and unexpected " +
        "'scheduled' arrivals are a red flag. Verify against the register; pre-registration is the rule."
    }
  ];

  // ---- Game state --------------------------------------------------------
  var state = {
    idx: 0,
    order: [],
    score: 0,
    correct: 0,
    trust: 100,      // falls on weak choices (the staff-trust / exposure meter)
    answered: false
  };

  function shuffle(n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(i);
    for (var j = a.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var t = a[j]; a[j] = a[k]; a[k] = t;
    }
    return a;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  var root;

  function start() {
    state.idx = 0;
    state.score = 0;
    state.correct = 0;
    state.trust = 100;
    state.answered = false;
    state.order = shuffle(SCENARIOS.length);
    render();
  }

  function hud() {
    var bar = el("div", "dbo1sim-hud");
    bar.appendChild(el("span", "dbo1sim-hud-item", "FACILITY: " + FACILITY));
    bar.appendChild(el("span", "dbo1sim-hud-item",
      "ROUND: " + (state.idx + 1) + "/" + state.order.length));
    bar.appendChild(el("span", "dbo1sim-hud-item", "SCORE: " + state.score));
    var trust = el("span", "dbo1sim-hud-item", "INTEGRITY: " + state.trust + "%");
    if (state.trust < 60) trust.classList.add("dbo1sim-warn");
    bar.appendChild(trust);
    return bar;
  }

  function render() {
    root.innerHTML = "";
    root.appendChild(hud());

    if (state.idx >= state.order.length) {
      renderEnd();
      return;
    }

    var s = SCENARIOS[state.order[state.idx]];

    var card = el("div", "dbo1sim-card");
    var head = el("div", "dbo1sim-cardhead");
    head.appendChild(el("span", "dbo1sim-zone", s.zone));
    head.appendChild(el("span", "dbo1sim-tag", s.tag));
    card.appendChild(head);

    card.appendChild(el("p", "dbo1sim-prompt", s.prompt));

    var opts = el("div", "dbo1sim-options");
    s.options.forEach(function (text, i) {
      var b = el("button", "dbo1sim-opt", text);
      b.addEventListener("click", function () { choose(s, i); });
      opts.appendChild(b);
    });
    card.appendChild(opts);

    var halt = el("button", "dbo1sim-index", "CALL “INDEX” (stop the exercise)");
    halt.title = "Safety and uptime override everything. Any staff member can halt.";
    halt.addEventListener("click", function () {
      state.idx = state.order.length;
      render();
    });
    card.appendChild(halt);

    root.appendChild(card);
  }

  function choose(s, i) {
    if (state.answered) return;
    state.answered = true;

    var correct = (i === s.best);
    if (correct) {
      state.score += 10;
      state.correct += 1;
    } else {
      state.trust = Math.max(0, state.trust - 15);
    }

    // Reveal feedback.
    var fb = el("div", "dbo1sim-feedback " + (correct ? "ok" : "bad"));
    fb.appendChild(el("strong", null, correct ? "✓ Good call." : "✗ Risky choice."));
    fb.appendChild(el("p", "dbo1sim-why", s.why));
    if (!correct) {
      fb.appendChild(el("p", "dbo1sim-best",
        "Best move: " + s.options[s.best]));
    }
    var next = el("button", "dbo1sim-next",
      state.idx + 1 >= state.order.length ? "See results" : "Next situation →");
    next.addEventListener("click", function () {
      state.idx += 1;
      state.answered = false;
      render();
    });
    fb.appendChild(next);

    // Disable option buttons.
    var buttons = root.querySelectorAll(".dbo1sim-opt");
    for (var b = 0; b < buttons.length; b++) {
      buttons[b].disabled = true;
      if (b === s.best) buttons[b].classList.add("dbo1sim-correct");
    }
    root.querySelector(".dbo1sim-card").appendChild(fb);
  }

  function renderEnd() {
    var card = el("div", "dbo1sim-card");
    card.appendChild(el("h2", "dbo1sim-title", "Shift debrief"));

    var pct = Math.round((state.correct / state.order.length) * 100);
    card.appendChild(el("p", "dbo1sim-prompt",
      "You handled " + state.correct + " of " + state.order.length +
      " situations correctly (" + pct + "%). Final score " + state.score +
      ", facility integrity " + state.trust + "%."));

    var verdict;
    if (pct >= 85 && state.trust >= 70) {
      verdict = "Strong defender. You verified out-of-band, refused politely, and reported. This is exactly what keeps " + FACILITY + " safe.";
    } else if (pct >= 60) {
      verdict = "Solid, with gaps. Re-read the ones you missed — the habit to build is: slow down, verify via the SOC, refuse until verified, report even when you refused.";
    } else {
      verdict = "Worth another run. The golden rule covers almost every situation here: recognise the pressure, refuse, verify out-of-band, and report.";
    }
    card.appendChild(el("p", "dbo1sim-why", verdict));

    card.appendChild(el("p", "dbo1sim-best",
      "Remember: a document, a uniform, or inside knowledge is never verification. The SOC line and the roster are."));

    var again = el("button", "dbo1sim-next", "Play again");
    again.addEventListener("click", start);
    card.appendChild(again);

    root.appendChild(card);
  }

  // ---- Boot --------------------------------------------------------------
  function boot() {
    root = document.getElementById("dbo1sim-root");
    if (!root) return;
    var intro = el("div", "dbo1sim-card");
    intro.appendChild(el("h2", "dbo1sim-title", "SIM-" + "DBO1 Defender Trainer"));
    intro.appendChild(el("p", "dbo1sim-prompt",
      "You are on the blue team at " + FACILITY + " (a fictional training replica). " +
      "Each situation asks for the correct defensive move. You are scored on good decisions " +
      "and on catching the signals a real attacker would create. Nothing here is real data."));
    var go = el("button", "dbo1sim-next", "Start shift");
    go.addEventListener("click", start);
    intro.appendChild(go);
    root.appendChild(intro);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
