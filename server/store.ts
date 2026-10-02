import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Lead, Project } from '../shared/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR ?? path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DB {
  projects: Project[];
  leads: Lead[];
}

let db: DB = { projects: [], leads: [] };
let timer: NodeJS.Timeout | null = null;

export function load(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      db.projects ??= [];
      db.leads ??= [];
    } catch (err) {
      const backup = `${DB_FILE}.corrupt-${Date.now()}`;
      fs.copyFileSync(DB_FILE, backup);
      console.error(`Could not parse ${DB_FILE}; backed it up to ${backup} and started fresh.`, err);
    }
  }
}

/** Debounced atomic write (write temp file, then rename). */
export function save(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, 150);
}

export function flush(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DB_FILE);
}

export const store = {
  get projects() {
    return db.projects;
  },
  get leads() {
    return db.leads;
  },
  set projects(v: Project[]) {
    db.projects = v;
  },
  set leads(v: Lead[]) {
    db.leads = v;
  },
};
