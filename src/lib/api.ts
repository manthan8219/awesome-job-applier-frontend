import type {
  Application,
  MissionSnapshot,
  NewApplicationInput,
  NexusConfig,
  Outcome,
} from '@/types';
import type { CompaniesResult, Company, CompanyInput } from '@/types/companies';
import type { ContactSearchResult, OsintContact } from '@/types/contacts';
import type {
  OutreachChannel,
  OutreachItem,
  OutreachLogEntry,
  OutreachMode,
  OutreachSetup,
} from '@/types/outreach';
import type {
  ImproveOutput,
  ImproveRequest,
  ResumeAnalysis,
  WorkProject,
} from '@/types/resume';
import type { UsageSnapshot } from '@/types/usage';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(
  /\/$/,
  '',
);

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = (await res.json()) as {
        message?: string;
        error?: string;
      };
      message = body.message ?? body.error ?? message;
    } catch {
      // body was not JSON; keep the status text
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * The Nexus HTTP API client — talks to the Go backend (`nexus --api`) at
 * VITE_API_BASE_URL (defaults to `/api`, proxied to :8080 by Vite in dev).
 * There is no mock layer: every call is a real request.
 */
export const api = {
  /* ------------------------------ Mission ------------------------------ */

  async getMission(): Promise<MissionSnapshot> {
    return request<MissionSnapshot>('/mission');
  },

  /* ------------------------------ Config ------------------------------- */

  async getConfig(): Promise<NexusConfig> {
    return request<NexusConfig>('/config');
  },

  async saveConfig(cfg: NexusConfig): Promise<NexusConfig> {
    return request<NexusConfig>('/config', {
      method: 'PUT',
      body: JSON.stringify(cfg),
    });
  },

  async getConfigComplete(): Promise<{ complete: boolean; missing: string[] }> {
    return request('/config/complete');
  },

  async toggleDryRun(on: boolean): Promise<void> {
    await request('/config', {
      method: 'PATCH',
      body: JSON.stringify({ dry_run: on }),
    });
  },

  async toggleAutoApply(on: boolean): Promise<void> {
    await request('/config', {
      method: 'PATCH',
      body: JSON.stringify({ auto_apply: on }),
    });
  },

  /* -------------------------------- Run -------------------------------- */

  async startRun(input: {
    dryRun: boolean;
    autoApply: boolean;
  }): Promise<void> {
    await request('/run', { method: 'POST', body: JSON.stringify(input) });
  },

  async stopRun(): Promise<void> {
    await request('/run', { method: 'DELETE' });
  },

  async applySelected(ids: number[]): Promise<{ applied: number }> {
    return request('/run/apply-selected', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },

  /* --------------------------- Applications ---------------------------- */

  async getApplications(query?: string): Promise<Application[]> {
    const q = query ? `?q=${encodeURIComponent(query)}` : '';
    return request<Application[]>(`/jobs${q}`);
  },

  async createApplication(input: NewApplicationInput): Promise<Application> {
    return request<Application>('/jobs', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async dismissApplication(id: number): Promise<void> {
    await request(`/jobs/${encodeURIComponent(id)}/dismiss`, {
      method: 'POST',
    });
  },

  async setApplicationOutcome(
    id: number,
    outcome: Outcome,
  ): Promise<Application> {
    return request<Application>(`/jobs/${id}/outcome`, {
      method: 'PATCH',
      body: JSON.stringify({ outcome }),
    });
  },

  async setApplicationApproved(
    id: number,
    approved: boolean,
  ): Promise<Application> {
    return request<Application>(`/applications/${id}/approved`, {
      method: 'POST',
      body: JSON.stringify({ approved }),
    });
  },

  /* ------------------------------ Companies ---------------------------- */

  async getCompanies(
    query?: string,
    country?: string,
  ): Promise<CompaniesResult> {
    const qs = new URLSearchParams();
    if (query) qs.set('q', query);
    if (country) qs.set('country', country);
    const s = qs.toString();
    return request<CompaniesResult>(`/companies${s ? `?${s}` : ''}`);
  },

  async saveCompany(input: CompanyInput): Promise<Company> {
    return request<Company>('/companies', {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async refreshCompanies(): Promise<number> {
    return request<number>('/companies/refresh', { method: 'POST' });
  },

  async getCompanyJobs(name: string): Promise<Application[]> {
    return request<Application[]>(
      `/companies/${encodeURIComponent(name)}/jobs`,
    );
  },

  /* ------------------------------ Contacts ----------------------------- */

  async searchContacts(
    company: string,
    domain: string,
  ): Promise<ContactSearchResult> {
    const qs = new URLSearchParams({ company, domain });
    return request<ContactSearchResult>(`/contacts/search?${qs.toString()}`);
  },

  async getSavedContacts(): Promise<OsintContact[]> {
    return request<OsintContact[]>('/contacts/saved');
  },

  async saveContact(c: OsintContact): Promise<OsintContact> {
    return request<OsintContact>('/contacts/saved', {
      method: 'PUT',
      body: JSON.stringify(c),
    });
  },

  async deleteContact(id: number): Promise<void> {
    await request(`/contacts/saved/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  /* ------------------------------ Outreach ----------------------------- */

  async getOutreachSetup(): Promise<OutreachSetup> {
    // The backend currently sends maxEmailsDay/maxLinkedInDay; the frontend
    // contract is maxEmailsPerDay/maxLinkedInPerDay. Normalize both so the
    // Setup form renders real values now and stays correct once the backend
    // switches to the canonical keys.
    const raw = await request<Record<string, unknown>>('/outreach/setup');
    return {
      consent: Boolean(raw.consent),
      mode: (raw.mode as OutreachMode) ?? 'confirm',
      maxEmailsPerDay: Number(raw.maxEmailsPerDay ?? raw.maxEmailsDay ?? 10),
      maxLinkedInPerDay: Number(
        raw.maxLinkedInPerDay ?? raw.maxLinkedInDay ?? 5,
      ),
      aiCompose: Boolean(raw.aiCompose),
      aiReview: Boolean(raw.aiReview),
    };
  },

  async saveOutreachSetup(setup: OutreachSetup): Promise<OutreachSetup> {
    return request<OutreachSetup>('/outreach/setup', {
      method: 'PUT',
      body: JSON.stringify(setup),
    });
  },

  async getOutreachItems(): Promise<OutreachItem[]> {
    return request<OutreachItem[]>('/outreach/items');
  },

  async buildOutreachQueue(channel: OutreachChannel): Promise<OutreachItem[]> {
    return request<OutreachItem[]>('/outreach/build', {
      method: 'POST',
      body: JSON.stringify({ channel }),
    });
  },

  async sendOutreachItem(id: string): Promise<OutreachItem> {
    // The backend runs the real send pipeline and returns the item with its
    // updated status (sent / failed). Without email credentials or consent the
    // request rejects with a 400 carrying the honest reason.
    return request<OutreachItem>(`/outreach/send/${encodeURIComponent(id)}`, {
      method: 'POST',
    });
  },

  async getOutreachLog(): Promise<OutreachLogEntry[]> {
    return request<OutreachLogEntry[]>('/outreach/log');
  },

  /* ------------------------------- Resume ------------------------------ */

  async getResumeAnalysis(): Promise<ResumeAnalysis> {
    return request<ResumeAnalysis>('/resume/analyze');
  },

  async reanalyzeResume(path?: string): Promise<ResumeAnalysis> {
    const body = path ? { path } : {};
    return request<ResumeAnalysis>('/resume/analyze', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async getResumeProjects(): Promise<WorkProject[]> {
    return request<WorkProject[]>('/resume/projects');
  },

  async saveResumeProject(project: WorkProject): Promise<WorkProject> {
    return request<WorkProject>('/resume/projects', {
      method: 'PUT',
      body: JSON.stringify(project),
    });
  },

  async deleteResumeProject(id: string): Promise<void> {
    await request(`/resume/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async getResumeSkills(): Promise<string[]> {
    return request<string[]>('/resume/skills');
  },

  async saveResumeSkills(skills: string[]): Promise<string[]> {
    return request<string[]>('/resume/skills', {
      method: 'PUT',
      body: JSON.stringify({ skills }),
    });
  },

  async improveResume(input: ImproveRequest): Promise<ImproveOutput> {
    return request<ImproveOutput>('/resume/improve', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async uploadResume(file: File): Promise<{ path: string; name: string }> {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE_URL}/resume/upload`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      let message = `${res.status} ${res.statusText}`;
      try {
        const body = (await res.json()) as { message?: string };
        message = body.message ?? message;
      } catch {
        // body was not JSON; keep the status text
      }
      throw new ApiError(res.status, message);
    }
    return (await res.json()) as { path: string; name: string };
  },

  async getResumeLibrary(): Promise<
    Array<{
      id: string;
      label: string;
      targetRole?: string;
      pdfPath: string;
      createdAt: string;
    }>
  > {
    return request('/resume/library');
  },

  /* ----------------------------- Job titles ---------------------------- */

  async suggestJobTitles(
    intent: string,
    years?: string,
    hints?: string[],
  ): Promise<{ titles: string[]; intent: string; profession?: string }> {
    return request('/job-titles/suggest', {
      method: 'POST',
      body: JSON.stringify({ intent, years, hints }),
    });
  },

  /* -------------------------------- Geo -------------------------------- */

  async geoSearch(
    query: string,
  ): Promise<Array<{ label: string; country: string; iso2: string }>> {
    return request(`/geo/search?q=${encodeURIComponent(query)}`);
  },

  /* -------------------------------- FS --------------------------------- */

  async getFSAutocomplete(path: string): Promise<string[]> {
    return request(`/fs/autocomplete?path=${encodeURIComponent(path)}`);
  },

  /* -------------------------------- LLM -------------------------------- */

  async getLLMStatus(): Promise<{
    reachable: boolean;
    installed: string[];
    machine: {
      ramGb: number;
      cpu: string;
      gpuName?: string;
      gpuVramGb?: number;
    };
    models: Array<{
      name: string;
      displayName: string;
      minRamGb: number;
      fits: boolean;
      installed: boolean;
      best?: boolean;
      notes?: string;
    }>;
    err?: string;
  }> {
    return request('/llm/status');
  },

  async pullLLMModel(model: string): Promise<{ ok: boolean; model: string }> {
    return request('/llm/pull', {
      method: 'POST',
      body: JSON.stringify({ model }),
    });
  },

  async getLLMPullStatus(model: string): Promise<{
    model: string;
    status: string;
    message?: string;
    completed?: number;
    total?: number;
    error?: string;
  }> {
    return request(`/llm/pull/${encodeURIComponent(model)}/status`);
  },

  /* -------------------------------- Logs ------------------------------- */

  async getLogs(filter?: string): Promise<{ lines: string[]; filter: string }> {
    const q = filter ? `?q=${encodeURIComponent(filter)}` : '';
    return request<{ lines: string[]; filter: string }>(`/logs${q}`);
  },

  async clearLogs(): Promise<void> {
    await request('/logs', { method: 'DELETE' });
  },

  /* ------------------------------- Usage ------------------------------- */

  async getUsage(): Promise<UsageSnapshot> {
    return request<UsageSnapshot>('/usage');
  },

  /* ---------------------------- Notifications -------------------------- */

  async getNotifyChannels(): Promise<
    Array<{ id: string; name: string; enabled: boolean }>
  > {
    return request('/notify/channels');
  },

  /* ------------------------------ Scraper ------------------------------ */

  async getScraperStatus(): Promise<{
    installed: boolean;
    running: boolean;
    backends: string[];
  }> {
    return request('/scraper/status');
  },

  async installScraper(): Promise<{ ok: boolean }> {
    return request('/scraper/install', { method: 'POST' });
  },

  async startScraper(): Promise<{ ok: boolean; running: boolean }> {
    return request('/scraper/start', { method: 'POST' });
  },
};
