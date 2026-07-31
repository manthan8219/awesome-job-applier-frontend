/** An OSINT-discovered HR/recruiter contact (mirrors osint.Contact). */
export interface OsintContact {
  id: number;
  company: string;
  domain: string;
  name: string;
  title: string;
  email: string;
  emailType: string; // "work" | "personal" | "pattern"
  linkedIn: string;
  source: string; // "hunter" | "apollo" | "github" | "osint" | "pattern"
  confidence: number; // 0-100
  foundAt: string; // ISO 8601
  notes: string;
}

/** Result of one OSINT contact search (mirrors osint.SearchResult). */
export interface ContactSearchResult {
  contacts: OsintContact[];
  sources: string[];
  errors: string[];
}
