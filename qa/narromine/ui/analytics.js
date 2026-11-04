// An unconfigured build must not make a third-party request with the template ID.
(() => {
  const config = document.currentScript;
  const id = config?.dataset.websiteId;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '')) return;
  const script = document.createElement('script');
  script.src = 'https://cloud.umami.is/script.js';
  script.defer = true;
  for (const key of ['websiteId', 'doNotTrack', 'performance', 'excludeHash', 'domains', 'tag'])
    if (config.dataset[key] !== undefined) script.dataset[key] = config.dataset[key];
  document.head.append(script);
})();
