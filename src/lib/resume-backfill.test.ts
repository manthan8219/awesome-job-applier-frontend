import { describe, expect, it } from 'vitest';
import { backfilledLabels, contactPatch } from './resume-backfill';
import { emptyProfile } from './onboarding';
import type { ResumeContact } from '@/types/resume';

describe('contactPatch', () => {
  it('fills empty config fields from the resume contact', () => {
    const contact: ResumeContact = {
      firstName: 'Manthan',
      lastName: 'Bhatia',
      email: 'm@example.com',
      phone: '+1 555 0100',
      linkedIn: 'manthan-bhatia',
      years: '4',
      skills: ['Go', 'Kubernetes'],
    };
    const p = contactPatch(emptyProfile(), contact);
    expect(p).toMatchObject({
      firstName: 'Manthan',
      lastName: 'Bhatia',
      email: 'm@example.com',
      phone: '+1 555 0100',
      linkedinId: 'manthan-bhatia',
      yearsOfExperience: '4',
    });
    expect(p.skills).toEqual(['Go', 'Kubernetes']);
  });

  it('never overwrites user-entered values', () => {
    const cfg = {
      ...emptyProfile(),
      firstName: 'Alex',
      email: 'alex@example.com',
    };
    const p = contactPatch(cfg, {
      firstName: 'Other',
      email: 'other@example.com',
      phone: '+1 111 222',
    });
    expect(p.firstName).toBeUndefined();
    expect(p.email).toBeUndefined();
    expect(p.phone).toBe('+1 111 222');
  });

  it('returns nothing for a null contact', () => {
    expect(contactPatch(emptyProfile(), null)).toEqual({});
  });
});

describe('backfilledLabels', () => {
  it('maps patch keys to human labels', () => {
    expect(
      backfilledLabels({ firstName: 'X', linkedinId: 'y', skills: [] }),
    ).toEqual(['First name', 'LinkedIn', 'Skills']);
  });
});
