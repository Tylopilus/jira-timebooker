import { SettingsFormValues } from '@/options/Options';
import { useQuery } from '@tanstack/react-query';
import { getLastUsedIssues } from './extension-utils';

async function getJiraOptions(): Promise<SettingsFormValues> {
   const { email, jiraBaseUrl, jiraToken, jiraDefaultTicket } = await chrome.storage.sync.get([
      'email',
      'jiraBaseUrl',
      'jiraToken',
      'jiraDefaultTicket',
   ]);
   return { email, jiraBaseUrl, jiraToken, jiraDefaultTicket };
}

export type JiraIssue = {
   id: string;
   key: string;
   fields: {
      summary: string;
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
   console.log({ url });
   return fetch(url, {
      headers: {
         'Content-Type': 'application/json',
         Authorization: `Basic ${btoa(`${props.email}:${props.jiraToken}`)}`,
         Accept: 'application/json',
         'X-Atlassian-Token': 'no-check',
      },
   })
      .then((res) => res.json())
      .then((res) => {
         return res.issues || [];
      });
}

type BookTimeOnIssueProps = {
   issueId: string;
   startTime: string;
   endTime: string;
   title: string;
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
         timeSpentSeconds:
            (new Date(props.endTime).getTime() - new Date(props.startTime).getTime()) / 1000,
      }),
   });
   if (res.status === 201) {
      return res.json();
   }
   throw new Error(await res.json());
}

export async function searchJiraIssue(props: SearchProps): Promise<Array<JiraIssue>> {
   const issues = await searchJira(props);
   const res = issues.map((issue: any) => ({
      id: issue.id,
      key: issue.key,
      fields: { summary: issue.fields.summary },
   }));
   return res;
}

export function useJiraSearch(s: string) {
   return useQuery(['jiraSearch', s], () => searchJiraIssue({ query: s }), {
      refetchOnMount: false,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
   });
}
