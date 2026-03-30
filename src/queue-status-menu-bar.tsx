import { Icon, MenuBarExtra, getPreferenceValues, open } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { Preferences, formatMergeEta, getMergeQueueStatus } from "./lib/mergify";

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const { data: response, isLoading, error } = usePromise(getMergeQueueStatus, [preferences]);

  const waitingPullRequests = response?.waiting_pull_requests ?? [];
  const batches = response?.batches ?? [];
  const totalBatchPullRequests = batches.reduce((total, batch) => total + batch.pull_requests.length, 0);
  const totalPullRequests = waitingPullRequests.length + totalBatchPullRequests;

  const menuBarTitle = isLoading ? "..." : String(totalPullRequests);
  const tooltip = `Mergify queue for ${preferences.owner}/${preferences.repository}`;

  return (
    <MenuBarExtra title={menuBarTitle} icon={Icon.Train} tooltip={tooltip} isLoading={isLoading}>
      {error ? (
        <MenuBarExtra.Item title="Unable to load queue" subtitle={getErrorMessage(error)} icon={Icon.ExclamationMark} />
      ) : null}

      {!error && !isLoading && totalPullRequests === 0 ? (
        <MenuBarExtra.Item
          title="Queue is empty"
          subtitle={`${preferences.owner}/${preferences.repository}`}
          icon={Icon.CheckCircle}
        />
      ) : null}

      {!error && waitingPullRequests.length > 0 ? (
        <MenuBarExtra.Section title={`Waiting (${waitingPullRequests.length})`}>
          {waitingPullRequests.map((pullRequest) => (
            <MenuBarExtra.Item
              key={`waiting-${pullRequest.number}`}
              title={`#${pullRequest.number} ${pullRequest.title}`}
              subtitle={formatMenuItemSubtitle(
                pullRequest.author?.login,
                formatMergeEta(pullRequest.estimated_merge_at ?? null),
              )}
              onAction={() => open(pullRequest.url)}
            />
          ))}
        </MenuBarExtra.Section>
      ) : null}

      {!error
        ? batches.map((batch) => (
          <MenuBarExtra.Section key={batch.name} title={`Batch ${batch.name}`}>
            {batch.pull_requests.map((pullRequest) => (
              <MenuBarExtra.Item
                key={`batch-${batch.name}-${pullRequest.number}`}
                title={`#${pullRequest.number} ${pullRequest.title}`}
                subtitle={formatMenuItemSubtitle(
                  pullRequest.author?.login,
                  formatMergeEta(pullRequest.estimated_merge_at ?? batch.estimated_merge_at ?? null),
                )}
                onAction={() => open(pullRequest.url)}
              />
            ))}
          </MenuBarExtra.Section>
        ))
        : null}
    </MenuBarExtra>
  );
}

function formatMenuItemSubtitle(authorLogin: string | undefined, eta: string) {
  if (!authorLogin) {
    return eta;
  }

  return `@${authorLogin} - ${eta}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error";
}
