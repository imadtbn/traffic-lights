const ADSENSE_CLIENT = 'ca-pub-5656416032906373';

const AD_CONFIG = Object.freeze({
  feed01: { format: 'fluid', layoutKey: '-fr+56+4k-d4+74', slot: '7867079394' },
  display01: { format: 'auto', responsive: true, slot: '3143411927' },
  feed02: { format: 'fluid', layoutKey: '-h9-h+8-jr+r8', slot: '8546947691' },
  display02: { format: 'auto', responsive: true, slot: '1760836049' },
  feed03: { format: 'fluid', layoutKey: '-h6-l+d-jc+qd', slot: '6152718642' },
  display03: { format: 'auto', responsive: true, slot: '5508509362' },
  article01: { format: 'fluid', layout: 'in-article', slot: '6118497380' },
  article02: { format: 'fluid', layout: 'in-article', slot: '7319898418' },
  related: { format: 'autorelaxed', slot: '6528123169' },
});

const pendingAds = new WeakSet();

function getAdAttributes(config) {
  const style = config.layout ? 'display:block; text-align:center;' : 'display:block';
  const attributes = [
    'class="adsbygoogle"',
    `style="${style}"`,
    `data-ad-client="${ADSENSE_CLIENT}"`,
    `data-ad-slot="${config.slot}"`,
    `data-ad-format="${config.format}"`,
  ];

  if (config.layoutKey) attributes.push(`data-ad-layout-key="${config.layoutKey}"`);
  if (config.layout) attributes.push(`data-ad-layout="${config.layout}"`);
  if (config.responsive) attributes.push('data-full-width-responsive="true"');

  return attributes.join(' ');
}

export function adMarkup(type, label = 'إعلان') {
  const config = AD_CONFIG[type];
  if (!config) return '';

  return `<section class="ad-slot ad-slot--${type}" data-ad-type="${type}" aria-label="${label}" data-ad-state="idle">
    <span class="ad-slot__label" aria-hidden="true">${label}</span>
    <ins ${getAdAttributes(config)}></ins>
  </section>`;
}

function schedule(callback) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout: 1400 });
  } else {
    window.setTimeout(callback, 80);
  }
}

function requestAd(slot) {
  if (!slot || pendingAds.has(slot) || slot.dataset.adState === 'requested') return;
  pendingAds.add(slot);
  slot.dataset.adState = 'requested';

  try {
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({});
  } catch (error) {
    slot.dataset.adState = 'error';
    pendingAds.delete(slot);
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.warn('[ads] AdSense is unavailable in local preview.', error);
    }
  }
}

export function initAds(root = document) {
  const slots = [...root.querySelectorAll('.ad-slot[data-ad-state="idle"]')];
  if (!slots.length) return;

  const load = (slot) => schedule(() => requestAd(slot));

  if (!('IntersectionObserver' in window)) {
    slots.forEach(load);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      load(entry.target);
    });
  }, { rootMargin: '420px 0px' });

  slots.forEach((slot) => observer.observe(slot));
}
