/** A company tracked by Nexus (mirrors companies.Company, web-shaped). */
export interface Company {
  id: number;
  name: string;
  website: string;
  ats: string; // greenhouse | lever | ashby | workable | … or ''
  board: string; // ATS board slug / token
  boardURL: string; // canonical careers / ATS URL
  hireCountries: string[]; // display names e.g. "India"
  hqCountry: string;
  kind: string; // "" | "startup" | "tech" | …
  industry: string;
  source: string; // openjobs | manual | observed
  updatedAt: string; // ISO 8601
}

/** Payload for adding/editing a company (mirrors the TUI add-company form). */
export interface CompanyInput {
  id?: number;
  name: string;
  website: string;
  boardURL: string;
  countries: string; // comma-separated display names
  ats: string;
}

/** Result of listing companies — items + total + per-company scraped job counts. */
export interface CompaniesResult {
  items: Company[];
  total: number;
  counts: Record<string, number>; // CompanyKey(name) → scraped jobs recorded
}
