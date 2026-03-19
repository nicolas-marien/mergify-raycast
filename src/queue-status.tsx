import { Action, ActionPanel, Icon, List, getPreferenceValues } from "@raycast/api";
import { useMemo } from "react";
import { usePromise } from "@raycast/utils";
import {
  PullRequest,
  Preferences,
  formatBatchSubtitle,
  formatMergeEta,
  getAvatar,
  getMergeQueueStatus,
} from "./lib/mergify";

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const { data: response, isLoading, error } = usePromise(getMergeQueueStatus, [preferences]);

  const repositoryTitle = useMemo(
    () => `${preferences.owner}/${preferences.repository}`,
    [preferences.owner, preferences.repository],
  );

  const waitingPullRequests = response?.waiting_pull_requests ?? [];
  const batches = response?.batches ?? [];
  const errorMessage = error instanceof Error ? error.message : null;

  return (
    <List isLoading={isLoading} navigationTitle="Mergify Queue Status" searchBarPlaceholder="Filter pull requests">
      {errorMessage ? <List.EmptyView title="Unable to load merge queue" description={errorMessage} /> : null}

      {!errorMessage && !isLoading && waitingPullRequests.length === 0 && batches.length === 0 ? (
        <List.EmptyView
          title="Merge queue is empty"
          description={`No waiting PRs or active batches for ${repositoryTitle}.`}
        />
      ) : null}

      {!errorMessage && waitingPullRequests.length > 0 ? (
        <List.Section title="Waiting Pull Requests" subtitle={String(waitingPullRequests.length)}>
          {waitingPullRequests.map((pullRequest) => (
            <List.Item
              key={`waiting-${pullRequest.number}`}
              icon={getAvatar(pullRequest.author)}
              title={`#${pullRequest.number} ${pullRequest.title}`}
              accessories={buildPullRequestAccessories(pullRequest, null)}
              actions={<PullRequestActions url={pullRequest.url} title={pullRequest.title} />}
            />
          ))}
        </List.Section>
      ) : null}

      {!errorMessage
        ? batches.map((batch) => (
            <List.Section
              key={batch.name}
              title={`Batch ${batch.name}`}
              subtitle={formatBatchSubtitle(batch.status.code, batch.checks_summary)}
            >
              {batch.pull_requests.map((pullRequest) => (
                <List.Item
                  key={`batch-${batch.name}-${pullRequest.number}`}
                  icon={getAvatar(pullRequest.author)}
                  title={`#${pullRequest.number} ${pullRequest.title}`}
                  accessories={buildPullRequestAccessories(pullRequest, batch.estimated_merge_at)}
                  actions={<PullRequestActions url={pullRequest.url} title={pullRequest.title} />}
                />
              ))}
            </List.Section>
          ))
        : null}
    </List>
  );
}

function PullRequestActions(props: { url: string; title: string }) {
  return (
    <ActionPanel>
      <Action.OpenInBrowser title="Open Pull Request" url={props.url} />
      <Action.CopyToClipboard title="Copy Pull Request URL" content={props.url} />
      <Action.CopyToClipboard title="Copy Pull Request Title" content={props.title} />
    </ActionPanel>
  );
}

function buildPullRequestAccessories(pullRequest: PullRequest, batchEstimatedMergeAt: string | null | undefined) {
  const accessories: List.Item.Accessory[] = [];

  if (pullRequest.author?.login) {
    accessories.push({ text: `@${pullRequest.author.login}` });
  }

  const etaText = formatMergeEta(pullRequest.estimated_merge_at ?? batchEstimatedMergeAt ?? null);
  accessories.push({ icon: Icon.Clock, text: etaText });

  return accessories;
}
