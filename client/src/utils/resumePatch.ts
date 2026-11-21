import { type ResumeData } from './sampleResume';

export interface ResumePatchOp {
  op: 'set' | 'add' | 'update' | 'remove';
  path: string;
  value: any;
}

/**
 * Maps a patch path to the corresponding preview section key for UI highlight
 */
export function getSectionFromPath(path: string): string {
  const clean = path.replace(/\[\d+\]/g, '');
  if (clean.startsWith('basics')) return 'basics';
  if (clean.startsWith('summary')) return 'summary';
  if (clean.startsWith('sections.experience')) return 'experience';
  if (clean.startsWith('sections.education')) return 'education';
  if (clean.startsWith('sections.skills')) return 'skills';
  if (clean.startsWith('sections.projects')) return 'projects';
  if (clean.startsWith('sections.certifications') || clean.startsWith('sections.awards')) return 'awards';
  if (clean.startsWith('metadata')) return 'style';
  return 'basics';
}

/**
 * Safely applies an array of JSON patch operations to a ResumeData state
 * returning a new cloned ResumeData object and the affected sections.
 */
export function applyResumePatches(
  original: ResumeData,
  patches: ResumePatchOp[]
): { updated: ResumeData; affectedSections: Set<string> } {
  // Deep clone to prevent mutations
  const updated: ResumeData = JSON.parse(JSON.stringify(original));
  const affectedSections = new Set<string>();

  for (const patch of patches) {
    if (!patch || !patch.path) continue;
    const { op, path, value } = patch;
    affectedSections.add(getSectionFromPath(path));

    // Handle root basics shortcuts (e.g. "basics.name" or "name")
    if (path === 'name' || path === 'basics.name') {
      updated.basics.name = String(value || '');
      continue;
    }
    if (path === 'headline' || path === 'basics.headline') {
      updated.basics.headline = String(value || '');
      continue;
    }
    if (path === 'email' || path === 'basics.email') {
      updated.basics.email = String(value || '');
      continue;
    }
    if (path === 'phone' || path === 'basics.phone') {
      updated.basics.phone = String(value || '');
      continue;
    }
    if (path === 'location' || path === 'basics.location') {
      updated.basics.location = String(value || '');
      continue;
    }
    if (path === 'url' || path === 'basics.url') {
      updated.basics.url = String(value || '');
      continue;
    }
    if (path === 'github' || path === 'basics.github') {
      updated.basics.github = String(value || '');
      continue;
    }
    if (path === 'linkedin' || path === 'basics.linkedin') {
      updated.basics.linkedin = String(value || '');
      continue;
    }
    if (path === 'summary') {
      updated.summary = String(value || '');
      continue;
    }
    if (path === 'metadata.template') {
      if (['modern', 'classic', 'minimal', 'executive'].includes(value)) {
        updated.metadata.template = value;
      }
      continue;
    }
    if (path === 'metadata.themeColor') {
      updated.metadata.themeColor = String(value || '#e11d48');
      continue;
    }

    // Dynamic path handling: e.g. "sections.experience", "sections.experience[0].summary"
    try {
      const parts = path.split('.').flatMap((p) => {
        const match = p.match(/^([a-zA-Z0-9_]+)\[(\d+)\]$/);
        if (match) {
          return [match[1], parseInt(match[2], 10)];
        }
        return [p];
      });

      let current: any = updated;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (current[key] === undefined || current[key] === null) {
          // initialize container
          const nextKey = parts[i + 1];
          current[key] = typeof nextKey === 'number' ? [] : {};
        }
        current = current[key];
      }

      const lastKey = parts[parts.length - 1];

      if (op === 'set' || op === 'update') {
        if (Array.isArray(current) && typeof lastKey === 'number') {
          if (lastKey < current.length) {
            current[lastKey] = typeof value === 'object' && !Array.isArray(value)
              ? { ...current[lastKey], ...value }
              : value;
          } else {
            current.push(value);
          }
        } else {
          current[lastKey] = value;
        }
      } else if (op === 'add') {
        if (Array.isArray(current[lastKey])) {
          if (Array.isArray(value)) {
            current[lastKey].push(...value);
          } else {
            current[lastKey].push(value);
          }
        } else if (Array.isArray(current) && typeof lastKey === 'number') {
          current.splice(lastKey, 0, value);
        } else {
          current[lastKey] = value;
        }
      } else if (op === 'remove') {
        if (Array.isArray(current) && typeof lastKey === 'number') {
          current.splice(lastKey, 1);
        } else if (typeof current === 'object' && current !== null) {
          delete current[lastKey];
        }
      }
    } catch (e) {
      console.warn('[resumePatch] Error applying patch:', patch, e);
    }
  }

  return { updated, affectedSections };
}
