export type Preferences = {
  mergifyToken: string;
  owner: string;
  repository: string;
};

export type MergeQueueStatusResponse = {
  batches: Batch[];
  waiting_pull_requests: PullRequest[];
};

export type Batch = {
  name: string;
  status: {
    code: string;
  };
  checks_summary?: {
    passed: number;
    total: number;
  } | null;
  estimated_merge_at?: string | null;
  pull_requests: PullRequest[];
};

export type PullRequest = {
  number: number;
  title: string;
  url: string;
  estimated_merge_at?: string | null;
  author?: {
    id: number;
    login: string;
  } | null;
};

const API_BASE_URL = "https://api.mergify.com/v1";

export function getAvatar(author: PullRequest["author"]) {
  if (!author?.id) {
    return undefined;
  }

  return {
    source: `https://avatars.githubusercontent.com/u/${author.id}?v=4&size=96`,
  };
}

export function formatMergeEta(estimatedMergeAt: string | null) {
  if (!estimatedMergeAt) {
    return "ETA unknown";
  }

  const eta = new Date(estimatedMergeAt);
  if (Number.isNaN(eta.getTime())) {
    return "ETA unknown";
  }

  const relative = formatRelativeTime(eta);
  const absolute = eta.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${relative} (${absolute})`;
}

export function formatBatchSubtitle(status: string, checksSummary?: Batch["checks_summary"]) {
  if (!checksSummary) {
    return status;
  }

  return `${status} - checks ${checksSummary.passed}/${checksSummary.total}`;
}

export async function buildErrorMessage(response: Response) {
  if (response.status === 401 || response.status === 403) {
    return "Authentication failed. Verify your Mergify token and repository access.";
  }

  if (response.status === 404) {
    return "Repository not found or merge queue is unavailable for this repository.";
  }

  if (response.status === 429) {
    return "Rate limit reached. Please try again in a moment.";
  }

  try {
    const payload = (await response.json()) as { detail?: string; title?: string; message?: string };
    const details = payload.detail || payload.message || payload.title;
    if (details) {
      return `Mergify API error (${response.status}): ${details}`;
    }
  } catch {
    return `Mergify API error (${response.status}).`;
  }

  return `Mergify API error (${response.status}).`;
}

export async function getMergeQueueStatus(preferences: Preferences): Promise<MergeQueueStatusResponse> {
  const endpoint = `${API_BASE_URL}/repos/${encodeURIComponent(preferences.owner)}/${encodeURIComponent(
    preferences.repository,
  )}/merge-queue/status`;

  const apiResponse = await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${preferences.mergifyToken}`,
    },
  });

  if (!apiResponse.ok) {
    throw new Error(await buildErrorMessage(apiResponse));
  }

  return (await apiResponse.json()) as MergeQueueStatusResponse;
}

function formatRelativeTime(targetDate: Date) {
  const now = Date.now();
  const diffMs = targetDate.getTime() - now;
  const absMs = Math.abs(diffMs);

  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (absMs < minuteMs) {
    return diffMs >= 0 ? "in <1m" : "<1m ago";
  }

  if (absMs < hourMs) {
    const minutes = Math.round(absMs / minuteMs);
    return diffMs >= 0 ? `in ${minutes}m` : `${minutes}m ago`;
  }

  if (absMs < dayMs) {
    const hours = Math.round(absMs / hourMs);
    return diffMs >= 0 ? `in ${hours}h` : `${hours}h ago`;
  }

  const days = Math.round(absMs / dayMs);
  return diffMs >= 0 ? `in ${days}d` : `${days}d ago`;
}
