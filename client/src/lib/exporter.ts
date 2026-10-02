import type { Page, Project } from '@shared/types';
import { renderPage } from '@shared/render';

export type ExportKind = 'zip' | 'page' | 'backup';
export const BACKUP_FORMAT = 'appwebbuilder-backup';

type SaveOutcome = 'saved' | 'declined';

/**
 * Offer a file to the user. Inside a claude.ai artifact the page can't download directly,
 * so it goes through the viewer's `downloads` capability; everywhere else a normal download link.
 */
async function saveFile(filename: string, data: Blob | string): Promise<SaveOutcome> {
  const host = (window as any).claude;
  if (host?.use) {
    const downloads = await host.use('downloads');
    if (downloads) {
      try {
        await downloads.save({ filename, data });
        return 'saved';
      } catch (e: any) {
        if (e?.code === 'declined') return 'declined';
        if (e?.code === 'rate_limited') throw new Error('A save prompt is already open. Finish it, then try again.');
        throw new Error(e?.message || 'This view does not allow saving files.');
      }
    }
  }
  const blob = typeof data === 'string' ? new Blob([data], { type: 'text/plain;charset=utf-8' }) : data;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  return 'saved';
}

/** `apiOrigin` lets an exported contact form post back to a running AppWebBuilder server. Without it the form sends via WhatsApp. */
export async function exportProject(project: Project, kind: ExportKind, page: Page, apiOrigin?: string): Promise<SaveOutcome> {
  const opts = { mode: 'export' as const, apiOrigin };
  if (kind === 'page') {
    return saveFile(`${project.slug}-${page.slug || 'index'}.html`, renderPage(project, page, opts));
  }
  if (kind === 'backup') {
    const body = JSON.stringify({ format: BACKUP_FORMAT, version: 1, exportedAt: new Date().toISOString(), project }, null, 2);
    return saveFile(`${project.slug}-backup.json`, body);
  }
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  for (const pg of project.pages) zip.file(`${pg.slug || 'index'}.html`, renderPage(project, pg, opts));
  zip.file(
    'README.txt',
    `${project.business.name}\n\nExported from AppWebBuilder on ${new Date().toDateString()}.\n\n` +
      `Upload every .html file to any web host (Netlify, GitHub Pages, cPanel and similar). index.html is your home page.\n` +
      (apiOrigin
        ? `The contact form sends messages to ${apiOrigin}. Keep that server running, or remove the form.\n`
        : `The contact form sends messages to your WhatsApp number.\n`),
  );
  return saveFile(`${project.slug}-site.zip`, await zip.generateAsync({ type: 'blob' }));
}

/** Parse and sanity-check a backup file. Throws a readable error when it isn't one. */
export function parseBackup(text: string): Project {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not a valid backup (it is not JSON).');
  }
  const p = data?.format === BACKUP_FORMAT ? data.project : data;
  if (!p || !Array.isArray(p.pages) || !p.pages.length || !p.theme || !p.business) throw new Error('That file is not an AppWebBuilder backup.');
  if (!p.pages.some((pg: any) => pg.slug === '')) throw new Error('The backup has no home page.');
  return p as Project;
}
