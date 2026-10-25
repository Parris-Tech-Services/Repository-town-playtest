(() => {
  const episodes = [
    { id: '0MjRBwyjqhzoBdx7pbt1k6', title: 'Sirrangia and Worldbuilding Through Campaign Building!', show: 'Mastering Dungeons', tags: ['worldbuilding', 'campaigns', 'DM'] },
    { id: '18w3nIQBRAFkjpI4rPhu5F', title: 'From Opera to Encounters: Turning Big Ideas into Playable Reality', show: 'How to Be a Better DM', tags: ['encounters', 'creativity', 'DM'] },
    { id: '6yK94qksHewsvS3H74JyEl', title: 'Roll for Chaos: A Live, Unscripted D&D Adventure', show: 'How to Be a Better DM', tags: ['improv', 'actual play', 'DM'] },
    { id: '5DpwMgWYSXxSppqEoDfpIf', title: 'GMing 101: Top DM Tips from Dragon Steel Nexus', show: 'How to Be a Better DM', tags: ['GM tips', 'communication', 'sessions'] },
    { id: '6ze6frz80e3FmivlkcfgIp', title: 'How to Start an Actual Play D&D Podcast', show: 'How to Be a Better DM', tags: ['actual play', 'creative projects'] },
    { id: '3LmSl6bDrX4BhVracbNM1o', title: 'Diving Deep into Theme, Fate, and Storytelling', show: 'How to Be a Better DM', tags: ['storytelling', 'themes', 'DM'] },
    { id: '5c3tjkoD1tAIdaYw73kIgL', title: 'Which D&D Books to Buy', show: 'How to Be a Better DM', tags: ['books', 'new DM'] },
    { id: '2FN85jBLA8vOMXlz1tA96m', title: 'Magic Item Shops: Guardians, Pricing, and Players Who Want to Rob You', show: 'How to Be a Better DM', tags: ['worldbuilding', 'magic items', 'DM'] },
    { id: '61U0V14kAWSg62ixlFkoj9', title: 'DM Coaching: DMing for Kids and Tying Up Loose Ends', show: 'How to Be a Better DM', tags: ['kids', 'campaigns', 'DM coaching'] },
    { id: '0LAJdQd1qQhKNuvb7SzMqf', title: 'The Hidden Costs of Using AI in Your D&D Prep', show: 'How to Be a Better DM', tags: ['AI', 'prep', 'DM'] },
    { id: '3IZdlFlmiyBoilKbPkzcRo', title: '4 Combat Expectations That Work for High- and Low-level Combat', show: 'How to Be a Better DM', tags: ['combat', 'encounters', 'DM'] },
    { id: '1YMqW5716hL6z19VB0CRxE', title: 'Watch Out! Part 1 — First-Time DMing', show: 'Oxventure: A Dungeons & Dragons Podcast', tags: ['DMing', 'actual play', 'confidence'] },
    { id: '5l4Sau4cO4mwXTRgvBIOtR', title: 'Recent Game Design Lessons', show: 'Mastering Dungeons', tags: ['game design', 'RPG design'] },
    { id: '11GOinCQp6FJG8h0uvBUSB', title: 'How Good is D&D’s New Website?', show: 'Mastering Dungeons', tags: ['D&D', 'community', 'new players'] },
    { id: '7cHG8x46pz4xZQ7pxtwyA7', title: 'Rise of the Lazy Gamemaster with Mike Shea', show: 'Mastering Dungeons', tags: ['prep', 'GM advice', 'Sly Flourish'] },
    { id: '1kSaSV0iRa3vHo9bVg5Mzh', title: 'Best of Waterdeep: Dungeon of the Mad Mage!', show: 'Mastering Dungeons', tags: ['adventures', 'Waterdeep', 'dungeons'] },
    { id: '75gmCIKdnANQ3Ts63Z2BuU', title: 'Draw Steel at Level 1!', show: 'Mastering Dungeons', tags: ['RPG design', 'character play'] },
    { id: '0Hkf9aaToj0uXNL4d2uFyS', title: 'Best of Baldur’s Gate: Descent Into Avernus!', show: 'Mastering Dungeons', tags: ['adventures', "Baldur's Gate"] },
    { id: '1cZMSTNmc97JHiJB3727OS', title: 'Mystic Arts and Creator Publishing', show: 'Mastering Dungeons', tags: ['RPG design', 'publishing', 'creators'] },
    { id: '4OvgnK7wzDYVukjAWaEMS7', title: 'Draw Steel Character Classes, Careers, and Cultures!', show: 'Mastering Dungeons', tags: ['classes', 'worldbuilding', 'RPG design'] },
    { id: '49VCsy5V4ZWlqeYuwY4pSn', title: 'Daggerheart Domains and Actions', show: 'Mastering Dungeons', tags: ['Daggerheart', 'RPG design'] },
    { id: '2O8rUB7kk7fUBmdo9YHDv0', title: 'D&D on Death Row with Keri Blakinger', show: 'Dungeon Master of None', tags: ['D&D culture', 'community'] },
    { id: '4LUQdRE7HDGKf6zA2DeIKE', title: 'Dungeon Masters — Innsmouth Interlude, Episode 2', show: 'Dungeon Masters — Official D&D Actual Play', tags: ['actual play', 'Ravenloft'] },
    { id: '5mHsg0iCDW0ee692kiEwTk', title: 'Dungeon Masters — Innsmouth Interlude, Episode 3', show: 'Dungeon Masters — Official D&D Actual Play', tags: ['actual play', 'Ravenloft'] },
    { id: '76hNTfELLZa7n3sd5vbuzU', title: 'Dungeon Masters — Campaign 2, Episode 3', show: 'Dungeon Masters — Official D&D Actual Play', tags: ['actual play', 'Anauroch'] }
  ];

  const STORAGE_KEY = 'midnight-line-podcast-player-v1';

  class MidnightPodcastPlayer extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.open = false;
      this.currentIndex = 0;
      this.recent = [];
      this.frameLoaded = false;

      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (Number.isInteger(saved.currentIndex) && saved.currentIndex >= 0 && saved.currentIndex < episodes.length) {
          this.currentIndex = saved.currentIndex;
        }
        if (Array.isArray(saved.recent)) {
          this.recent = saved.recent.filter((n) => Number.isInteger(n) && n >= 0 && n < episodes.length).slice(0, 6);
        }
      } catch (_) {}
    }

    connectedCallback() {
      this.renderShell();
      this.updateEpisode(false);
      this.setOpen(false);
    }

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentIndex: this.currentIndex, recent: this.recent.slice(0, 6) }));
      } catch (_) {}
    }

    chooseDifferent() {
      const excluded = new Set([this.currentIndex, ...this.recent]);
      let candidates = episodes.map((_, index) => index).filter((index) => !excluded.has(index));
      if (!candidates.length) candidates = episodes.map((_, index) => index).filter((index) => index !== this.currentIndex);
      if (!candidates.length) candidates = [0];
      const previous = this.currentIndex;
      this.currentIndex = candidates[Math.floor(Math.random() * candidates.length)];
      if (previous !== this.currentIndex) {
        this.recent = [previous, ...this.recent.filter((index) => index !== previous)].slice(0, 6);
      }
      this.save();
      this.updateEpisode(true);
    }

    renderShell() {
      this.shadowRoot.innerHTML = `
        <style>
          :host{position:relative;z-index:2147483000;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
          button,a{font:inherit}
          .launcher{position:fixed;left:50%;bottom:max(12px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483000;border:1px solid rgba(148,163,184,.45);border-radius:999px;background:rgba(15,23,42,.97);color:#fff;padding:12px 18px;font-weight:800;box-shadow:0 12px 34px rgba(2,6,23,.45);cursor:pointer;touch-action:manipulation;white-space:nowrap}
          .launcher[hidden]{display:none!important}
          .panel{position:fixed;left:50%;bottom:max(8px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483000;width:min(620px,calc(100vw - 16px));box-sizing:border-box;border:1px solid rgba(148,163,184,.45);border-radius:18px;background:rgba(15,23,42,.98);color:#fff;padding:14px;box-shadow:0 20px 60px rgba(2,6,23,.65);transition:opacity .16s ease,transform .16s ease,visibility .16s ease}
          .panel.collapsed{opacity:0;visibility:hidden;pointer-events:none;transform:translateX(-50%) translateY(12px)}
          .head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}
          .kicker{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#93c5fd}
          .title{font-size:16px;line-height:1.3;margin:4px 0 0}
          .meta{font-size:12px;line-height:1.45;color:#cbd5e1;margin:5px 0 0}
          .close{width:40px;height:40px;flex:0 0 40px;border:1px solid #475569;border-radius:50%;background:#1e293b;color:#fff;font-size:22px;cursor:pointer;touch-action:manipulation}
          .frame{display:block;width:100%;height:152px;border:0;border-radius:12px;background:#0b1220}
          .actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
          .action,.link{border-radius:10px;padding:9px 12px;font-weight:750;text-decoration:none;cursor:pointer;touch-action:manipulation}
          .action{border:0;background:#2563eb;color:#fff}
          .link{display:inline-flex;align-items:center;border:1px solid #475569;background:#1e293b;color:#fff}
          .note{font-size:11px;color:#94a3b8;margin:9px 0 0}
          @media(max-width:640px){.panel{width:calc(100vw - 10px);padding:11px}.actions>*{flex:1;justify-content:center;text-align:center}}
        </style>
        <button class="launcher" type="button" aria-label="Open narrative game podcasts">🎧 Podcasts</button>
        <aside class="panel collapsed" aria-label="Midnight Line podcast player" aria-hidden="true">
          <div class="head"><div><div class="kicker">Midnight Line · narrative game radio</div><h2 class="title"></h2><p class="meta"></p></div><button class="close" type="button" aria-label="Minimise podcast player">×</button></div>
          <iframe class="frame" title="Spotify podcast episode" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
          <div class="actions"><button class="action different" type="button">🎲 Different podcast</button><a class="link" target="_blank" rel="noopener noreferrer">Open in Spotify ↗</a></div>
          <p class="note">Close only minimises the player — audio keeps playing while you continue the game.</p>
        </aside>
      `;

      this.shadowRoot.querySelector('.launcher').addEventListener('click', () => this.setOpen(true));
      this.shadowRoot.querySelector('.close').addEventListener('click', () => this.setOpen(false));
      this.shadowRoot.querySelector('.different').addEventListener('click', () => this.chooseDifferent());
    }

    setOpen(value) {
      this.open = !!value;
      const panel = this.shadowRoot.querySelector('.panel');
      const launcher = this.shadowRoot.querySelector('.launcher');
      if (!panel || !launcher) return;

      if (this.open && !this.frameLoaded) {
        this.updateEpisode(true);
      }

      panel.classList.toggle('collapsed', !this.open);
      panel.setAttribute('aria-hidden', String(!this.open));
      launcher.hidden = this.open;
    }

    updateEpisode(loadFrame) {
      const current = episodes[this.currentIndex];
      const title = this.shadowRoot.querySelector('.title');
      const meta = this.shadowRoot.querySelector('.meta');
      const frame = this.shadowRoot.querySelector('.frame');
      const link = this.shadowRoot.querySelector('.link');
      if (!title || !meta || !frame || !link) return;

      title.textContent = current.title;
      meta.textContent = `${current.show} · ${current.tags.join(' · ')}`;
      link.href = `https://open.spotify.com/episode/${encodeURIComponent(current.id)}`;

      if (loadFrame || this.frameLoaded) {
        const nextSrc = `https://open.spotify.com/embed/episode/${encodeURIComponent(current.id)}?theme=0`;
        if (frame.src !== nextSrc) frame.src = nextSrc;
        frame.title = `Spotify episode: ${current.title}`;
        this.frameLoaded = true;
      }
    }
  }

  if (!customElements.get('midnight-podcast-player')) {
    customElements.define('midnight-podcast-player', MidnightPodcastPlayer);
  }

  const mount = () => {
    if (!document.querySelector('midnight-podcast-player')) {
      document.body.appendChild(document.createElement('midnight-podcast-player'));
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
