(() => {
  const STORAGE_KEY = 'midnight-line-podcast-controls-v1';

  const readHidden = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return saved.hidden === true;
    } catch (_) {
      return false;
    }
  };

  let hidden = readHidden();
  let settingsOpen = false;

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ hidden }));
    } catch (_) {}
  };

  const style = document.createElement('style');
  style.id = 'midnight-podcast-settings-style';
  style.textContent = `
    #midnight-podcast-settings-button{
      position:fixed;right:max(10px,env(safe-area-inset-right));bottom:max(10px,env(safe-area-inset-bottom));
      z-index:2147483646;width:42px;height:42px;border:1px solid rgba(148,163,184,.5);border-radius:50%;
      background:rgba(15,23,42,.82);color:#fff;box-shadow:0 8px 24px rgba(2,6,23,.35);
      backdrop-filter:blur(8px);font:700 18px/1 system-ui,-apple-system,"Segoe UI",sans-serif;
      opacity:.62;cursor:pointer;touch-action:manipulation;
    }
    #midnight-podcast-settings-button:hover,#midnight-podcast-settings-button:focus-visible{opacity:1}
    #midnight-podcast-settings-button[hidden]{display:none!important}
    #midnight-podcast-settings-menu{
      position:fixed;right:max(10px,env(safe-area-inset-right));bottom:max(60px,calc(env(safe-area-inset-bottom) + 58px));
      z-index:2147483646;width:min(280px,calc(100vw - 20px));box-sizing:border-box;padding:14px;
      border:1px solid rgba(148,163,184,.45);border-radius:14px;background:rgba(15,23,42,.97);color:#fff;
      box-shadow:0 18px 44px rgba(2,6,23,.5);font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;
    }
    #midnight-podcast-settings-menu[hidden]{display:none!important}
    #midnight-podcast-settings-menu strong{display:block;margin-bottom:8px}
    #midnight-podcast-settings-menu label{display:flex;align-items:center;justify-content:space-between;gap:16px}
    #midnight-podcast-settings-menu input{width:22px;height:22px;accent-color:#2563eb}
    #midnight-podcast-settings-menu p{margin:8px 0 0;color:#cbd5e1;font-size:12px}
  `;
  document.head.appendChild(style);

  const settingsButton = document.createElement('button');
  settingsButton.id = 'midnight-podcast-settings-button';
  settingsButton.type = 'button';
  settingsButton.textContent = '⚙';
  settingsButton.setAttribute('aria-label', 'Podcast settings');
  settingsButton.hidden = !hidden;
  document.body.appendChild(settingsButton);

  const settingsMenu = document.createElement('div');
  settingsMenu.id = 'midnight-podcast-settings-menu';
  settingsMenu.hidden = true;
  settingsMenu.innerHTML = `
    <strong>Podcast settings</strong>
    <label>
      <span>Show podcast controls</span>
      <input id="midnight-podcast-show-toggle" type="checkbox" />
    </label>
    <p>Hide the podcast controls during play. Use the small ⚙ button to bring them back.</p>
  `;
  document.body.appendChild(settingsMenu);

  const showToggle = settingsMenu.querySelector('#midnight-podcast-show-toggle');

  function getPlayer() {
    return document.querySelector('midnight-podcast-player');
  }

  function applyVisibility() {
    const player = getPlayer();
    if (player) {
      if (hidden) player.style.setProperty('display', 'none', 'important');
      else player.style.removeProperty('display');
    }
    settingsButton.hidden = !hidden;
    showToggle.checked = !hidden;
    if (!hidden) {
      settingsOpen = false;
      settingsMenu.hidden = true;
      settingsButton.setAttribute('aria-expanded', 'false');
    }
  }

  function setHidden(value) {
    hidden = !!value;
    save();
    applyVisibility();
  }

  function ensureShadowControls() {
    const player = getPlayer();
    if (!player || !player.shadowRoot) return;
    const root = player.shadowRoot;

    if (!root.getElementById('midnight-podcast-hide-style')) {
      const shadowStyle = document.createElement('style');
      shadowStyle.id = 'midnight-podcast-hide-style';
      shadowStyle.textContent = `
        .midnight-hide-podcast-launcher{
          position:fixed;left:calc(50% + 91px);bottom:max(12px,env(safe-area-inset-bottom));z-index:2147483001;
          width:38px;height:38px;border:1px solid rgba(148,163,184,.45);border-radius:50%;
          background:rgba(15,23,42,.97);color:#fff;font:700 20px/1 system-ui,-apple-system,"Segoe UI",sans-serif;
          cursor:pointer;touch-action:manipulation;box-shadow:0 10px 28px rgba(2,6,23,.4)
        }
        .midnight-hide-podcast-panel{
          border:1px solid #475569;border-radius:10px;padding:9px 12px;background:#1e293b;color:#fff;
          font-weight:750;cursor:pointer;touch-action:manipulation
        }
      `;
      root.appendChild(shadowStyle);
    }

    const launcher = root.querySelector('.launcher');
    if (launcher && !root.querySelector('.midnight-hide-podcast-launcher')) {
      const hideButton = document.createElement('button');
      hideButton.type = 'button';
      hideButton.className = 'midnight-hide-podcast-launcher';
      hideButton.textContent = '×';
      hideButton.title = 'Hide podcast controls';
      hideButton.setAttribute('aria-label', 'Hide podcast controls');
      hideButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        setHidden(true);
      });
      root.appendChild(hideButton);
    }

    const actions = root.querySelector('.actions');
    if (actions && !actions.querySelector('.midnight-hide-podcast-panel')) {
      const hideButton = document.createElement('button');
      hideButton.type = 'button';
      hideButton.className = 'midnight-hide-podcast-panel';
      hideButton.textContent = 'Hide controls';
      hideButton.addEventListener('click', () => setHidden(true));
      actions.appendChild(hideButton);
    }

    applyVisibility();
  }

  settingsButton.addEventListener('click', () => {
    settingsOpen = !settingsOpen;
    settingsMenu.hidden = !settingsOpen;
    settingsButton.setAttribute('aria-expanded', String(settingsOpen));
  });

  showToggle.addEventListener('change', () => {
    setHidden(!showToggle.checked);
  });

  document.addEventListener('click', (event) => {
    if (!settingsOpen) return;
    if (settingsMenu.contains(event.target) || settingsButton.contains(event.target)) return;
    settingsOpen = false;
    settingsMenu.hidden = true;
    settingsButton.setAttribute('aria-expanded', 'false');
  });

  const watchForPlayer = () => {
    const player = getPlayer();
    if (!player) {
      setTimeout(watchForPlayer, 100);
      return;
    }
    applyVisibility();
    ensureShadowControls();
    if (player.shadowRoot && window.MutationObserver) {
      new MutationObserver(() => ensureShadowControls()).observe(player.shadowRoot, {
        childList: true,
        subtree: true
      });
    }
  };

  watchForPlayer();
})();
