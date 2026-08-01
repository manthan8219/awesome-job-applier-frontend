import { describe, expect, it } from 'vitest';
import { detectProfession } from './profession';

describe('detectProfession', () => {
  it.each([
    ['cardiologist', "I'm a cardiologist, remote", 'Healthcare'],
    ['nurse', 'Registered Nurse, hospital', 'Healthcare'],
    ['veterinarian', 'Veterinarian, clinic', 'Healthcare'],
    ['data analyst', 'Data Analyst, SQL', 'Data/AI'],
    ['data engineer', 'Senior Data Engineer, warehouse', 'Data/AI'],
    ['ml engineer', 'Machine Learning Engineer', 'Data/AI'],
    ['go engineer', 'Senior Go Engineer, backend', 'Engineering'],
    ['devops', 'DevOps platform engineer', 'Engineering'],
    ['designer', 'Product Designer, Figma', 'Design'],
    ['ux designer', 'UX designer, mobile', 'Design'],
    ['research scientist', 'Research scientist, genomics', 'Research/Science'],
    ['chemist', 'Chemist in a lab', 'Research/Science'],
    ['marketing', 'Growth marketing manager', 'Marketing'],
    ['sales', 'Sales account executive', 'Sales'],
    ['accountant', 'Accountant', 'Finance'],
    ['teacher', 'Math teacher, high school', 'Education'],
    ['lawyer', 'Corporate lawyer', 'Legal'],
    ['recruiter', 'Recruiter at a startup', 'HR'],
    ['hr manager', 'HR manager, people ops', 'HR'],
    ['writer', 'Technical writer', 'Writing'],
    ['electrician', 'Electrician, residential', 'Trade/Construction'],
    ['support', 'Customer support specialist', 'Customer Support'],
    ['project manager', 'Project manager, agile', 'Project Management'],
    ['product manager', 'Product manager, fintech', 'Project Management'],
  ])('detects %s → %s', (_name, intent, expected) => {
    expect(detectProfession(intent)).toBe(expected);
  });

  it.each([
    ['unknown intent', 'Life Coach, Wellness'],
    ['exploring', 'exploring'],
    ['empty string', ''],
  ])('returns "" for %s', (_name, intent) => {
    expect(detectProfession(intent)).toBe('');
  });

  it('does not let short keywords fire inside unrelated words', () => {
    // "ai" in "email", "art" in "startup", "hr" in "through", "ui" in "built".
    expect(detectProfession('Email me at a@example.com')).toBe('');
    expect(detectProfession('A startup in Berlin')).toBe('');
    expect(detectProfession('Senior roles through the roof')).toBe('');
    expect(detectProfession('Built for scale')).toBe('');
  });

  it('detects from suggestion titles alone', () => {
    expect(detectProfession('Senior Go Engineer Platform Engineer')).toBe(
      'Engineering',
    );
    expect(detectProfession('Registered Nurse Physician Assistant')).toBe(
      'Healthcare',
    );
  });
});
