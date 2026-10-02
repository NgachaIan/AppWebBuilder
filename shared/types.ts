export type BlockType =
  | 'navbar'
  | 'hero'
  | 'text'
  | 'image'
  | 'features'
  | 'products'
  | 'gallery'
  | 'testimonials'
  | 'hours'
  | 'faq'
  | 'cta'
  | 'contact'
  | 'footer'
  | 'appbar';

export type Props = Record<string, any>;

export interface Block {
  id: string;
  type: BlockType;
  props: Props;
}

export interface Page {
  id: string;
  name: string;
  /** "" for the home page, otherwise a url-safe slug */
  slug: string;
  blocks: Block[];
}

export interface Theme {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  font: string;
  headingFont: string;
  radius: number;
}

export interface Business {
  name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  location: string;
  mpesaType: 'none' | 'till' | 'paybill';
  mpesaNumber: string;
  mpesaAccount: string;
  showWhatsappButton: boolean;
}

export type ProjectKind = 'website' | 'app';

export interface Project {
  id: string;
  name: string;
  slug: string;
  kind: ProjectKind;
  template: string;
  theme: Theme;
  business: Business;
  pages: Page[];
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  projectId: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  page: string;
  createdAt: string;
  read: boolean;
}

export interface ProjectSummary {
  id: string;
  name: string;
  slug: string;
  kind: ProjectKind;
  template: string;
  published: boolean;
  publishedAt?: string;
  updatedAt: string;
  pageCount: number;
  unreadLeads: number;
  totalLeads: number;
}

/* ---------- Block schema (drives the inspector UI) ---------- */

export type FieldType = 'text' | 'textarea' | 'color' | 'select' | 'image' | 'toggle' | 'link' | 'list';

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
  help?: string;
  /** for type === 'list' */
  itemFields?: Field[];
  itemLabel?: string;
  newItem?: Props;
}

export interface BlockDefinition {
  type: BlockType;
  label: string;
  description: string;
  category: 'Layout' | 'Content' | 'Business' | 'App';
  icon: string;
  fields: Field[];
  defaults: () => Props;
}
