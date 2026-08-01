import { describe, expect, it } from 'vitest';
import { diffKeywords, extractKeywords } from './keywords';

describe('extractKeywords', () => {
  it('drops stopwords and short tokens', () => {
    const words = extractKeywords(
      'We are looking for a Go engineer to build backend systems with the team',
    );
    expect(words).toContain('go');
    expect(words).toContain('backend');
    expect(words).toContain('systems');
    expect(words).not.toContain('we');
    expect(words).not.toContain('are');
    expect(words).not.toContain('a');
    expect(words).not.toContain('the');
    expect(words).not.toContain('team');
  });

  it('is case-insensitive and dedupes', () => {
    const words = extractKeywords('GO GO go · Distributed Systems systems');
    expect(words.filter((w) => w === 'go').length).toBe(1);
    expect(words).toContain('distributed');
  });

  it('keeps short technical keywords like "go"', () => {
    const words = extractKeywords('We are hiring a Go engineer today.');
    expect(words).toContain('go');
    expect(words).toContain('hiring');
    expect(words).toContain('engineer');
  });

  it('returns an empty array for empty or junk input', () => {
    expect(extractKeywords('')).toEqual([]);
    expect(extractKeywords('!!! ???')).toEqual([]);
  });

  it('caps the result and ranks by frequency', () => {
    const words = extractKeywords(
      'rust rust rust python go kafka kafka sql aws',
    );
    expect(words.length).toBeLessThanOrEqual(30);
    expect(words[0]).toBe('rust');
  });
});

describe('diffKeywords', () => {
  it('splits matched and missing keywords', () => {
    const diff = diffKeywords(
      ['Go', 'kafka', 'sql', 'aws'],
      ['Go', 'SQL', 'Terraform'],
    );
    expect(diff.matched).toEqual(['Go', 'sql']);
    expect(diff.missing).toEqual(['kafka', 'aws']);
    expect(diff.matchedCount).toBe(2);
    expect(diff.missingCount).toBe(2);
  });

  it('matches a phrase skill via a contained word', () => {
    const diff = diffKeywords(['distributed', 'systems'], [
      'Distributed Systems',
    ]);
    expect(diff.matchedCount).toBe(2);
    expect(diff.missingCount).toBe(0);
  });

  it('does not over-match on substrings ("go" vs "google")', () => {
    const diff = diffKeywords(['go'], ['Google Cloud']);
    expect(diff.matchedCount).toBe(0);
    expect(diff.missingCount).toBe(1);
  });

  it('handles empty inputs', () => {
    expect(diffKeywords([], [])).toEqual({
      matched: [],
      missing: [],
      matchedCount: 0,
      missingCount: 0,
    });
  });
});
