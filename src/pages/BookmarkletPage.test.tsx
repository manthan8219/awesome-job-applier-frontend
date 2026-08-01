import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import BookmarkletPage from './BookmarkletPage';

describe('BookmarkletPage', () => {
  it('renders the installer with a javascript: snippet', () => {
    render(
      <MemoryRouter>
        <BookmarkletPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: /send jobs to nexus/i }),
    ).toBeInTheDocument();
    const link = screen.getByTestId('bookmarklet-link');
    expect(link.getAttribute('href')).toMatch(/^javascript:/);
    // Points at the current origin + /jobs/new.
    expect(link.getAttribute('href')).toContain('/jobs/new?role=');
  });

  it('shows the capture explanation', () => {
    render(
      <MemoryRouter>
        <BookmarkletPage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/what it captures/i)).toBeInTheDocument();
    expect(
      screen.getByText(/split into the role and company/i),
    ).toBeInTheDocument();
  });
});
