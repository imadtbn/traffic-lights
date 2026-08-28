/**
 * المحمّل المركزي لخدمات القياس والإعلانات.
 *
 * ملاحظات الإعداد:
 * - وضع GA4 مضبوط صراحة في TAG_CONFIG: مباشر حالياً لاكتشاف Google tag، أو عبر GTM عند تغيير الوضع.
 * - لا تستخدم وضع GA4 المباشر مع Google tag مكرر داخل GTM حتى لا تتكرر page_view.
 * - AdSense لا يُحمّل إلا عند وجود ins.adsbygoogle داخل الصفحة.
 */
const TAG_CONFIG = Object.freeze({
  // معرّف حاوية Google Tag Manager.
  gtmId: 'GTM-PDTBDSW9',
  // معرّف Google Analytics 4 المقدم من المستخدم.
  ga4Id: 'G-R5C0SX63K3',
  // الوضع الحالي مباشر لتفادي رسالة عدم اكتشاف Google tag. غيّره إلى gtm إذا كان Google tag مفعلاً داخل GTM.
  ga4Mode: 'direct',
  // معرّف AdSense المتوفر في إعدادات الموقع.
  adsenseClient: 'ca-pub-5656416032906373',
  // ضع هنا معرّف Microsoft Clarity: xxxxxxxxxx
  clarityId: 'xxxxxxxx',
});

const ADSENSE_SRC = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
const GA4_SRC = 'https://www.googletagmanager.com/gtag/js';
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

function loadGA4() {
  if (TAG_CONFIG.ga4Mode !== 'direct' || !isConfigured(TAG_CONFIG.ga4Id) || loadedServices.has('ga4')) return;
  loadedServices.add('ga4');
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtagQueue(...args) {
    window.dataLayer.push(args);
  };
  const ga4Source = `${GA4_SRC}?id=${encodeURIComponent(TAG_CONFIG.ga4Id)}`;
  const alreadyLoaded = hasScriptSource(ga4Source);
  if (!alreadyLoaded) {
    window.gtag('js', new Date());
    window.gtag('config', TAG_CONFIG.ga4Id);
  }
  loadScript(ga4Source).catch(() => {
    loadedServices.delete('ga4');
  });
}

function loadGTM() {
  if (!isConfigured(TAG_CONFIG.gtmId) || loadedServices.has('gtm')) return;
  loadedServices.add('gtm');
  window.dataLayer = window.dataLayer || [];
  const gtmSource = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(TAG_CONFIG.gtmId)}`;
  if (!hasScriptSource(gtmSource)) {
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  }
  // لا ترسل تعريف GA4 إلى GTM عندما يعمل Google tag المباشر لتفادي page_view المكرر.
  if (TAG_CONFIG.ga4Mode === 'gtm' && isConfigured(TAG_CONFIG.ga4Id)) {
    window.dataLayer.push({ event: 'site_config', analytics_id: TAG_CONFIG.ga4Id });
  }
  loadScript(gtmSource).catch(() => {
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

let coreStarted = false;
let appObserver = null;

function start() {
  if (!coreStarted) {
    coreStarted = true;
    loadGA4();
    loadGTM();
    loadClarity();
  }
  observeAdUnits();

  const appRoot = document.querySelector('#app');
  if (appRoot && 'MutationObserver' in window && !appObserver) {
    appObserver = new MutationObserver(observeAdUnits);
    appObserver.observe(appRoot, { childList: true, subtree: true });
  }
}

window.siteTags = Object.freeze({ config: TAG_CONFIG, start });
start();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
}
