import { BLOCKS, placeholderImage } from './blocks';
import type { Block, BlockType, Business, Page, Project, ProjectKind, Props, Theme } from './types';

export function uid(prefix = ''): string {
  const rnd = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  return prefix ? `${prefix}_${rnd}` : rnd;
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'site'
  );
}

export function block(type: BlockType, overrides: Props = {}): Block {
  return { id: uid('b'), type, props: { ...BLOCKS[type].defaults(), ...overrides } };
}

function page(name: string, slug: string, blocks: Block[]): Page {
  return { id: uid('p'), name, slug, blocks };
}

export const FONTS = [
  { value: 'Inter', label: 'Inter (clean)' },
  { value: 'Poppins', label: 'Poppins (friendly)' },
  { value: 'DM Sans', label: 'DM Sans (modern)' },
  { value: 'Playfair Display', label: 'Playfair Display (elegant)' },
  { value: 'Lora', label: 'Lora (classic)' },
  { value: 'Space Grotesk', label: 'Space Grotesk (techy)' },
  { value: 'Nunito', label: 'Nunito (soft)' },
];

export const THEME_PRESETS: { id: string; name: string; theme: Theme }[] = [
  { id: 'savanna', name: 'Savanna', theme: { primary: '#0f766e', accent: '#f59e0b', background: '#ffffff', surface: '#f1f5f4', text: '#0f172a', font: 'Inter', headingFont: 'Poppins', radius: 14 } },
  { id: 'sunset', name: 'Sunset', theme: { primary: '#c2410c', accent: '#facc15', background: '#fffaf5', surface: '#fdeedc', text: '#1c1917', font: 'DM Sans', headingFont: 'Playfair Display', radius: 10 } },
  { id: 'blush', name: 'Blush', theme: { primary: '#be185d', accent: '#a78bfa', background: '#fffafc', surface: '#fbe7f0', text: '#1f1720', font: 'Nunito', headingFont: 'Playfair Display', radius: 20 } },
  { id: 'ocean', name: 'Ocean', theme: { primary: '#1d4ed8', accent: '#06b6d4', background: '#ffffff', surface: '#eef2ff', text: '#0b1220', font: 'Inter', headingFont: 'Space Grotesk', radius: 8 } },
  { id: 'forest', name: 'Forest', theme: { primary: '#166534', accent: '#ca8a04', background: '#fbfdf8', surface: '#ecf3e6', text: '#14210f', font: 'Lora', headingFont: 'Lora', radius: 6 } },
  { id: 'gold', name: 'Gold', theme: { primary: '#8a6a2f', accent: '#1f4e5f', background: '#fbf8f2', surface: '#f2ebdd', text: '#1d1a14', font: 'DM Sans', headingFont: 'Playfair Display', radius: 4 } },
  { id: 'energy', name: 'Energy', theme: { primary: '#f97316', accent: '#38bdf8', background: '#0d1117', surface: '#161b24', text: '#e6e9ef', font: 'Inter', headingFont: 'Space Grotesk', radius: 10 } },
  { id: 'scholar', name: 'Scholar', theme: { primary: '#1e3a8a', accent: '#eab308', background: '#ffffff', surface: '#f1f4fb', text: '#0f172a', font: 'Nunito', headingFont: 'Poppins', radius: 12 } },
  { id: 'chapel', name: 'Chapel', theme: { primary: '#6b21a8', accent: '#d4a017', background: '#fdfbff', surface: '#f3ecf9', text: '#1e1427', font: 'Lora', headingFont: 'Lora', radius: 8 } },
  { id: 'care', name: 'Care', theme: { primary: '#0e7490', accent: '#22c55e', background: '#ffffff', surface: '#ecf7f9', text: '#0b2530', font: 'Nunito', headingFont: 'DM Sans', radius: 16 } },
  { id: 'motor', name: 'Motor', theme: { primary: '#dc2626', accent: '#f59e0b', background: '#fafafa', surface: '#eeeeee', text: '#111111', font: 'Inter', headingFont: 'Space Grotesk', radius: 4 } },
  { id: 'ink', name: 'Ink', theme: { primary: '#18181b', accent: '#6366f1', background: '#fafaf9', surface: '#f0efed', text: '#18181b', font: 'DM Sans', headingFont: 'DM Sans', radius: 12 } },
  { id: 'midnight', name: 'Midnight', theme: { primary: '#a78bfa', accent: '#22d3ee', background: '#0b0f19', surface: '#151b2b', text: '#e5e7eb', font: 'DM Sans', headingFont: 'Space Grotesk', radius: 14 } },
];

const theme = (id: string): Theme => ({ ...THEME_PRESETS.find((t) => t.id === id)!.theme });

const emptyBusiness = (name: string, tagline = ''): Business => ({
  name,
  tagline,
  phone: '',
  whatsapp: '',
  email: '',
  location: '',
  mpesaType: 'none',
  mpesaNumber: '',
  mpesaAccount: '',
  showWhatsappButton: true,
});

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  kind: ProjectKind;
  themeId: string;
  tags: string[];
}

type Built = { theme: Theme; pages: Page[]; tagline: string; kind: ProjectKind };

const nav = (links: { label: string; link: string }[], extra: Props = {}) => block('navbar', { links, ...extra });

const BUILDERS: Record<string, (name: string) => Built> = {
  blank: () => ({
    kind: 'website',
    tagline: '',
    theme: theme('savanna'),
    pages: [
      page('Home', '', [
        nav([{ label: 'Home', link: 'page:' }, { label: 'Contact', link: '#contact' }]),
        block('hero', { layout: 'center', eyebrow: '', title: 'Start building your site', subtitle: 'Click any section to edit it, or add new sections from the left panel.' }),
        block('contact'),
        block('footer'),
      ]),
    ],
  }),

  restaurant: (name) => ({
    kind: 'website',
    tagline: 'Home-style meals, made fresh daily',
    theme: theme('sunset'),
    pages: [
      page('Home', '', [
        nav([{ label: 'Home', link: 'page:' }, { label: 'Menu', link: 'page:menu' }, { label: 'Visit', link: '#contact' }], { ctaLabel: 'Order now' }),
        block('hero', {
          layout: 'cover',
          eyebrow: 'Open today',
          title: `Fresh food, warm welcome at ${name}`,
          subtitle: 'Pilau, nyama choma, chapati and more — eat in, take away or get it delivered.',
          primaryLabel: 'See the menu',
          primaryLink: 'page:menu',
          secondaryLabel: 'Order on WhatsApp',
          secondaryLink: 'whatsapp',
          image: placeholderImage('', '#7c2d12', '#f59e0b'),
        }),
        block('features', {
          heading: 'Why people keep coming back',
          items: [
            { title: 'Cooked fresh', text: 'Everything is prepared the same day.' },
            { title: 'Fast delivery', text: 'Hot food to your door, usually within 45 minutes.' },
            { title: 'Fair prices', text: 'Generous portions that fit your budget.' },
          ],
        }),
        block('products', {
          heading: "Today's favourites",
          subheading: '',
          items: [
            { name: 'Beef pilau', description: 'With kachumbari', price: '450', image: placeholderImage('Pilau', '#92400e', '#fbbf24', 800, 600) },
            { name: 'Nyama choma (½ kg)', description: 'Served with ugali', price: '900', image: placeholderImage('Nyama choma', '#7f1d1d', '#f97316', 800, 600) },
            { name: 'Chapati & beans', description: 'Two chapatis', price: '200', image: placeholderImage('Chapati', '#a16207', '#fde047', 800, 600) },
          ],
        }),
        block('hours', {}),
        block('testimonials', {}),
        block('cta', { heading: 'Hungry?', text: 'Send your order on WhatsApp and we will have it ready.', buttonLabel: 'Order on WhatsApp' }),
        block('contact', { heading: 'Visit or order', showMap: true }),
        block('footer'),
      ]),
      page('Menu', 'menu', [
        nav([{ label: 'Home', link: 'page:' }, { label: 'Menu', link: 'page:menu' }, { label: 'Visit', link: 'page:#contact' }], { ctaLabel: 'Order now' }),
        block('hero', { layout: 'center', eyebrow: 'Menu', title: 'Our full menu', subtitle: 'Prices in KES. Ask us about daily specials.', primaryLabel: 'Order on WhatsApp', secondaryLabel: '' }),
        block('products', {
          heading: 'Mains',
          subheading: '',
          showImages: false,
          items: [
            { name: 'Beef pilau', description: 'With kachumbari', price: '450', image: '' },
            { name: 'Chicken stew & rice', description: '', price: '500', image: '' },
            { name: 'Fish & ugali', description: 'Whole tilapia', price: '750', image: '' },
            { name: 'Githeri', description: 'Vegetarian', price: '250', image: '' },
          ],
        }),
        block('products', {
          heading: 'Drinks',
          subheading: '',
          showImages: false,
          orderVia: 'none',
          items: [
            { name: 'Chai', description: '', price: '50', image: '' },
            { name: 'Fresh juice', description: 'Mango or passion', price: '150', image: '' },
            { name: 'Soda', description: '', price: '80', image: '' },
          ],
        }),
        block('footer'),
      ]),
    ],
  }),

  shop: (name) => ({
    kind: 'website',
    tagline: 'Quality products, delivered',
    theme: theme('savanna'),
    pages: [
      page('Home', '', [
        nav([{ label: 'Home', link: 'page:' }, { label: 'Shop', link: 'page:shop' }, { label: 'Contact', link: '#contact' }]),
        block('hero', {
          layout: 'split',
          eyebrow: 'New stock every week',
          title: `Shop at ${name}`,
          subtitle: 'Order on WhatsApp, pay with M-Pesa, get it delivered the same day.',
          primaryLabel: 'Browse products',
          primaryLink: 'page:shop',
          secondaryLabel: 'Chat with us',
          secondaryLink: 'whatsapp',
          image: placeholderImage('Featured product', '#0f766e', '#f59e0b'),
        }),
        block('products', { heading: 'Best sellers' }),
        block('features', {
          heading: 'Shopping made easy',
          items: [
            { title: 'Order on WhatsApp', text: 'Tap the button, send the message, done.' },
            { title: 'Pay with M-Pesa', text: 'Till and Paybill details are on every page.' },
            { title: 'Same-day delivery', text: 'Orders before 2pm arrive the same day.' },
          ],
        }),
        block('faq'),
        block('contact'),
        block('footer'),
      ]),
      page('Shop', 'shop', [
        nav([{ label: 'Home', link: 'page:' }, { label: 'Shop', link: 'page:shop' }, { label: 'Contact', link: 'page:#contact' }]),
        block('products', {
          heading: 'All products',
          subheading: 'Tap “Order” to send us a WhatsApp message.',
          items: [1, 2, 3, 4, 5, 6].map((n) => ({
            name: `Product ${n}`,
            description: 'Short description',
            price: String(n * 350),
            image: placeholderImage(`Product ${n}`, ['#0f766e', '#7c3aed', '#db2777', '#ea580c', '#2563eb', '#16a34a'][n - 1], '#0f172a', 800, 600),
          })),
        }),
        block('cta', { heading: "Can't find something?", text: 'Ask us — we can source it for you.' }),
        block('footer'),
      ]),
    ],
  }),

  salon: (name) => ({
    kind: 'website',
    tagline: 'Hair, nails and beauty',
    theme: theme('blush'),
    pages: [
      page('Home', '', [
        nav([{ label: 'Services', link: '#services' }, { label: 'Gallery', link: '#gallery' }, { label: 'Book', link: '#contact' }], { ctaLabel: 'Book on WhatsApp' }),
        block('hero', {
          layout: 'split',
          eyebrow: 'Walk-ins welcome',
          title: `Look and feel your best at ${name}`,
          subtitle: 'Braids, cuts, colour, nails and spa treatments by experienced stylists.',
          primaryLabel: 'Book an appointment',
          primaryLink: 'whatsapp',
          secondaryLabel: 'See prices',
          secondaryLink: '#services',
          image: placeholderImage('Salon photo', '#be185d', '#a78bfa'),
        }),
        block('products', {
          anchor: 'services',
          heading: 'Services & prices',
          subheading: 'Prices may vary with hair length.',
          showImages: false,
          items: [
            { name: 'Box braids', description: 'Medium length', price: '3,500', image: '' },
            { name: 'Wash & blow-dry', description: '', price: '800', image: '' },
            { name: 'Gel manicure', description: '', price: '1,200', image: '' },
            { name: 'Facial', description: '60 minutes', price: '2,500', image: '' },
          ],
        }),
        block('gallery', { heading: 'Our work' }),
        block('hours', { items: [{ day: 'Monday – Saturday', time: '8:00am – 8:00pm' }, { day: 'Sunday', time: '10:00am – 5:00pm' }] }),
        block('testimonials'),
        block('contact', { heading: 'Book your visit', showMap: true }),
        block('footer'),
      ]),
    ],
  }),

  services: (name) => ({
    kind: 'website',
    tagline: 'Professional services you can trust',
    theme: theme('ocean'),
    pages: [
      page('Home', '', [
        nav([{ label: 'Services', link: '#services' }, { label: 'About', link: 'page:about' }, { label: 'Contact', link: '#contact' }], { ctaLabel: 'Get a quote', ctaLink: '#contact' }),
        block('hero', {
          layout: 'center',
          eyebrow: name,
          title: 'Reliable help for your home and business',
          subtitle: 'Licensed, insured and on time. Request a free quote today.',
          primaryLabel: 'Request a quote',
          primaryLink: '#contact',
          secondaryLabel: 'Call now',
          secondaryLink: 'call',
        }),
        block('features', {
          anchor: 'services',
          heading: 'Services',
          columns: '3',
          items: [
            { title: 'Consultation', text: 'We assess your needs and recommend the right solution.' },
            { title: 'Installation', text: 'Professional installation by trained technicians.' },
            { title: 'Maintenance', text: 'Scheduled check-ups to keep things running.' },
            { title: 'Repairs', text: 'Fast response when something breaks.' },
            { title: 'Supplies', text: 'Genuine parts at fair prices.' },
            { title: 'Support', text: 'Talk to a real person, 7 days a week.' },
          ],
        }),
        block('cta', { heading: 'Need help today?', text: 'Call or WhatsApp us for a same-day visit.', buttonLabel: 'Call now', buttonLink: 'call', style: 'dark' }),
        block('faq', {
          items: [
            { q: 'Which areas do you cover?', a: 'List the towns or estates you serve here.' },
            { q: 'Do you offer a warranty?', a: 'Describe your warranty or guarantee here.' },
            { q: 'How do I pay?', a: 'M-Pesa, bank transfer or cheque.' },
          ],
        }),
        block('contact', { heading: 'Request a free quote' }),
        block('footer'),
      ]),
      page('About', 'about', [
        nav([{ label: 'Home', link: 'page:' }, { label: 'About', link: 'page:about' }, { label: 'Contact', link: 'page:#contact' }], { ctaLabel: 'Get a quote', ctaLink: 'page:#contact' }),
        block('text', { heading: `About ${name}`, body: 'Tell your story: when you started, who you serve and what makes your team different.\n\nMention qualifications, licences or memberships customers care about.' }),
        block('image', { src: placeholderImage('Our team', '#1d4ed8', '#06b6d4'), caption: 'Our team' }),
        block('footer'),
      ]),
    ],
  }),

  app: (name) => ({
    kind: 'app',
    tagline: 'Shop from your phone',
    theme: theme('midnight'),
    pages: [
      page('Home', '', [
        block('hero', {
          layout: 'center',
          eyebrow: 'Install this app from your browser menu',
          title: name,
          subtitle: 'Browse, order on WhatsApp and pay with M-Pesa — right from your home screen.',
          primaryLabel: 'Start shopping',
          primaryLink: 'page:shop',
          secondaryLabel: '',
        }),
        block('features', {
          heading: '',
          columns: '2',
          items: [
            { title: 'Deals of the day', text: 'New offers every morning.' },
            { title: 'Track your order', text: 'Message us for live updates.' },
          ],
        }),
        block('products', { heading: 'Trending now' }),
        block('appbar'),
      ]),
      page('Shop', 'shop', [
        block('products', {
          heading: 'Shop',
          subheading: '',
          items: [1, 2, 3, 4].map((n) => ({
            name: `Item ${n}`,
            description: 'Short description',
            price: String(n * 400),
            image: placeholderImage(`Item ${n}`, '#4c1d95', '#22d3ee', 800, 600),
          })),
        }),
        block('appbar'),
      ]),
      page('Contact', 'contact', [
        block('contact', { heading: 'Contact us' }),
        block('hours'),
        block('appbar'),
      ]),
    ],
  }),

  guesthouse: (name) => ({
    kind: 'website',
    tagline: 'Comfortable rooms, warm hospitality',
    theme: theme('gold'),
    pages: [
      page('Home', '', [
        nav([{ label: 'Rooms', link: '#rooms' }, { label: 'Gallery', link: '#gallery' }, { label: 'Contact', link: '#contact' }], { ctaLabel: 'Book a room' }),
        block('hero', {
          layout: 'cover',
          eyebrow: 'Book direct for the best rate',
          title: `Stay with us at ${name}`,
          subtitle: 'Quiet rooms, free Wi-Fi, breakfast included and secure parking.',
          primaryLabel: 'See rooms',
          primaryLink: '#rooms',
          secondaryLabel: 'Book on WhatsApp',
          secondaryLink: 'whatsapp',
          image: placeholderImage('', '#5b4320', '#1f4e5f'),
        }),
        block('products', {
          anchor: 'rooms',
          heading: 'Rooms',
          subheading: 'Prices per night, breakfast included.',
          buttonLabel: 'Book',
          items: [
            { name: 'Standard single', description: 'Queen bed, en-suite shower', price: '3,500', image: placeholderImage('Single room', '#8a6a2f', '#d6b97a', 800, 600) },
            { name: 'Deluxe double', description: 'King bed, balcony', price: '5,500', image: placeholderImage('Deluxe room', '#1f4e5f', '#8a6a2f', 800, 600) },
            { name: 'Family suite', description: 'Sleeps four, kitchenette', price: '9,000', image: placeholderImage('Family suite', '#5b4320', '#c9a45c', 800, 600) },
          ],
        }),
        block('features', {
          heading: 'Amenities',
          columns: '4',
          items: [
            { title: 'Free Wi-Fi', text: 'Fast internet in every room.' },
            { title: 'Breakfast', text: 'Served 6:30am – 10:00am.' },
            { title: 'Parking', text: 'Secure, guarded parking.' },
            { title: 'Airport transfer', text: 'Ask us when you book.' },
          ],
        }),
        block('gallery', { heading: 'Take a look around' }),
        block('testimonials'),
        block('faq', {
          items: [
            { q: 'What time is check-in and check-out?', a: 'Check-in from 2:00pm, check-out by 10:30am.' },
            { q: 'How do I pay?', a: 'Pay a deposit by M-Pesa to confirm your booking. The balance is due on arrival.' },
            { q: 'Can I cancel?', a: 'Free cancellation up to 48 hours before arrival.' },
          ],
        }),
        block('contact', { heading: 'Book your stay', showMap: true }),
        block('footer'),
      ]),
    ],
  }),

  gym: (name) => ({
    kind: 'website',
    tagline: 'Train hard, feel strong',
    theme: theme('energy'),
    pages: [
      page('Home', '', [
        nav([{ label: 'Classes', link: '#classes' }, { label: 'Plans', link: '#plans' }, { label: 'Contact', link: '#contact' }], { ctaLabel: 'Join now', ctaLink: '#plans' }),
        block('hero', {
          layout: 'split',
          eyebrow: 'First session free',
          title: `Get fit at ${name}`,
          subtitle: 'Modern equipment, qualified trainers and classes for every level.',
          primaryLabel: 'See membership plans',
          primaryLink: '#plans',
          secondaryLabel: 'Book a free session',
          secondaryLink: 'whatsapp',
          image: placeholderImage('Training floor', '#f97316', '#0d1117'),
        }),
        block('features', {
          anchor: 'classes',
          heading: 'Classes',
          columns: '3',
          items: [
            { title: 'HIIT', text: 'Fast, high-intensity circuits. Mon, Wed, Fri 6:00am.' },
            { title: 'Spinning', text: 'Indoor cycling to great music. Tue & Thu 6:30pm.' },
            { title: 'Aerobics & Zumba', text: 'Dance your way fit. Saturday 9:00am.' },
            { title: 'Strength', text: 'Coached weightlifting for beginners and up.' },
            { title: 'Boxing', text: 'Pads, bags and conditioning.' },
            { title: 'Personal training', text: 'One-on-one plans built around your goals.' },
          ],
        }),
        block('products', {
          anchor: 'plans',
          heading: 'Membership plans',
          subheading: '',
          showImages: false,
          buttonLabel: 'Join',
          items: [
            { name: 'Day pass', description: 'Full gym access for one day', price: '500', image: '' },
            { name: 'Monthly', description: 'Unlimited gym and classes', price: '4,000', image: '' },
            { name: 'Quarterly', description: 'Three months, save 15%', price: '10,200', image: '' },
            { name: 'Personal training (10 sessions)', description: 'With a certified coach', price: '15,000', image: '' },
          ],
        }),
        block('hours', { items: [{ day: 'Monday – Friday', time: '5:00am – 10:00pm' }, { day: 'Saturday', time: '7:00am – 6:00pm' }, { day: 'Sunday', time: '8:00am – 2:00pm' }] }),
        block('testimonials'),
        block('cta', { heading: 'Your first session is on us', text: 'Message us to book a free session with a trainer.', buttonLabel: 'Book on WhatsApp' }),
        block('contact', { showMap: true }),
        block('footer'),
      ]),
    ],
  }),

  school: (name) => ({
    kind: 'website',
    tagline: 'Learning that builds bright futures',
    theme: theme('scholar'),
    pages: [
      page('Home', '', [
        nav([{ label: 'Programmes', link: '#programmes' }, { label: 'About', link: 'page:about' }, { label: 'Admissions', link: '#contact' }], { ctaLabel: 'Enquire', ctaLink: '#contact' }),
        block('hero', {
          layout: 'split',
          eyebrow: 'Admissions open',
          title: `Welcome to ${name}`,
          subtitle: 'Small classes, caring teachers and strong results.',
          primaryLabel: 'Apply now',
          primaryLink: '#contact',
          secondaryLabel: 'Talk to us',
          secondaryLink: 'whatsapp',
          image: placeholderImage('Our classroom', '#1e3a8a', '#eab308'),
        }),
        block('features', {
          anchor: 'programmes',
          heading: 'Programmes',
          items: [
            { title: 'Pre-primary', text: 'Play-based learning for ages 4 – 5.' },
            { title: 'Primary & junior school', text: 'Strong foundations in literacy, numeracy and science.' },
            { title: 'Holiday tuition', text: 'Revision classes and exam preparation.' },
          ],
        }),
        block('products', {
          heading: 'Fees per term',
          subheading: 'Lunch and transport are charged separately.',
          showImages: false,
          buttonLabel: 'Enquire',
          items: [
            { name: 'Pre-primary', description: 'PP1 – PP2', price: '18,000', image: '' },
            { name: 'Lower primary', description: 'Grades 1 – 3', price: '22,000', image: '' },
            { name: 'Upper primary', description: 'Grades 4 – 6', price: '25,000', image: '' },
            { name: 'Holiday tuition', description: 'Per subject, two weeks', price: '3,000', image: '' },
          ],
        }),
        block('testimonials', { heading: 'What parents say' }),
        block('faq', {
          heading: 'Admissions questions',
          items: [
            { q: 'When can my child join?', a: 'We admit at the start of each term, subject to space.' },
            { q: 'Do you offer transport?', a: 'Yes, school buses cover the main estates. Ask us for routes.' },
            { q: 'How do I pay fees?', a: 'Fees are paid by M-Pesa Paybill using your child’s admission number.' },
          ],
        }),
        block('contact', { heading: 'Book a school visit' }),
        block('footer'),
      ]),
      page('About', 'about', [
        nav([{ label: 'Home', link: 'page:' }, { label: 'About', link: 'page:about' }, { label: 'Admissions', link: 'page:#contact' }], { ctaLabel: 'Enquire', ctaLink: 'page:#contact' }),
        block('text', { heading: `About ${name}`, body: 'Share your school’s story, mission and values.\n\nMention your curriculum, results, facilities and co-curricular activities.' }),
        block('gallery', { heading: 'School life' }),
        block('footer'),
      ]),
    ],
  }),

  church: (name) => ({
    kind: 'website',
    tagline: 'A welcoming family of faith',
    theme: theme('chapel'),
    pages: [
      page('Home', '', [
        nav([{ label: 'Services', link: '#services' }, { label: 'Ministries', link: '#ministries' }, { label: 'Give', link: '#contact' }], { ctaLabel: 'Plan a visit', ctaLink: '#contact' }),
        block('hero', {
          layout: 'cover',
          eyebrow: 'Everyone is welcome',
          title: name,
          subtitle: 'Join us this Sunday for worship, the Word and fellowship.',
          primaryLabel: 'Service times',
          primaryLink: '#services',
          secondaryLabel: 'Watch online',
          secondaryLink: 'https://youtube.com',
          image: placeholderImage('', '#3b0764', '#d4a017'),
        }),
        block('hours', {
          anchor: 'services',
          heading: 'Service times',
          items: [
            { day: 'Sunday first service', time: '8:00am – 10:00am' },
            { day: 'Sunday second service', time: '10:30am – 12:30pm' },
            { day: 'Wednesday Bible study', time: '6:00pm – 7:30pm' },
            { day: 'Friday youth fellowship', time: '5:30pm – 7:00pm' },
          ],
        }),
        block('features', {
          anchor: 'ministries',
          heading: 'Ministries',
          columns: '3',
          items: [
            { title: 'Children', text: 'Sunday school for ages 3 – 12.' },
            { title: 'Youth', text: 'Fellowship, mentorship and fun for teens and young adults.' },
            { title: 'Women & men', text: 'Monthly fellowships and prayer groups.' },
            { title: 'Choir & worship', text: 'Join the praise team.' },
            { title: 'Outreach', text: 'Serving our neighbours through community projects.' },
            { title: 'Counselling', text: 'Pastoral care and pre-marital counselling.' },
          ],
        }),
        block('gallery', { heading: 'Church life' }),
        block('text', { heading: 'Our story', body: 'Tell visitors how the church began, what you believe and what to expect on their first visit.', align: 'center' }),
        block('contact', { heading: 'Visit or give', text: 'Find us, get in touch, or give your tithes and offerings by M-Pesa.', showMap: true }),
        block('footer'),
      ]),
    ],
  }),

  property: (name) => ({
    kind: 'website',
    tagline: 'Homes and spaces to rent and buy',
    theme: theme('ocean'),
    pages: [
      page('Home', '', [
        nav([{ label: 'Listings', link: 'page:listings' }, { label: 'Why us', link: '#why' }, { label: 'Contact', link: '#contact' }], { ctaLabel: 'Book a viewing' }),
        block('hero', {
          layout: 'split',
          eyebrow: 'New listings every week',
          title: 'Find your next home',
          subtitle: `${name} helps you rent or buy apartments, houses and commercial space, with no hidden fees.`,
          primaryLabel: 'Browse listings',
          primaryLink: 'page:listings',
          secondaryLabel: 'Book a viewing',
          secondaryLink: 'whatsapp',
          image: placeholderImage('Featured home', '#1d4ed8', '#06b6d4'),
        }),
        block('products', {
          heading: 'Featured listings',
          subheading: '',
          currency: 'KES',
          buttonLabel: 'Enquire',
          items: [
            { name: '2-bedroom apartment, Kilimani', description: 'Per month · lift, borehole, parking', price: '65,000', image: placeholderImage('2BR Kilimani', '#1e40af', '#38bdf8', 800, 600) },
            { name: 'Bedsitter, Ruaka', description: 'Per month · near the main road', price: '12,000', image: placeholderImage('Bedsitter Ruaka', '#0f766e', '#5eead4', 800, 600) },
            { name: '4-bedroom house, Syokimau', description: 'For sale · gated community', price: '14,500,000', image: placeholderImage('4BR Syokimau', '#334155', '#94a3b8', 800, 600) },
          ],
        }),
        block('features', {
          anchor: 'why',
          heading: 'Why rent or buy with us',
          items: [
            { title: 'Verified listings', text: 'We visit every property before it goes online.' },
            { title: 'No viewing fees', text: 'Book as many viewings as you need.' },
            { title: 'Help with paperwork', text: 'Lease agreements, title searches and transfers.' },
          ],
        }),
        block('testimonials'),
        block('contact', { heading: 'Book a viewing' }),
        block('footer'),
      ]),
      page('Listings', 'listings', [
        nav([{ label: 'Home', link: 'page:' }, { label: 'Listings', link: 'page:listings' }, { label: 'Contact', link: 'page:#contact' }], { ctaLabel: 'Book a viewing' }),
        block('products', {
          heading: 'To let',
          subheading: 'Monthly rent in KES.',
          buttonLabel: 'Enquire',
          items: [1, 2, 3].map((n) => ({ name: `Apartment ${n}`, description: 'Location · bedrooms · key features', price: String(15000 * n), image: placeholderImage(`To let ${n}`, '#1d4ed8', '#0f172a', 800, 600) })),
        }),
        block('products', {
          heading: 'For sale',
          subheading: 'Asking price in KES.',
          buttonLabel: 'Enquire',
          items: [1, 2, 3].map((n) => ({ name: `House ${n}`, description: 'Location · bedrooms · land size', price: `${n * 6},500,000`, image: placeholderImage(`For sale ${n}`, '#0e7490', '#0f172a', 800, 600) })),
        }),
        block('footer'),
      ]),
    ],
  }),

  events: (name) => ({
    kind: 'website',
    tagline: 'Weddings, parties and corporate events',
    theme: theme('sunset'),
    pages: [
      page('Home', '', [
        nav([{ label: 'Services', link: '#services' }, { label: 'Packages', link: '#packages' }, { label: 'Gallery', link: '#gallery' }], { ctaLabel: 'Get a quote', ctaLink: '#contact' }),
        block('hero', {
          layout: 'cover',
          eyebrow: 'Now booking for this season',
          title: 'Events your guests will talk about',
          subtitle: `${name} plans, decorates and caters weddings, birthdays and corporate events.`,
          primaryLabel: 'See packages',
          primaryLink: '#packages',
          secondaryLabel: 'Chat with a planner',
          secondaryLink: 'whatsapp',
          image: placeholderImage('', '#7c2d12', '#facc15'),
        }),
        block('features', {
          anchor: 'services',
          heading: 'What we do',
          columns: '4',
          items: [
            { title: 'Planning', text: 'Budgets, timelines and vendors handled for you.' },
            { title: 'Décor', text: 'Tents, flowers, lighting and table settings.' },
            { title: 'Catering', text: 'Buffets and plated menus for 20 to 1,000 guests.' },
            { title: 'Sound & MC', text: 'PA systems, DJs and experienced MCs.' },
          ],
        }),
        block('products', {
          anchor: 'packages',
          heading: 'Packages',
          subheading: 'Starting prices. Every event gets a custom quote.',
          showImages: false,
          buttonLabel: 'Book',
          items: [
            { name: 'Birthday party', description: 'Up to 50 guests, décor and cake', price: '45,000', image: '' },
            { name: 'Corporate lunch', description: 'Up to 100 guests, catering and sound', price: '120,000', image: '' },
            { name: 'Wedding', description: 'Up to 300 guests, full planning and décor', price: '450,000', image: '' },
          ],
        }),
        block('gallery', { heading: 'Recent events' }),
        block('testimonials'),
        block('faq', {
          items: [
            { q: 'How early should I book?', a: 'Three to six months ahead for weddings, two weeks for smaller events.' },
            { q: 'Do you need a deposit?', a: 'A 30% deposit by M-Pesa secures your date.' },
          ],
        }),
        block('contact', { heading: 'Request a quote' }),
        block('footer'),
      ]),
    ],
  }),

  portfolio: (name) => ({
    kind: 'website',
    tagline: 'Design, photography and digital work',
    theme: theme('ink'),
    pages: [
      page('Home', '', [
        nav([{ label: 'Work', link: '#gallery' }, { label: 'Services', link: '#services' }, { label: 'Contact', link: '#contact' }], { ctaLabel: 'Hire me', ctaLink: '#contact' }),
        block('hero', {
          layout: 'split',
          eyebrow: 'Available for projects',
          title: `Hi, I'm ${name}`,
          subtitle: 'I help small businesses look great online with branding, photography and websites.',
          primaryLabel: 'See my work',
          primaryLink: '#gallery',
          secondaryLabel: 'Get in touch',
          secondaryLink: '#contact',
          image: placeholderImage('Your photo', '#18181b', '#6366f1'),
        }),
        block('gallery', { heading: 'Selected work' }),
        block('features', {
          anchor: 'services',
          heading: 'Services',
          items: [
            { title: 'Brand identity', text: 'Logos, colours and brand guidelines.' },
            { title: 'Product photography', text: 'Clean photos that sell, delivered in 48 hours.' },
            { title: 'Websites', text: 'Fast, mobile-friendly sites you can update yourself.' },
          ],
        }),
        block('testimonials', { heading: 'Clients say' }),
        block('cta', { heading: 'Have a project in mind?', text: 'Tell me about it and I will reply within a day.', buttonLabel: 'Start a conversation', buttonLink: '#contact', style: 'dark' }),
        block('contact', { heading: 'Contact', showMpesa: false }),
        block('footer'),
      ]),
    ],
  }),

  garage: (name) => ({
    kind: 'website',
    tagline: 'Car service, repairs and car hire',
    theme: theme('motor'),
    pages: [
      page('Home', '', [
        nav([{ label: 'Services', link: '#services' }, { label: 'Car hire', link: '#hire' }, { label: 'Contact', link: '#contact' }], { ctaLabel: 'Book a service' }),
        block('hero', {
          layout: 'split',
          eyebrow: 'Same-day service',
          title: `Keep moving with ${name}`,
          subtitle: 'Servicing, diagnostics, tyres and bodywork by experienced mechanics, plus self-drive and chauffeured car hire.',
          primaryLabel: 'Book a service',
          primaryLink: 'whatsapp',
          secondaryLabel: 'Call now',
          secondaryLink: 'call',
          image: placeholderImage('Our workshop', '#7f1d1d', '#f59e0b'),
        }),
        block('products', {
          anchor: 'services',
          heading: 'Service prices',
          subheading: 'Labour only. Parts are quoted separately.',
          showImages: false,
          buttonLabel: 'Book',
          items: [
            { name: 'Minor service', description: 'Oil, filters and a 30-point check', price: '3,500', image: '' },
            { name: 'Major service', description: 'Includes plugs, belts and brake check', price: '8,000', image: '' },
            { name: 'Computer diagnostics', description: 'Find warning-light faults fast', price: '2,000', image: '' },
            { name: 'Wheel alignment & balancing', description: 'All four wheels', price: '2,500', image: '' },
          ],
        }),
        block('products', {
          anchor: 'hire',
          heading: 'Car hire',
          subheading: 'Per day. Ask about weekly rates.',
          buttonLabel: 'Book',
          items: [
            { name: 'Toyota Vitz', description: 'Economy, 5 seats', price: '3,500', image: placeholderImage('Economy car', '#dc2626', '#111111', 800, 600) },
            { name: 'Toyota Prado', description: '4×4, 7 seats', price: '12,000', image: placeholderImage('4×4 SUV', '#111111', '#f59e0b', 800, 600) },
            { name: 'Nissan Caravan', description: 'Van, 14 seats, with driver', price: '9,000', image: placeholderImage('Tour van', '#525252', '#dc2626', 800, 600) },
          ],
        }),
        block('hours', { items: [{ day: 'Monday – Saturday', time: '7:30am – 6:30pm' }, { day: 'Sunday', time: 'Emergency calls only' }] }),
        block('faq', {
          items: [
            { q: 'Do you offer a warranty on repairs?', a: 'Describe your warranty on parts and labour here.' },
            { q: 'What do I need to hire a car?', a: 'A valid driving licence, your ID and a refundable deposit.' },
          ],
        }),
        block('contact', { showMap: true }),
        block('footer'),
      ]),
    ],
  }),

  clinic: (name) => ({
    kind: 'website',
    tagline: 'Caring for your family’s health',
    theme: theme('care'),
    pages: [
      page('Home', '', [
        nav([{ label: 'Services', link: '#services' }, { label: 'Hours', link: '#hours' }, { label: 'Contact', link: '#contact' }], { ctaLabel: 'Book appointment' }),
        block('hero', {
          layout: 'split',
          eyebrow: 'Walk-ins welcome',
          title: `Quality care at ${name}`,
          subtitle: 'General consultations, laboratory tests and a fully stocked pharmacy under one roof.',
          primaryLabel: 'Book an appointment',
          primaryLink: 'whatsapp',
          secondaryLabel: 'Call us',
          secondaryLink: 'call',
          image: placeholderImage('Our clinic', '#0e7490', '#22c55e'),
        }),
        block('features', {
          anchor: 'services',
          heading: 'Services',
          columns: '3',
          items: [
            { title: 'General consultation', text: 'See a clinician for everyday health concerns.' },
            { title: 'Laboratory', text: 'Blood tests and screening with fast results.' },
            { title: 'Pharmacy', text: 'Prescription and over-the-counter medicines.' },
            { title: 'Maternal & child health', text: 'Antenatal visits, immunisation and growth checks.' },
            { title: 'Family planning', text: 'Confidential advice and services.' },
            { title: 'Home delivery', text: 'Medicines delivered to your door.' },
          ],
        }),
        block('hours', { anchor: 'hours', items: [{ day: 'Monday – Saturday', time: '8:00am – 8:00pm' }, { day: 'Sunday & public holidays', time: '9:00am – 3:00pm' }], note: 'For emergencies, go to the nearest hospital.' }),
        block('faq', {
          items: [
            { q: 'Do I need an appointment?', a: 'Walk-ins are welcome. Booking ahead reduces your waiting time.' },
            { q: 'Which insurance covers do you accept?', a: 'List the insurance schemes you accept here.' },
            { q: 'How do I pay?', a: 'M-Pesa, card, cash or insurance.' },
          ],
        }),
        block('contact', { heading: 'Visit or book', showMap: true }),
        block('footer'),
      ]),
    ],
  }),

  farm: (name) => ({
    kind: 'website',
    tagline: 'Fresh from our farm to your table',
    theme: theme('forest'),
    pages: [
      page('Home', '', [
        nav([{ label: 'Produce', link: '#produce' }, { label: 'About', link: '#about' }, { label: 'Order', link: '#contact' }], { ctaLabel: 'Order on WhatsApp' }),
        block('hero', {
          layout: 'cover',
          eyebrow: 'Harvested this week',
          title: `Farm-fresh produce from ${name}`,
          subtitle: 'Vegetables, fruit, eggs and dairy, delivered weekly to homes, shops and restaurants.',
          primaryLabel: 'See this week’s produce',
          primaryLink: '#produce',
          secondaryLabel: 'Order now',
          secondaryLink: 'whatsapp',
          image: placeholderImage('', '#14532d', '#ca8a04'),
        }),
        block('products', {
          anchor: 'produce',
          heading: 'This week’s produce',
          subheading: 'Prices change with the season.',
          items: [
            { name: 'Sukuma wiki', description: 'Per bunch', price: '30', image: placeholderImage('Sukuma wiki', '#166534', '#4ade80', 800, 600) },
            { name: 'Tomatoes', description: 'Per kg', price: '120', image: placeholderImage('Tomatoes', '#b91c1c', '#fb923c', 800, 600) },
            { name: 'Kienyeji eggs', description: 'Tray of 30', price: '600', image: placeholderImage('Eggs', '#a16207', '#fde68a', 800, 600) },
            { name: 'Hass avocados', description: 'Per kg', price: '150', image: placeholderImage('Avocados', '#365314', '#a3e635', 800, 600) },
            { name: 'Fresh milk', description: 'Per litre', price: '70', image: placeholderImage('Milk', '#0e7490', '#e0f2fe', 800, 600) },
            { name: 'Honey', description: '500 g jar', price: '450', image: placeholderImage('Honey', '#b45309', '#fcd34d', 800, 600) },
          ],
        }),
        block('features', {
          heading: 'How it works',
          items: [
            { title: 'Order by Thursday', text: 'Send your list on WhatsApp.' },
            { title: 'We harvest Friday', text: 'Picked fresh the day before delivery.' },
            { title: 'Delivered Saturday', text: 'Pay by M-Pesa when your order arrives.' },
          ],
        }),
        block('text', { anchor: 'about', heading: 'About the farm', body: 'Tell customers where your farm is, how you grow, and what makes your produce special.' }),
        block('faq', {
          items: [
            { q: 'Do you supply restaurants and shops?', a: 'Yes. Ask us about bulk prices and regular weekly orders.' },
            { q: 'Where do you deliver?', a: 'List the towns and estates you deliver to here.' },
          ],
        }),
        block('contact', { heading: 'Place an order' }),
        block('footer'),
      ]),
    ],
  }),
};

export const TEMPLATES: TemplateInfo[] = [
  { id: 'shop', name: 'Online duka', description: 'Products with WhatsApp ordering and M-Pesa details', kind: 'website', themeId: 'savanna', tags: ['Retail', '2 pages'] },
  { id: 'restaurant', name: 'Restaurant & café', description: 'Menu, opening hours, map and order button', kind: 'website', themeId: 'sunset', tags: ['Food', '2 pages'] },
  { id: 'salon', name: 'Salon & spa', description: 'Service price list, gallery and bookings', kind: 'website', themeId: 'blush', tags: ['Beauty', '1 page'] },
  { id: 'services', name: 'Professional services', description: 'Services grid, FAQ and quote requests', kind: 'website', themeId: 'ocean', tags: ['Services', '2 pages'] },
  { id: 'guesthouse', name: 'Hotel & guesthouse', description: 'Rooms with nightly rates, amenities and WhatsApp booking', kind: 'website', themeId: 'gold', tags: ['Hospitality', '1 page'] },
  { id: 'gym', name: 'Gym & fitness', description: 'Class timetable, membership plans and a free-session offer', kind: 'website', themeId: 'energy', tags: ['Fitness', '1 page'] },
  { id: 'school', name: 'School & tuition', description: 'Programmes, fees per term and admissions enquiries', kind: 'website', themeId: 'scholar', tags: ['Education', '2 pages'] },
  { id: 'church', name: 'Church & community', description: 'Service times, ministries and M-Pesa giving', kind: 'website', themeId: 'chapel', tags: ['Community', '1 page'] },
  { id: 'property', name: 'Property & rentals', description: 'Listings to let and for sale, with viewing bookings', kind: 'website', themeId: 'ocean', tags: ['Property', '2 pages'] },
  { id: 'events', name: 'Events & catering', description: 'Event packages, gallery and quote requests', kind: 'website', themeId: 'sunset', tags: ['Events', '1 page'] },
  { id: 'clinic', name: 'Clinic & pharmacy', description: 'Services, opening hours and appointment booking', kind: 'website', themeId: 'care', tags: ['Health', '1 page'] },
  { id: 'garage', name: 'Garage & car hire', description: 'Service prices, hire fleet and same-day bookings', kind: 'website', themeId: 'motor', tags: ['Auto', '1 page'] },
  { id: 'farm', name: 'Farm produce', description: 'Weekly produce list with WhatsApp orders and delivery', kind: 'website', themeId: 'forest', tags: ['Agriculture', '1 page'] },
  { id: 'portfolio', name: 'Freelancer portfolio', description: 'Your work, services and a hire-me contact form', kind: 'website', themeId: 'ink', tags: ['Creative', '1 page'] },
  { id: 'app', name: 'Mobile shop app', description: 'Installable phone app with a bottom tab bar', kind: 'app', themeId: 'midnight', tags: ['App', '3 screens'] },
  { id: 'blank', name: 'Start from scratch', description: 'A clean page to build your own way', kind: 'website', themeId: 'savanna', tags: ['Blank'] },
];

export function createProject(templateId: string, name: string, slug: string): Project {
  const build = BUILDERS[templateId] ?? BUILDERS.blank;
  const built = build(name);
  const now = new Date().toISOString();
  return {
    id: uid('prj'),
    name,
    slug,
    kind: built.kind,
    template: BUILDERS[templateId] ? templateId : 'blank',
    theme: built.theme,
    business: emptyBusiness(name, built.tagline),
    pages: built.pages,
    published: false,
    createdAt: now,
    updatedAt: now,
  };
}

/** Deep clone with fresh ids (used for duplicate block/page/project). */
export function cloneBlock(b: Block): Block {
  return { id: uid('b'), type: b.type, props: JSON.parse(JSON.stringify(b.props)) };
}

export function clonePage(p: Page, name?: string, slug?: string): Page {
  return { id: uid('p'), name: name ?? `${p.name} copy`, slug: slug ?? `${p.slug || 'home'}-copy`, blocks: p.blocks.map(cloneBlock) };
}
