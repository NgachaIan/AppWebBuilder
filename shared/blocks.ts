import type { BlockDefinition, BlockType, Field, Props } from './types';

/** Lightweight SVG placeholder so templates look finished without external image hosts. */
export function placeholderImage(label: string, from = '#0f766e', to = '#f59e0b', w = 1200, h = 800): string {
  const safe = label.replace(/[<>&"']/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="100%" height="100%" fill="url(#g)"/>
<circle cx="${w * 0.8}" cy="${h * 0.2}" r="${h * 0.35}" fill="#fff" fill-opacity=".08"/>
<circle cx="${w * 0.15}" cy="${h * 0.9}" r="${h * 0.3}" fill="#000" fill-opacity=".06"/>
<text x="50%" y="52%" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="${Math.round(h / 12)}" font-weight="600" fill="#fff" fill-opacity=".92">${safe}</text>
</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

const alignField: Field = {
  key: 'align',
  label: 'Alignment',
  type: 'select',
  options: [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
  ],
};

const heading = (def = ''): Field => ({ key: 'heading', label: 'Heading', type: 'text', placeholder: def });
const subheading: Field = { key: 'subheading', label: 'Subheading', type: 'textarea' };

export const BLOCKS: Record<BlockType, BlockDefinition> = {
  navbar: {
    type: 'navbar',
    label: 'Navigation bar',
    description: 'Logo, menu links and a call-to-action button',
    category: 'Layout',
    icon: 'PanelTop',
    fields: [
      { key: 'logoText', label: 'Logo text', type: 'text', help: 'Leave blank to use your business name' },
      { key: 'logoImage', label: 'Logo image', type: 'image' },
      {
        key: 'links',
        label: 'Menu links',
        type: 'list',
        itemLabel: 'label',
        newItem: { label: 'New link', link: 'page:' },
        itemFields: [
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'link', label: 'Goes to', type: 'link' },
        ],
      },
      { key: 'ctaLabel', label: 'Button label', type: 'text' },
      { key: 'ctaLink', label: 'Button goes to', type: 'link' },
      { key: 'sticky', label: 'Stick to top when scrolling', type: 'toggle' },
    ],
    defaults: () => ({
      logoText: '',
      logoImage: '',
      links: [
        { label: 'Home', link: 'page:' },
        { label: 'Contact', link: '#contact' },
      ],
      ctaLabel: 'Chat on WhatsApp',
      ctaLink: 'whatsapp',
      sticky: true,
    }),
  },

  hero: {
    type: 'hero',
    label: 'Hero banner',
    description: 'Big headline with buttons and an image',
    category: 'Layout',
    icon: 'Sparkles',
    fields: [
      {
        key: 'layout',
        label: 'Layout',
        type: 'select',
        options: [
          { value: 'split', label: 'Text + image side by side' },
          { value: 'center', label: 'Centered text' },
          { value: 'cover', label: 'Text over image' },
        ],
      },
      { key: 'eyebrow', label: 'Small label above title', type: 'text' },
      { key: 'title', label: 'Title', type: 'textarea' },
      { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
      { key: 'primaryLabel', label: 'Main button label', type: 'text' },
      { key: 'primaryLink', label: 'Main button goes to', type: 'link' },
      { key: 'secondaryLabel', label: 'Second button label', type: 'text' },
      { key: 'secondaryLink', label: 'Second button goes to', type: 'link' },
      { key: 'image', label: 'Image', type: 'image' },
    ],
    defaults: () => ({
      layout: 'split',
      eyebrow: 'Welcome',
      title: 'Your business, online in minutes',
      subtitle: 'Tell customers what you do, where to find you and how to pay.',
      primaryLabel: 'Order on WhatsApp',
      primaryLink: 'whatsapp',
      secondaryLabel: 'Call us',
      secondaryLink: 'call',
      image: placeholderImage('Your photo here'),
    }),
  },

  text: {
    type: 'text',
    label: 'Text section',
    description: 'A heading and paragraphs of text',
    category: 'Content',
    icon: 'Type',
    fields: [heading(), { key: 'body', label: 'Text', type: 'textarea', help: 'Leave a blank line between paragraphs' }, alignField],
    defaults: () => ({
      heading: 'About us',
      body: 'Share your story here. Who you are, what you sell and why customers love coming back.\n\nKeep it short and friendly.',
      align: 'left',
    }),
  },

  image: {
    type: 'image',
    label: 'Image',
    description: 'A single photo with an optional caption',
    category: 'Content',
    icon: 'Image',
    fields: [
      { key: 'src', label: 'Image', type: 'image' },
      { key: 'caption', label: 'Caption', type: 'text' },
      {
        key: 'width',
        label: 'Width',
        type: 'select',
        options: [
          { value: 'contained', label: 'Contained' },
          { value: 'full', label: 'Full width' },
        ],
      },
    ],
    defaults: () => ({ src: placeholderImage('Image', '#334155', '#64748b'), caption: '', width: 'contained' }),
  },

  features: {
    type: 'features',
    label: 'Features / services',
    description: 'Grid of services or selling points',
    category: 'Content',
    icon: 'LayoutGrid',
    fields: [
      heading(),
      subheading,
      {
        key: 'columns',
        label: 'Columns',
        type: 'select',
        options: [
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
        ],
      },
      {
        key: 'items',
        label: 'Items',
        type: 'list',
        itemLabel: 'title',
        newItem: { title: 'New item', text: 'Describe it in one or two lines.' },
        itemFields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'text', label: 'Description', type: 'textarea' },
        ],
      },
    ],
    defaults: () => ({
      heading: 'What we offer',
      subheading: '',
      columns: '3',
      items: [
        { title: 'Quality', text: 'We only stock products we would use ourselves.' },
        { title: 'Fast delivery', text: 'Same-day delivery within town.' },
        { title: 'Pay with M-Pesa', text: 'Simple, secure mobile payments.' },
      ],
    }),
  },

  products: {
    type: 'products',
    label: 'Products / menu',
    description: 'Items with prices and an order button',
    category: 'Business',
    icon: 'ShoppingBag',
    fields: [
      heading(),
      subheading,
      { key: 'currency', label: 'Currency', type: 'text' },
      {
        key: 'orderVia',
        label: 'Order button',
        type: 'select',
        options: [
          { value: 'whatsapp', label: 'Order on WhatsApp' },
          { value: 'call', label: 'Call to order' },
          { value: 'none', label: 'No button' },
        ],
      },
      { key: 'buttonLabel', label: 'WhatsApp button label', type: 'text', placeholder: 'Order', help: 'e.g. Order, Book, Enquire, Join' },
      { key: 'showImages', label: 'Show item images', type: 'toggle' },
      {
        key: 'items',
        label: 'Items',
        type: 'list',
        itemLabel: 'name',
        newItem: { name: 'New item', description: '', price: '0', image: '' },
        itemFields: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'price', label: 'Price', type: 'text' },
          { key: 'image', label: 'Image', type: 'image' },
        ],
      },
    ],
    defaults: () => ({
      heading: 'Our products',
      subheading: 'Prices include VAT.',
      currency: 'KES',
      orderVia: 'whatsapp',
      buttonLabel: 'Order',
      showImages: true,
      items: [
        { name: 'Product one', description: 'Short description', price: '500', image: placeholderImage('Product 1', '#0f766e', '#14b8a6', 800, 600) },
        { name: 'Product two', description: 'Short description', price: '1,200', image: placeholderImage('Product 2', '#9333ea', '#f472b6', 800, 600) },
        { name: 'Product three', description: 'Short description', price: '2,500', image: placeholderImage('Product 3', '#ea580c', '#facc15', 800, 600) },
      ],
    }),
  },

  gallery: {
    type: 'gallery',
    label: 'Photo gallery',
    description: 'Grid of photos',
    category: 'Content',
    icon: 'Images',
    fields: [
      heading(),
      {
        key: 'items',
        label: 'Photos',
        type: 'list',
        itemLabel: 'caption',
        newItem: { src: placeholderImage('Photo', '#475569', '#94a3b8', 800, 800), caption: '' },
        itemFields: [
          { key: 'src', label: 'Image', type: 'image' },
          { key: 'caption', label: 'Caption', type: 'text' },
        ],
      },
    ],
    defaults: () => ({
      anchor: 'gallery',
      heading: 'Gallery',
      items: [1, 2, 3, 4, 5, 6].map((n) => ({
        src: placeholderImage(`Photo ${n}`, ['#0f766e', '#7c3aed', '#db2777', '#ea580c', '#2563eb', '#16a34a'][n - 1], '#1e293b', 800, 800),
        caption: '',
      })),
    }),
  },

  testimonials: {
    type: 'testimonials',
    label: 'Customer reviews',
    description: 'Quotes from real customers',
    category: 'Business',
    icon: 'Quote',
    fields: [
      heading(),
      {
        key: 'items',
        label: 'Reviews',
        type: 'list',
        itemLabel: 'name',
        newItem: { quote: 'Paste a real customer quote here.', name: 'Customer name', role: '' },
        itemFields: [
          { key: 'quote', label: 'Quote', type: 'textarea' },
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'role', label: 'Detail (e.g. town)', type: 'text' },
        ],
      },
    ],
    defaults: () => ({
      heading: 'What customers say',
      items: [
        { quote: 'Replace this with a real quote from one of your customers.', name: 'Customer name', role: 'Town' },
        { quote: 'Ask happy customers if you can share their words here.', name: 'Customer name', role: 'Town' },
      ],
    }),
  },

  hours: {
    type: 'hours',
    label: 'Opening hours',
    description: 'When customers can visit or call',
    category: 'Business',
    icon: 'Clock',
    fields: [
      heading(),
      {
        key: 'items',
        label: 'Days',
        type: 'list',
        itemLabel: 'day',
        newItem: { day: 'Day', time: '8:00am – 6:00pm' },
        itemFields: [
          { key: 'day', label: 'Day(s)', type: 'text' },
          { key: 'time', label: 'Hours', type: 'text' },
        ],
      },
      { key: 'note', label: 'Note', type: 'text' },
    ],
    defaults: () => ({
      heading: 'Opening hours',
      items: [
        { day: 'Monday – Friday', time: '8:00am – 6:00pm' },
        { day: 'Saturday', time: '9:00am – 4:00pm' },
        { day: 'Sunday & public holidays', time: 'Closed' },
      ],
      note: '',
    }),
  },

  faq: {
    type: 'faq',
    label: 'FAQ',
    description: 'Questions customers often ask',
    category: 'Content',
    icon: 'CircleHelp',
    fields: [
      heading(),
      {
        key: 'items',
        label: 'Questions',
        type: 'list',
        itemLabel: 'q',
        newItem: { q: 'New question?', a: 'The answer.' },
        itemFields: [
          { key: 'q', label: 'Question', type: 'text' },
          { key: 'a', label: 'Answer', type: 'textarea' },
        ],
      },
    ],
    defaults: () => ({
      heading: 'Frequently asked questions',
      items: [
        { q: 'Do you deliver?', a: 'Yes. Delivery within town is free for orders above KES 2,000.' },
        { q: 'How do I pay?', a: 'We accept M-Pesa and cash on delivery.' },
      ],
    }),
  },

  cta: {
    type: 'cta',
    label: 'Call to action',
    description: 'A bold banner with one button',
    category: 'Layout',
    icon: 'Megaphone',
    fields: [
      heading(),
      { key: 'text', label: 'Text', type: 'textarea' },
      { key: 'buttonLabel', label: 'Button label', type: 'text' },
      { key: 'buttonLink', label: 'Button goes to', type: 'link' },
      {
        key: 'style',
        label: 'Style',
        type: 'select',
        options: [
          { value: 'primary', label: 'Brand colour' },
          { value: 'dark', label: 'Dark' },
          { value: 'light', label: 'Light' },
        ],
      },
    ],
    defaults: () => ({
      heading: 'Ready to order?',
      text: 'Send us a message and we will get back to you within the hour.',
      buttonLabel: 'Chat on WhatsApp',
      buttonLink: 'whatsapp',
      style: 'primary',
    }),
  },

  contact: {
    type: 'contact',
    label: 'Contact & payment',
    description: 'Phone, WhatsApp, M-Pesa, map and a message form',
    category: 'Business',
    icon: 'Phone',
    fields: [
      heading(),
      { key: 'text', label: 'Intro text', type: 'textarea' },
      { key: 'showForm', label: 'Show message form', type: 'toggle', help: 'Messages arrive in your dashboard inbox' },
      { key: 'showMpesa', label: 'Show M-Pesa payment details', type: 'toggle' },
      { key: 'showMap', label: 'Show map of your location', type: 'toggle' },
    ],
    defaults: () => ({
      heading: 'Get in touch',
      text: 'Call, WhatsApp or send us a message. We reply fast.',
      showForm: true,
      showMpesa: true,
      showMap: false,
      anchor: 'contact',
    }),
  },

  footer: {
    type: 'footer',
    label: 'Footer',
    description: 'Copyright and social links',
    category: 'Layout',
    icon: 'PanelBottom',
    fields: [
      { key: 'text', label: 'Footer text', type: 'text', help: 'Leave blank for "© year Business name"' },
      { key: 'facebook', label: 'Facebook URL', type: 'text' },
      { key: 'instagram', label: 'Instagram URL', type: 'text' },
      { key: 'tiktok', label: 'TikTok URL', type: 'text' },
      { key: 'x', label: 'X (Twitter) URL', type: 'text' },
    ],
    defaults: () => ({ text: '', facebook: '', instagram: '', tiktok: '', x: '' }),
  },

  appbar: {
    type: 'appbar',
    label: 'App tab bar',
    description: 'Bottom navigation that makes your site feel like a phone app',
    category: 'App',
    icon: 'Smartphone',
    fields: [
      {
        key: 'items',
        label: 'Tabs',
        type: 'list',
        itemLabel: 'label',
        newItem: { label: 'Tab', link: 'page:', icon: 'home' },
        itemFields: [
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'link', label: 'Goes to', type: 'link' },
          {
            key: 'icon',
            label: 'Icon',
            type: 'select',
            options: ['home', 'shop', 'cart', 'info', 'phone', 'chat', 'calendar', 'user'].map((v) => ({ value: v, label: v })),
          },
        ],
      },
    ],
    defaults: () => ({
      items: [
        { label: 'Home', link: 'page:', icon: 'home' },
        { label: 'Shop', link: 'page:shop', icon: 'shop' },
        { label: 'Chat', link: 'whatsapp', icon: 'chat' },
        { label: 'Contact', link: '#contact', icon: 'phone' },
      ],
    }),
  },
};

export const BLOCK_CATEGORIES: BlockDefinition['category'][] = ['Layout', 'Content', 'Business', 'App'];

export function defaultProps(type: BlockType): Props {
  return BLOCKS[type].defaults();
}
