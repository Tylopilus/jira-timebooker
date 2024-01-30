import { SettingsFormValues } from '@/options/Options';
import { useQuery } from '@tanstack/react-query';
import { getLastUsedIssues } from './extension-utils';

async function getJiraOptions(): Promise<SettingsFormValues> {
   const jiraOptions = (await chrome.storage.sync.get([
      'email',
      'jiraBaseUrl',
      'jiraToken',
      'jiraDefaultTicket',
      'jiraRoundUpTo15min',
   ])) as SettingsFormValues;
   return jiraOptions;
}

export type JiraIssue = {
   id: string;
   key: string;
   fields: {
      summary: string;
      labels?: string[];
      issuetype?: {
         name: string;
      };
      status?: {
         name: string;
      };
   };
};

type SearchProps = {
   query: string;
} & Partial<SettingsFormValues>;
export async function searchJira(_props: SearchProps): Promise<Array<JiraIssue>> {
   const jiraOptions = await getJiraOptions();
   const props: SearchProps = { ..._props, ...jiraOptions };
   if (!props.query) {
      return getLastUsedIssues();
   }
   // const props = { query: 'abc' };
   let url = `${props.jiraBaseUrl}/rest/api/3/search?jql=`;
   const matchProjectRegex = new RegExp(/(^#\w+\W)(.*)/i);

   if (matchProjectRegex.test(props.query)) {
      const projectMatch = props.query.match(matchProjectRegex);
      const project = (projectMatch && projectMatch[1].replace('#', '')) || '';
      const summary = (projectMatch && projectMatch[2]) || '';
      const searchParam = `project = ${project}`;
      url = url.concat(`${searchParam} and summary ~ ${summary}`);
   } else if (/\w+-\d+/i.test(props.query)) {
      url = url.concat(`issue = ${props.query}`);
   } else {
      const searchParam = `summary ~ "${props.query}"`;
      url = url.concat(searchParam);
   }
   const result = await fetch(url, {
      headers: {
         'Content-Type': 'application/json',
         Authorization: `Basic ${btoa(`${props.email}:${props.jiraToken}`)}`,
         Accept: 'application/json',
         'X-Atlassian-Token': 'no-check',
      },
   })
      .then((res) => res.json())
      .then((res): JiraIssue[] => {
         return res.issues || [];
      });

   const lastUsedIssues = await getLastUsedIssues();

   const searchWords = props.query.split(' ');

   const filteredIssues = lastUsedIssues.filter((issue) => {
      const summaryWords = issue.fields.summary.split(' ');
      return searchWords.every((word) => {
         return (
            summaryWords.some((summaryWord) =>
               summaryWord.toLowerCase().includes(word.toLowerCase()),
            ) || issue.key.toLowerCase().includes(word.toLowerCase())
         );
      });
   });

   const mergedIssues = [
      ...filteredIssues,
      ...result.filter((issue) => !filteredIssues.find((i) => i.key === issue.key)),
   ];

   return mergedIssues;
}

type BookTimeOnIssueProps = {
   issueId: string;
   startTime: string;
   endTime: string;
   title: string;
   durationInMS: number;
};

export async function bookTimeOnIssue(props: BookTimeOnIssueProps) {
   const jiraOptions = await getJiraOptions();
   const res = await fetch(`${jiraOptions.jiraBaseUrl}/rest/api/3/issue/${props.issueId}/worklog`, {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json',
         Authorization: `Basic ${btoa(`${jiraOptions.email}:${jiraOptions.jiraToken}`)}`,
         Accept: 'application/json',
         'X-Atlassian-Token': 'no-check',
      },
      body: JSON.stringify({
         comment: {
            content: [
               {
                  content: [
                     {
                        text: props.title,
                        type: 'text',
                     },
                  ],
                  type: 'paragraph',
               },
            ],
            type: 'doc',
            version: 1,
         },
         started: props.startTime.replace('Z', '+0000'),
         timeSpentSeconds: String(props.durationInMS / 1000),
      }),
   });
   if (res.status === 201) {
      return res.json();
   }
   throw new Error(await res.json());
}

export async function searchJiraIssue(props: SearchProps): Promise<Array<JiraIssue>> {
   const issues = await searchJira(props);
   const res = issues.map((issue) => ({
      id: issue.id,
      key: issue.key,
      fields: { summary: issue.fields.summary },
   }));
   return res;
}

async function getIssueDetails(issueId: string): Promise<JiraIssue> {
   const jiraOptions = await getJiraOptions();
   const res = await fetch(`${jiraOptions.jiraBaseUrl}/rest/api/3/issue/${issueId}`, {
      headers: {
         'Content-Type': 'application/json',
         Authorization: `Basic ${btoa(`${jiraOptions.email}:${jiraOptions.jiraToken}`)}`,
         Accept: 'application/json',
         'X-Atlassian-Token': 'no-check',
      },
   });
   if (res.status === 200) {
      return res.json();
   }
   throw new Error(await res.json());
}

export function useIssueDetails(issueId: string): JiraIssue | undefined {
   return useQuery(['issueDetails', issueId], () => getIssueDetails(issueId), {
      enabled: !!issueId,
      refetchOnMount: false,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
   }).data;
}

export function useJiraSearch(s: string) {
   return useQuery(['jiraSearch', s], () => searchJiraIssue({ query: s }), {
      refetchOnMount: false,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
   });
}

export function useRoundUp() {
   const jiraOptions = useQuery(['jiraOptions'], getJiraOptions, {
      refetchOnMount: false,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
   });
   return jiraOptions.data?.jiraRoundUpTo15min;
}
