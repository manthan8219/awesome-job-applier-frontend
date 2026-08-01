import { describe, expect, it } from 'vitest';
import { shouldOnboard } from './onboarding';

describe('shouldOnboard', () => {
  it('is true for a fresh config', () => {
    expect(shouldOnboard({ targetJobTitles: '', jobIntent: '' })).toBe(true);
  });

  it('is true when there is no config at all', () => {
    expect(shouldOnboard(undefined)).toBe(true);
  });

  it('treats omitted fields as not set (backend json omitempty)', () => {
    expect(shouldOnboard({ targetJobTitles: '', jobIntent: undefined })).toBe(
      true,
    );
    expect(
      shouldOnboard({ targetJobTitles: undefined, jobIntent: undefined }),
    ).toBe(true);
    expect(shouldOnboard({})).toBe(true);
  });

  it('is false when target titles are set', () => {
    expect(
      shouldOnboard({ targetJobTitles: 'Backend Engineer', jobIntent: '' }),
    ).toBe(false);
  });

  it('is false when only a job intent is set (exploring path)', () => {
    expect(shouldOnboard({ targetJobTitles: '', jobIntent: 'exploring' })).toBe(
      false,
    );
  });

  it('trims whitespace before deciding', () => {
    expect(shouldOnboard({ targetJobTitles: '   ', jobIntent: '' })).toBe(true);
    expect(
      shouldOnboard({ targetJobTitles: '  Go Engineer  ', jobIntent: '' }),
    ).toBe(false);
  });
});
