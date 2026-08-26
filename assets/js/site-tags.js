/**
 * المحمّل المركزي لخدمات القياس والإعلانات.
 *
 * ملاحظات الإعداد:
 * - GTM هو المسار المعتمد لتشغيل GA4 وMicrosoft Clarity عند توفر معرّف الحاوية.
 * - لا نحمّل gtag.js مباشرة ولا ننفذ gtag('config') حتى لا تتكرر page_view.
 * - AdSense لا يُحمّل إلا عند وجود ins.adsbygoogle داخل الصفحة.
 */
const TAG_CONFIG = Object.freeze({
  // ضع هنا معرّف حاوية Google Tag Manager: GTM-XXXXXXX
  gtmId: 'xxxxxxxx',
  // ضع هنا معرّف Google Analytics 4 للتوثيق داخل GTM: G-XXXXXXXXXX
  ga4Id: 'xxxxxxxx',
  // معرّف AdSense المتوفر في إعدادات الموقع.
  adsenseClient: 'ca-pub-5656416032906373',
  // ضع هنا معرّف Microsoft Clarity: xxxxxxxxxx
  clarityId: 'xxxxxxxx',
});

const ADSENSE_SRC = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
const loadedServices = new Set();
const observedAdUnits = new WeakSet();
const queuedAdUnits = new WeakSet();

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

function isConfigured(value) {
  return Boolean(value && !/^x+$/i.test(value));
}

function hasScriptSource(source) {
  const target = new URL(source, document.baseURI).href;
  return [...document.scripts].some((script) => script.src === target || script.src.startsWith(`${target}?`));
}

function loadScript(source, attributes = {}) {
  if (hasScriptSource(source)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = source;
    script.async = true;
    Object.entries(attributes).forEach(([name, value]) => script.setAttribute(name, value));
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', reject, { once: true });
    document.head.appendChild(script);
  });
}

function loadGTM() {
  if (!isConfigured(TAG_CONFIG.gtmId) || loadedServices.has('gtm')) return;
  loadedServices.add('gtm');
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  loadScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(TAG_CONFIG.gtmId)}`).catch(() => {
    loadedServices.delete('gtm');
  });
}

function loadClarity() {
  // عند تفعيل GTM، يجب إعداد Clarity داخله بدلاً من تحميله مباشرة هنا.
  if (isConfigured(TAG_CONFIG.gtmId) || !isConfigured(TAG_CONFIG.clarityId) || loadedServices.has('clarity')) return;
  loadedServices.add('clarity');
  window.clarity = window.clarity || function clarityQueue(...args) {
    (window.clarity.q = window.clarity.q || []).push(args);
  };
  loadScript(`https://www.clarity.ms/tag/${encodeURIComponent(TAG_CONFIG.clarityId)}`).catch(() => {
    loadedServices.delete('clarity');
  });
}

function getAdAttributes(config) {
  const style = config.layout ? 'display:block; text-align:center;' : 'display:block';
  const attributes = [
    'class="adsbygoogle"',
    `style="${style}"`,
    `data-ad-client="${TAG_CONFIG.adsenseClient}"`,
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
  return `<section class="ad-slot ad-slot--${type}" data-ad-type="${type}" aria-label="${label}">
    <span class="ad-slot__label" aria-hidden="true">${label}</span>
    <ins ${getAdAttributes(config)}></ins>
  </section>`;
}

function queueAdUnit(unit) {
  if (!unit || queuedAdUnits.has(unit)) return;
  queuedAdUnits.add(unit);
  unit.setAttribute('data-site-tags-queued', 'true');
  window.adsbygoogle = window.adsbygoogle || [];
  try {
    window.adsbygoogle.push({});
  } catch (error) {
    queuedAdUnits.delete(unit);
    unit.removeAttribute('data-site-tags-queued');
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.warn('[site-tags] AdSense is unavailable in local preview.', error);
    }
  }
}

function queueAdsenseUnits() {
  document.querySelectorAll('ins.adsbygoogle').forEach(queueAdUnit);
}

function loadAdSense() {
  if (!isConfigured(TAG_CONFIG.adsenseClient) || loadedServices.has('adsense')) {
    queueAdsenseUnits();
    return;
  }
  loadedServices.add('adsense');
  loadScript(`${ADSENSE_SRC}?client=${encodeURIComponent(TAG_CONFIG.adsenseClient)}`, { crossorigin: 'anonymous' })
    .then(queueAdsenseUnits)
    .catch(() => loadedServices.delete('adsense'));
}

function schedule(callback) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout: 1400 });
  } else {
    window.setTimeout(callback, 80);
  }
}

function observeAdUnits() {
  const units = [...document.querySelectorAll('ins.adsbygoogle')];
  if (!units.length) return;

  const activate = (unit) => schedule(() => {
    if (hasScriptSource(ADSENSE_SRC)) {
      loadedServices.add('adsense');
      queueAdUnit(unit);
    } else {
      loadAdSense();
    }
  });

  if (!('IntersectionObserver' in window)) {
    units.forEach((unit) => {
      if (!observedAdUnits.has(unit)) {
        observedAdUnits.add(unit);
        activate(unit);
      }
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      activate(entry.target);
    });
  }, { rootMargin: '420px 0px' });

  units.forEach((unit) => {
    if (observedAdUnits.has(unit)) return;
    observedAdUnits.add(unit);
    observer.observe(unit);
  });
}

function start() {
  // GA4 is intentionally documented in TAG_CONFIG and should be configured in GTM.
  loadGTM();
  loadClarity();
  observeAdUnits();

  const appRoot = document.querySelector('#app');
  if (appRoot && 'MutationObserver' in window) {
    new MutationObserver(observeAdUnits).observe(appRoot, { childList: true, subtree: true });
  }
}

window.siteTags = Object.freeze({ config: TAG_CONFIG, start });
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
