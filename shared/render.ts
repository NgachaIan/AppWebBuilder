import type { Block, Business, Page, Project, Theme } from './types';

export type RenderMode = 'editor' | 'published' | 'export';

export interface RenderOptions {
  mode: RenderMode;
  /** published: e.g. "/sites/my-shop" */
  baseUrl?: string;
  /** absolute API origin used by exported sites' contact forms, e.g. "https://app.example.com" */
  apiOrigin?: string;
}

interface Ctx {
  project: Project;
  page: Page;
  opts: RenderOptions;
}

/* ---------------- helpers ---------------- */

export function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function paragraphs(text: string): string {
  return String(text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/** Normalise a Kenyan (or international) number to wa.me / tel format digits. */
export function normalisePhone(raw: string): string {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('0') && d.length === 10) d = '254' + d.slice(1);
  else if ((d.startsWith('7') || d.startsWith('1')) && d.length === 9) d = '254' + d;
  return d;
}

export function whatsappHref(b: Business, message?: string): string {
  const n = normalisePhone(b.whatsapp || b.phone);
  if (!n) return '';
  return `https://wa.me/${n}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

export function pageHref(slug: string, ctx: Ctx, anchor = ''): string {
  const hash = anchor ? `#${anchor}` : '';
  const { mode, baseUrl = '' } = ctx.opts;
  if (mode === 'editor') return `#awb-page:${slug}${anchor ? ':' + anchor : ''}`;
  if (slug === ctx.page.slug && anchor) return hash;
  if (mode === 'export') return `${slug ? slug : 'index'}.html${hash}`;
  return `${baseUrl}/${slug}${hash}`;
}

export function resolveLink(link: string, ctx: Ctx, waMessage?: string): { href: string; external: boolean } {
  const b = ctx.project.business;
  const l = String(link ?? '').trim();
  if (!l) return { href: '#', external: false };
  if (l === 'whatsapp') {
    const h = whatsappHref(b, waMessage ?? `Hi ${b.name}, I found you online.`);
    return h ? { href: h, external: true } : { href: '#contact', external: false };
  }
  if (l === 'call') {
    const n = normalisePhone(b.phone || b.whatsapp);
    return n ? { href: `tel:+${n}`, external: false } : { href: '#contact', external: false };
  }
  if (l === 'email') return b.email ? { href: `mailto:${b.email}`, external: false } : { href: '#contact', external: false };
  if (l.startsWith('page:')) {
    const [slug, anchor = ''] = l.slice(5).split('#');
    return { href: pageHref(slug, ctx, anchor), external: false };
  }
  if (l.startsWith('#')) return { href: l, external: false };
  if (/^(https?:|mailto:|tel:)/i.test(l)) return { href: l, external: /^https?:/i.test(l) };
  if (l.includes('.')) return { href: `https://${l}`, external: true };
  return { href: '#', external: false };
}

function a(link: string, label: string, cls: string, ctx: Ctx, waMessage?: string): string {
  if (!label) return '';
  const { href, external } = resolveLink(link, ctx, waMessage);
  return `<a class="${cls}" href="${esc(href)}"${external ? ' target="_blank" rel="noopener"' : ''}>${esc(label)}</a>`;
}

function head(p: Record<string, any>, extra = ''): string {
  const h = p.heading ? `<h2>${esc(p.heading)}</h2>` : '';
  const s = p.subheading ? `<p class="lead">${esc(p.subheading)}</p>` : '';
  return h || s ? `<header class="sec-head ${extra}">${h}${s}</header>` : '';
}

const ICONS: Record<string, string> = {
  home: '<path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  shop: '<path d="M4 7h16l-1.5 12.5a2 2 0 0 1-2 1.5h-9a2 2 0 0 1-2-1.5zM9 7V5a3 3 0 0 1 6 0v2"/>',
  cart: '<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="10" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
};
const icon = (name: string, size = 22) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ?? ICONS.info}</svg>`;

const WA_SVG =
  '<svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor" aria-hidden="true"><path d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm0 23.7a10.7 10.7 0 0 1-5.5-1.5l-.4-.2-3.9 1 1-3.8-.2-.4A10.7 10.7 0 1 1 16 26.7zm5.9-8c-.3-.2-1.9-1-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0a8.8 8.8 0 0 1-4.4-3.8c-.3-.6.3-.5 1-1.7a.6.6 0 0 0 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.7 3.7 0 0 0-1.1 2.7 6.4 6.4 0 0 0 1.3 3.4 14.7 14.7 0 0 0 5.6 5c2.1.9 2.9 1 4 .8a3.3 3.3 0 0 0 2.1-1.5 2.7 2.7 0 0 0 .2-1.5c-.1-.2-.3-.3-.6-.4z"/></svg>';

/* ---------------- blocks ---------------- */

type Renderer = (p: Record<string, any>, ctx: Ctx, b: Block) => string;

const R: Record<Block['type'], Renderer> = {
  navbar(p, ctx) {
    const biz = ctx.project.business;
    const logo = p.logoImage
      ? `<img src="${esc(p.logoImage)}" alt="${esc(biz.name)}">`
      : `<span>${esc(p.logoText || biz.name)}</span>`;
    const links = (p.links ?? []).map((l: any) => a(l.link, l.label, 'nav-link', ctx)).join('');
    return `<nav class="nav ${p.sticky ? 'sticky' : ''}"><div class="wrap nav-in">
<a class="logo" href="${esc(pageHref('', ctx))}">${logo}</a>
<input type="checkbox" id="nav-t" class="nav-t" aria-label="Menu"><label for="nav-t" class="burger" aria-hidden="true"><i></i><i></i><i></i></label>
<div class="nav-links">${links}${a(p.ctaLink, p.ctaLabel, 'btn btn-sm', ctx)}</div>
</div></nav>`;
  },

  hero(p, ctx) {
    const btns = `<div class="btns">${a(p.primaryLink, p.primaryLabel, 'btn', ctx)}${a(p.secondaryLink, p.secondaryLabel, 'btn btn-ghost', ctx)}</div>`;
    const text = `${p.eyebrow ? `<span class="eyebrow">${esc(p.eyebrow)}</span>` : ''}<h1>${esc(p.title)}</h1>${p.subtitle ? `<p class="lead">${esc(p.subtitle)}</p>` : ''}${btns}`;
    if (p.layout === 'cover') {
      return `<div class="hero hero-cover" style="background-image:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.65)),url('${esc(p.image)}')"><div class="wrap hero-c">${text}</div></div>`;
    }
    if (p.layout === 'center' || !p.image) {
      return `<div class="hero hero-center"><div class="wrap narrow">${text}</div></div>`;
    }
    return `<div class="hero"><div class="wrap hero-split"><div>${text}</div><img class="hero-img" src="${esc(p.image)}" alt=""></div></div>`;
  },

  text(p) {
    return `<div class="sec"><div class="wrap narrow ${p.align === 'center' ? 'tc' : ''}">${p.heading ? `<h2>${esc(p.heading)}</h2>` : ''}<div class="prose">${paragraphs(p.body)}</div></div></div>`;
  },

  image(p) {
    const img = `<figure class="fig ${p.width === 'full' ? 'fig-full' : ''}"><img src="${esc(p.src)}" alt="${esc(p.caption)}">${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ''}</figure>`;
    return p.width === 'full' ? `<div class="sec-flush">${img}</div>` : `<div class="sec"><div class="wrap">${img}</div></div>`;
  },

  features(p) {
    const items = (p.items ?? [])
      .map((it: any, i: number) => `<div class="card feat"><span class="num">${String(i + 1).padStart(2, '0')}</span><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></div>`)
      .join('');
    return `<div class="sec"><div class="wrap">${head(p)}<div class="grid cols-${esc(p.columns || '3')}">${items}</div></div></div>`;
  },

  products(p, ctx) {
    const biz = ctx.project.business;
    const cur = esc(p.currency || 'KES');
    const items = (p.items ?? [])
      .map((it: any) => {
        const price = it.price ? `<span class="price">${cur} ${esc(it.price)}</span>` : '';
        let btn = '';
        const verb = String(p.buttonLabel || 'Order').trim();
        if (p.orderVia === 'whatsapp') btn = a('whatsapp', verb, 'btn btn-sm', ctx, `Hi ${biz.name}, I'd like to ${verb.toLowerCase()}: ${it.name}${it.price ? ` (${p.currency || 'KES'} ${it.price})` : ''}`);
        else if (p.orderVia === 'call') btn = a('call', 'Call to order', 'btn btn-sm', ctx);
        if (p.showImages) {
          return `<div class="card prod">${it.image ? `<img src="${esc(it.image)}" alt="${esc(it.name)}">` : ''}<div class="prod-b"><h3>${esc(it.name)}</h3>${it.description ? `<p>${esc(it.description)}</p>` : ''}<div class="prod-f">${price}${btn}</div></div></div>`;
        }
        return `<div class="row-item"><div><h3>${esc(it.name)}</h3>${it.description ? `<p>${esc(it.description)}</p>` : ''}</div><div class="row-r">${price}${btn}</div></div>`;
      })
      .join('');
    return `<div class="sec"><div class="wrap">${head(p)}${p.showImages ? `<div class="grid cols-3">${items}</div>` : `<div class="list card">${items}</div>`}</div></div>`;
  },

  gallery(p) {
    const items = (p.items ?? [])
      .map((it: any) => `<figure class="gal-i"><img src="${esc(it.src)}" alt="${esc(it.caption)}" loading="lazy">${it.caption ? `<figcaption>${esc(it.caption)}</figcaption>` : ''}</figure>`)
      .join('');
    return `<div class="sec"><div class="wrap">${head(p)}<div class="gal">${items}</div></div></div>`;
  },

  testimonials(p) {
    const items = (p.items ?? [])
      .map((it: any) => `<blockquote class="card quote"><p>“${esc(it.quote)}”</p><footer><strong>${esc(it.name)}</strong>${it.role ? ` · ${esc(it.role)}` : ''}</footer></blockquote>`)
      .join('');
    return `<div class="sec alt"><div class="wrap">${head(p)}<div class="grid cols-2">${items}</div></div></div>`;
  },

  hours(p) {
    const rows = (p.items ?? []).map((it: any) => `<div class="hrow"><span>${esc(it.day)}</span><strong>${esc(it.time)}</strong></div>`).join('');
    return `<div class="sec"><div class="wrap narrow">${head(p)}<div class="card hours">${rows}</div>${p.note ? `<p class="muted tc">${esc(p.note)}</p>` : ''}</div></div>`;
  },

  faq(p) {
    const items = (p.items ?? []).map((it: any) => `<details class="faq"><summary>${esc(it.q)}</summary><div>${paragraphs(it.a)}</div></details>`).join('');
    return `<div class="sec"><div class="wrap narrow">${head(p)}${items}</div></div>`;
  },

  cta(p, ctx) {
    return `<div class="sec"><div class="wrap"><div class="cta cta-${esc(p.style || 'primary')}"><h2>${esc(p.heading)}</h2>${p.text ? `<p>${esc(p.text)}</p>` : ''}${a(p.buttonLink, p.buttonLabel, 'btn btn-inv', ctx)}</div></div></div>`;
  },

  contact(p, ctx) {
    const b = ctx.project.business;
    const lines: string[] = [];
    const phone = normalisePhone(b.phone);
    if (b.phone) lines.push(`<a class="c-line" href="tel:+${phone}">${icon('phone', 20)}<span><small>Call</small>${esc(b.phone)}</span></a>`);
    const wa = whatsappHref(b, `Hi ${b.name}`);
    if (wa) lines.push(`<a class="c-line" href="${esc(wa)}" target="_blank" rel="noopener">${icon('chat', 20)}<span><small>WhatsApp</small>${esc(b.whatsapp || b.phone)}</span></a>`);
    if (b.email) lines.push(`<a class="c-line" href="mailto:${esc(b.email)}">${icon('info', 20)}<span><small>Email</small>${esc(b.email)}</span></a>`);
    if (b.location) lines.push(`<div class="c-line">${icon('home', 20)}<span><small>Find us</small>${esc(b.location)}</span></div>`);
    if (!lines.length && ctx.opts.mode === 'editor')
      lines.push('<div class="c-line muted">Add your phone, WhatsApp and location in <b>&nbsp;Site settings&nbsp;</b> to show them here.</div>');

    let mpesa = '';
    if (p.showMpesa && b.mpesaType !== 'none' && b.mpesaNumber) {
      mpesa =
        b.mpesaType === 'till'
          ? `<div class="mpesa"><div class="mp-t">Pay with M-Pesa</div><div class="mp-r"><span>Lipa na M-Pesa → Buy Goods</span></div><div class="mp-r"><span>Till number</span><strong>${esc(b.mpesaNumber)}</strong></div></div>`
          : `<div class="mpesa"><div class="mp-t">Pay with M-Pesa</div><div class="mp-r"><span>Lipa na M-Pesa → Paybill</span></div><div class="mp-r"><span>Business no.</span><strong>${esc(b.mpesaNumber)}</strong></div><div class="mp-r"><span>Account no.</span><strong>${esc(b.mpesaAccount || 'Your name')}</strong></div></div>`;
    } else if (p.showMpesa && ctx.opts.mode === 'editor') {
      mpesa = '<div class="mpesa muted-box">Add your M-Pesa Till or Paybill in Site settings to show payment details here.</div>';
    }

    const map =
      p.showMap && b.location
        ? `<iframe class="map" title="Map" loading="lazy" src="https://maps.google.com/maps?q=${encodeURIComponent(b.location)}&z=15&output=embed"></iframe>`
        : '';

    let form = '';
    if (p.showForm) {
      const { mode, baseUrl = '', apiOrigin = '' } = ctx.opts;
      const action = mode === 'published' ? `/api/sites/${ctx.project.slug}/leads` : mode === 'export' && apiOrigin ? `${apiOrigin}/api/sites/${ctx.project.slug}/leads` : '';
      void baseUrl;
      const waNum = !action && mode === 'export' ? normalisePhone(b.whatsapp || b.phone) : '';
      form = `<form class="card form" data-awb-form data-action="${esc(action)}" data-wa="${esc(waNum)}" data-page="${esc(ctx.page.slug)}">
<label>Your name<input name="name" required maxlength="120"></label>
<label>Phone<input name="phone" type="tel" maxlength="40" placeholder="07XX XXX XXX"></label>
<label>Email<input name="email" type="email" maxlength="160"></label>
<label>Message<textarea name="message" rows="4" required maxlength="2000"></textarea></label>
<input name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
<button class="btn" type="submit">Send message</button><p class="form-msg" role="status"></p></form>`;
    }

    return `<div class="sec alt"><div class="wrap">${head({ heading: p.heading, subheading: p.text })}<div class="contact ${form ? '' : 'no-form'}"><div class="c-info">${lines.join('')}${mpesa}${map}</div>${form}</div></div></div>`;
  },

  footer(p, ctx) {
    const b = ctx.project.business;
    const text = p.text || `© ${new Date().getFullYear()} ${b.name}`;
    const socials = (['facebook', 'instagram', 'tiktok', 'x'] as const)
      .filter((k) => p[k])
      .map((k) => a(p[k], k === 'x' ? 'X' : k[0].toUpperCase() + k.slice(1), 'soc', ctx))
      .join('');
    return `<footer class="foot"><div class="wrap foot-in"><span>${esc(text)}</span><div class="socs">${socials}</div></div></footer>`;
  },

  appbar(p, ctx) {
    const items = (p.items ?? [])
      .map((it: any) => {
        const { href, external } = resolveLink(it.link, ctx);
        const active = String(it.link) === `page:${ctx.page.slug}` ? ' active' : '';
        return `<a class="tab${active}" href="${esc(href)}"${external ? ' target="_blank" rel="noopener"' : ''}>${icon(it.icon)}<span>${esc(it.label)}</span></a>`;
      })
      .join('');
    return `<nav class="appbar">${items}</nav>`;
  },
};

export function renderBlock(block: Block, ctx: Ctx): string {
  const fn = R[block.type];
  if (!fn) return '';
  const anchor = block.props.anchor ? ` id="${esc(block.props.anchor)}"` : '';
  return `<section class="b b-${block.type}"${anchor}>${fn(block.props, ctx, block)}</section>`;
}

/* ---------------- styles ---------------- */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0');
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
}
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** Readable text colour for a given background. */
export function onColor(hex: string): string {
  return luminance(hex) > 0.45 ? '#0f172a' : '#ffffff';
}

export function fontsHref(theme: Theme): string {
  const fams = Array.from(new Set([theme.font, theme.headingFont]))
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;500;600;700`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${fams}&display=swap`;
}

export function renderCss(t: Theme): string {
  const dark = luminance(t.background) < 0.2;
  return `:root{--p:${t.primary};--on-p:${onColor(t.primary)};--ac:${t.accent};--bg:${t.background};--sf:${t.surface};--tx:${t.text};--mut:color-mix(in srgb,var(--tx) 62%,var(--bg));--bd:color-mix(in srgb,var(--tx) ${dark ? 16 : 11}%,var(--bg));--r:${t.radius}px;--f:'${t.font}',system-ui,sans-serif;--hf:'${t.headingFont}',var(--f)}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--tx);font:16px/1.6 var(--f);-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}a{color:inherit}h1,h2,h3{font-family:var(--hf);line-height:1.15;margin:0 0 .5em;letter-spacing:-.01em}
h1{font-size:clamp(2rem,5vw,3.4rem)}h2{font-size:clamp(1.5rem,3.2vw,2.2rem)}h3{font-size:1.1rem}p{margin:0 0 1em}
.wrap{max-width:1120px;margin:0 auto;padding:0 20px}.narrow{max-width:760px}.tc{text-align:center}.muted{color:var(--mut)}
.sec{padding:clamp(48px,7vw,88px) 0}.sec.alt{background:var(--sf)}.sec-flush{padding:0}
.sec-head{max-width:680px;margin:0 auto 36px;text-align:center}.lead{font-size:1.12rem;color:var(--mut)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 22px;border-radius:calc(var(--r) * .8);background:var(--p);color:var(--on-p);font-weight:600;text-decoration:none;border:2px solid var(--p);transition:transform .15s,filter .15s;cursor:pointer;font:600 15px var(--f)}
.btn:hover{filter:brightness(1.08);transform:translateY(-1px)}.btn-sm{padding:8px 14px;font-size:14px}
.btn-ghost{background:transparent;color:var(--tx);border-color:var(--bd)}.btn-inv{background:var(--on-cta,#fff);color:var(--cta-bg,#000);border-color:transparent}
.btns{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}
.card{background:var(--bg);border:1px solid var(--bd);border-radius:var(--r)}.sec.alt .card{background:var(--bg)}
.grid{display:grid;gap:20px}.cols-2{grid-template-columns:repeat(2,1fr)}.cols-3{grid-template-columns:repeat(3,1fr)}.cols-4{grid-template-columns:repeat(4,1fr)}
/* nav */
.nav{background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--bd);z-index:20}.nav.sticky{position:sticky;top:0}
.nav-in{display:flex;align-items:center;justify-content:space-between;min-height:68px;gap:16px}.logo{font:700 1.25rem var(--hf);text-decoration:none;display:flex;align-items:center}.logo img{max-height:40px}
.nav-links{display:flex;align-items:center;gap:22px}.nav-link{text-decoration:none;font-weight:500;color:var(--mut)}.nav-link:hover{color:var(--tx)}
.nav-t,.burger{display:none}
/* hero */
.hero{padding:clamp(56px,9vw,112px) 0}.hero-center{text-align:center}.hero-center .btns{justify-content:center}.hero-center .lead{max-width:620px;margin-left:auto;margin-right:auto}
.eyebrow{display:inline-block;padding:5px 12px;border-radius:999px;background:color-mix(in srgb,var(--p) 14%,var(--bg));color:var(--p);font-weight:600;font-size:13px;margin-bottom:18px}
.hero-split{display:grid;grid-template-columns:1.05fr 1fr;gap:48px;align-items:center}.hero-img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:calc(var(--r) * 1.4);box-shadow:0 24px 60px -24px rgba(0,0,0,.35)}
.hero-cover{background-size:cover;background-position:center;color:#fff;padding:clamp(90px,14vw,170px) 0}.hero-cover .lead{color:rgba(255,255,255,.88);max-width:620px}.hero-cover .btn-ghost{color:#fff;border-color:rgba(255,255,255,.55)}.hero-cover .eyebrow{background:rgba(255,255,255,.16);color:#fff}
/* content */
.prose p{font-size:1.08rem}.fig{margin:0}.fig img{width:100%;border-radius:var(--r)}.fig-full img{border-radius:0;max-height:560px;object-fit:cover}figcaption{color:var(--mut);font-size:14px;margin-top:10px;text-align:center}
.feat{padding:26px}.feat p{color:var(--mut);margin:0}.num{display:inline-block;font:700 13px var(--hf);color:var(--p);background:color-mix(in srgb,var(--p) 12%,var(--bg));padding:4px 9px;border-radius:8px;margin-bottom:14px}
.prod{overflow:hidden;display:flex;flex-direction:column}.prod img{width:100%;aspect-ratio:4/3;object-fit:cover}.prod-b{padding:18px;display:flex;flex-direction:column;flex:1}.prod-b p{color:var(--mut);font-size:15px;margin:0 0 14px}.prod-f{margin-top:auto;display:flex;justify-content:space-between;align-items:center;gap:10px}
.price{font-weight:700;color:var(--p);white-space:nowrap}
.list{padding:6px 22px}.row-item{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:16px 0;border-bottom:1px dashed var(--bd)}.row-item:last-child{border-bottom:0}.row-item h3{margin:0}.row-item p{margin:2px 0 0;color:var(--mut);font-size:14px}.row-r{display:flex;align-items:center;gap:12px}
.gal{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.gal-i{margin:0}.gal-i img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:var(--r)}
.quote{margin:0;padding:26px}.quote p{font-size:1.08rem}.quote footer{color:var(--mut);font-size:14px}
.hours{padding:6px 22px}.hrow{display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--bd)}.hrow:last-child{border:0}
.faq{border-bottom:1px solid var(--bd);padding:18px 0}.faq summary{font-weight:600;cursor:pointer;list-style:none;display:flex;justify-content:space-between}.faq summary::after{content:'+';color:var(--p);font-size:1.3em;line-height:1}.faq[open] summary::after{content:'–'}.faq div{color:var(--mut);padding-top:10px}.faq p{margin:0}
.cta{padding:clamp(36px,6vw,64px);border-radius:calc(var(--r) * 1.4);text-align:center}.cta p{max-width:560px;margin:0 auto 22px;opacity:.88}
.cta-primary{background:var(--p);color:var(--on-p);--cta-bg:var(--p);--on-cta:var(--on-p)}.cta-dark{background:#0f172a;color:#fff;--cta-bg:#0f172a;--on-cta:#fff}.cta-light{background:var(--sf);--cta-bg:var(--p);--on-cta:var(--p)}.cta-light .btn-inv{color:var(--on-p)}
.contact{display:grid;grid-template-columns:1fr 1.1fr;gap:28px;align-items:start}.contact.no-form{grid-template-columns:1fr;max-width:640px;margin:0 auto}
.c-info{display:flex;flex-direction:column;gap:12px}.c-line{display:flex;gap:14px;align-items:center;padding:14px 16px;border:1px solid var(--bd);border-radius:var(--r);background:var(--bg);text-decoration:none}.c-line svg{color:var(--p);flex:none}.c-line small{display:block;color:var(--mut);font-size:12px}
.mpesa{padding:16px 18px;border-radius:var(--r);background:#e8f7ec;color:#0b3d1d;border:1px solid #b7e4c4}.mp-t{font-weight:700;color:#14853b;margin-bottom:6px}.mp-r{display:flex;justify-content:space-between;font-size:15px;padding:3px 0}.muted-box{background:var(--bg);color:var(--mut);border:1px dashed var(--bd);font-size:14px}
.map{width:100%;height:240px;border:0;border-radius:var(--r)}
.form{padding:24px;display:flex;flex-direction:column;gap:14px}.form label{display:flex;flex-direction:column;gap:6px;font-weight:500;font-size:14px}.form input,.form textarea{font:inherit;padding:11px 13px;border:1px solid var(--bd);border-radius:calc(var(--r) * .6);background:var(--bg);color:var(--tx)}.form input:focus,.form textarea:focus{outline:2px solid var(--p);outline-offset:1px}.hp{position:absolute;left:-9999px}.form-msg{margin:0;font-size:14px;color:var(--p)}
.foot{padding:28px 0;border-top:1px solid var(--bd);color:var(--mut);font-size:14px}.foot-in{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.socs{display:flex;gap:16px}.soc{text-decoration:none}.soc:hover{color:var(--p)}
.appbar{position:fixed;left:0;right:0;bottom:0;display:flex;justify-content:space-around;background:color-mix(in srgb,var(--bg) 94%,transparent);backdrop-filter:blur(12px);border-top:1px solid var(--bd);padding:8px 6px calc(8px + env(safe-area-inset-bottom));z-index:30}
.tab{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;font-weight:600;text-decoration:none;color:var(--mut);padding:4px 10px;border-radius:12px}.tab.active{color:var(--p)}
body.has-appbar{padding-bottom:84px}body.has-appbar .wa-fab{bottom:92px}
.wa-fab{position:fixed;right:18px;bottom:18px;width:58px;height:58px;border-radius:50%;background:#25d366;color:#fff;display:grid;place-items:center;box-shadow:0 10px 30px -6px rgba(0,0,0,.35);z-index:40}
@media (max-width:860px){.hero-split,.contact{grid-template-columns:1fr}.cols-3,.cols-4{grid-template-columns:repeat(2,1fr)}.gal{grid-template-columns:repeat(2,1fr)}.hero-split img{order:-1}}
@media (max-width:640px){.cols-2,.cols-3,.cols-4{grid-template-columns:1fr}
.burger{display:flex;flex-direction:column;gap:5px;cursor:pointer;padding:8px}.burger i{width:22px;height:2px;background:var(--tx);border-radius:2px}
.nav-links{display:none;position:absolute;left:0;right:0;top:68px;flex-direction:column;align-items:stretch;gap:0;background:var(--bg);border-bottom:1px solid var(--bd);padding:8px 20px 16px}.nav-links .nav-link{padding:12px 0;border-bottom:1px solid var(--bd)}.nav-links .btn{margin-top:12px}
.nav-t:checked~.nav-links{display:flex}.nav{position:relative}.nav.sticky{position:sticky}.row-item{flex-direction:column;align-items:flex-start}}`;
}

/* ---------------- page assembly ---------------- */

const FORM_SCRIPT = `document.querySelectorAll('[data-awb-form]').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var m=f.querySelector('.form-msg');var url=f.getAttribute('data-action');if(!url){var wa=f.getAttribute('data-wa');if(wa){var v=Object.fromEntries(new FormData(f).entries());var t='Hi, my name is '+v.name+'.'+(v.phone?' Phone: '+v.phone+'.':'')+(v.email?' Email: '+v.email+'.':'')+'\\n\\n'+v.message;window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(t),'_blank');m.textContent='Opening WhatsApp to send your message…';return;}m.textContent='Form is disabled in preview.';return;}var d=Object.fromEntries(new FormData(f).entries());d.page=f.getAttribute('data-page');m.textContent='Sending…';fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}).then(function(r){if(!r.ok)throw 0;f.reset();m.textContent='Thank you! We will get back to you soon.';}).catch(function(){m.textContent='Sorry, something went wrong. Please call or WhatsApp us instead.';});});});`;

export function renderBody(project: Project, page: Page, opts: RenderOptions, wrap?: (html: string, block: Block) => string): string {
  const ctx: Ctx = { project, page, opts };
  const blocks = page.blocks.map((b) => (wrap ? wrap(renderBlock(b, ctx), b) : renderBlock(b, ctx))).join('\n');
  const b = project.business;
  const hasAppbar = page.blocks.some((x) => x.type === 'appbar');
  const wa = b.showWhatsappButton ? whatsappHref(b, `Hi ${b.name}`) : '';
  const fab = wa ? `<a class="wa-fab" href="${esc(wa)}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${WA_SVG}</a>` : '';
  return `<main class="${hasAppbar ? 'has-appbar-main' : ''}">${blocks}</main>${fab}`;
}

export function renderPage(project: Project, page: Page, opts: RenderOptions): string {
  const b = project.business;
  const title = page.slug ? `${page.name} · ${b.name}` : `${b.name}${b.tagline ? ' · ' + b.tagline : ''}`;
  const hasAppbar = page.blocks.some((x) => x.type === 'appbar');
  const base = opts.baseUrl ?? '';
  const pwa =
    opts.mode === 'published'
      ? `<link rel="manifest" href="${base}/manifest.webmanifest"><link rel="icon" href="${base}/icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="${base}/icon.svg">`
      : '';
  const sw = opts.mode === 'published' ? `if('serviceWorker' in navigator){navigator.serviceWorker.register('${base}/sw.js',{scope:'${base}/'}).catch(function(){})}` : '';
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(b.tagline || b.name)}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(b.tagline)}">
<meta name="theme-color" content="${esc(project.theme.primary)}">${pwa}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${esc(fontsHref(project.theme))}">
<style>${renderCss(project.theme)}</style>
</head><body class="${hasAppbar ? 'has-appbar' : ''}">
${renderBody(project, page, opts)}
<script>${FORM_SCRIPT}${sw}</script>
</body></html>`;
}

/* ---------------- editor canvas ---------------- */

const EDITOR_CSS = `.awb{position:relative;outline:2px solid transparent;outline-offset:-2px;transition:outline-color .12s}
.awb:hover{outline-color:rgba(99,102,241,.55)}.awb.sel{outline-color:#6366f1}
.awb-bar{position:absolute;top:8px;right:8px;display:none;gap:2px;background:#111827;border-radius:8px;padding:3px;z-index:60;box-shadow:0 6px 20px rgba(0,0,0,.25)}
.awb:hover>.awb-bar,.awb.sel>.awb-bar{display:flex}
.awb-bar button{all:unset;cursor:pointer;color:#e5e7eb;font:600 12px system-ui;padding:5px 8px;border-radius:6px}.awb-bar button:hover{background:#374151;color:#fff}
.awb-tag{position:absolute;top:8px;left:8px;display:none;background:#6366f1;color:#fff;font:600 11px system-ui;padding:3px 8px;border-radius:6px;z-index:60;pointer-events:none}
.awb.sel>.awb-tag,.awb:hover>.awb-tag{display:block}
.awb .appbar{position:sticky}.awb-empty{padding:80px 20px;text-align:center;color:#64748b;font:15px system-ui;border:2px dashed #cbd5e1;margin:24px;border-radius:16px}
.nav.sticky{position:relative}
.awb-preview .awb{outline:none!important}.awb-preview .awb-bar,.awb-preview .awb-tag{display:none!important}`;

const EDITOR_SCRIPT = `(function(){
var root=document.getElementById('awb-root'),st=document.getElementById('awb-theme'),fl=document.getElementById('awb-fonts');
function post(m){parent.postMessage(Object.assign({source:'awb-canvas'},m),'*')}
function mark(id){document.querySelectorAll('.awb.sel').forEach(function(e){e.classList.remove('sel')});if(id){var el=document.querySelector('.awb[data-id="'+id+'"]');if(el){el.classList.add('sel');}}}
window.addEventListener('message',function(e){var d=e.data||{};if(d.source!=='awb-editor')return;
if(d.type==='render'){var y=window.scrollY;document.documentElement.classList.toggle('awb-preview',!!d.preview);st.textContent=d.css;if(fl.getAttribute('href')!==d.fonts)fl.setAttribute('href',d.fonts);root.innerHTML=d.html;document.body.className=d.bodyClass||'';mark(d.selectedId);window.scrollTo(0,y);}
if(d.type==='scrollTo'){var tg=document.getElementById(d.anchor);if(tg)tg.scrollIntoView({behavior:'smooth'});else window.scrollTo(0,0);}
if(d.type==='select'){mark(d.id);if(d.scroll){var el=document.querySelector('.awb[data-id="'+d.id+'"]');if(el)el.scrollIntoView({behavior:'smooth',block:'center'});}}});
document.addEventListener('click',function(e){var t=e.target;var btn=t.closest('[data-awb-act]');if(btn){e.preventDefault();e.stopPropagation();post({type:'action',action:btn.getAttribute('data-awb-act'),id:btn.closest('.awb').getAttribute('data-id')});return;}
var pv=document.documentElement.classList.contains('awb-preview');
var a=t.closest('a');if(a){e.preventDefault();var h=a.getAttribute('href')||'';if(h.indexOf('#awb-page:')===0){var parts=h.slice(10).split(':');post({type:'navigate',slug:parts[0],anchor:parts[1]||''});return;}if(pv&&h.charAt(0)==='#'&&h.length>1){var tg=document.getElementById(h.slice(1));if(tg)tg.scrollIntoView({behavior:'smooth'});return;}if(pv&&/^https?:|^tel:|^mailto:/.test(h)){window.open(h,'_blank');return;}}
var lbl=t.closest('label[for="nav-t"]');if(lbl||pv)return;
var blk=t.closest('.awb');if(blk){post({type:'select',id:blk.getAttribute('data-id')});}else{post({type:'select',id:null});}},true);
document.addEventListener('submit',function(e){e.preventDefault();e.stopPropagation();var f=e.target;if(!document.documentElement.classList.contains('awb-preview')||!f.hasAttribute('data-awb-form'))return;var d=Object.fromEntries(new FormData(f).entries());if(d.website)return;d.page=f.getAttribute('data-page');post({type:'lead',data:d});f.reset();var m=f.querySelector('.form-msg');if(m)m.textContent='Thank you! We will get back to you soon.';},true);
document.addEventListener('keydown',function(e){var k=e.key,m=e.ctrlKey||e.metaKey;if((m&&/^[zys]$/i.test(k))||k==='Delete'||k==='Backspace'||k==='Escape'){if(/^(INPUT|TEXTAREA)$/.test(e.target.tagName))return;e.preventDefault();post({type:'key',key:k,mod:m,shift:e.shiftKey});}});
post({type:'ready'});})();`;

/** The static iframe document. Content is pushed in via postMessage to avoid reloads. */
export function editorShell(): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com"><link id="awb-fonts" rel="stylesheet" href="">
<style id="awb-theme"></style><style>${EDITOR_CSS}</style></head><body><div id="awb-root"></div><script>${EDITOR_SCRIPT}</script></body></html>`;
}

export function renderEditorPayload(project: Project, page: Page, labels: Record<string, string>, preview = false) {
  const html = page.blocks.length
    ? renderBody(project, page, { mode: 'editor' }, (inner, b) =>
        `<div class="awb" data-id="${b.id}"><span class="awb-tag">${esc(labels[b.type] ?? b.type)}</span><div class="awb-bar"><button data-awb-act="up" title="Move up">↑</button><button data-awb-act="down" title="Move down">↓</button><button data-awb-act="duplicate" title="Duplicate">Copy</button><button data-awb-act="delete" title="Delete">Delete</button></div>${inner}</div>`,
      )
    : `<div class="awb-empty">This page is empty. Add a section from the left panel.</div>`;
  return {
    html,
    css: renderCss(project.theme),
    fonts: fontsHref(project.theme),
    bodyClass: page.blocks.some((x) => x.type === 'appbar') ? 'has-appbar' : '',
    preview,
  };
}

export function findPage(project: Project, slug: string): Page | undefined {
  return project.pages.find((p) => p.slug === slug);
}
