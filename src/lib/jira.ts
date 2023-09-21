import { SettingsFormValues } from '@/options/Options';
import { useQuery } from '@tanstack/react-query';

async function getJiraOptions(): Promise<SettingsFormValues> {
   // if (import.meta.env.MODE === 'testing') {
   //    return {
   //       email: '',
   //       jiraBaseUrl: '',
   //       jiraToken: '',
   //       jiraDefaultTicket: '',
   //    };
   // }
   const { email, jiraBaseUrl, jiraToken, jiraDefaultTicket } = await chrome?.storage?.sync?.get([
      'email',
      'jiraBaseUrl',
      'jiraToken',
      'jiraDefaultTicket',
   ]);
   return { email, jiraBaseUrl, jiraToken, jiraDefaultTicket };
}

type JiraIssue = {
   id: string;
   key: string;
   fields: {
      summary: string;
   };
};
export async function getLastUsedIssues(): Promise<Array<JiraIssue>> {
   if (import.meta.env.MODE === 'testing') {
      return [
         {
            id: '0',
            key: 'CLA-0',
            fields: {
               summary: 'No results found',
            },
         },
         {
            id: '1',
            key: 'CLA-1',
            fields: {
               summary: 'results found',
            },
         },
      ];
   }

   return chrome.storage.local.get(['lastUsedIssues']).then((res) => res.lastUsedIssues || []);
}

export async function addLastUsedIssue(issue: JiraIssue) {
   const lastUsedIssues = await getLastUsedIssues();
   const newIssues = [issue, ...lastUsedIssues.filter((i) => i.id !== issue.id)];
   return chrome.storage.local.set({ lastUsedIssues: newIssues });
}

type SearchProps = {
   query: string;
} & Partial<SettingsFormValues>;
export async function searchJira(_props: SearchProps): Promise<Array<JiraIssue>> {
   const jiraOptions = await getJiraOptions();
   const props: SearchProps = { ..._props, ...jiraOptions };
   if (props.query === '') {
      return getLastUsedIssues();
   }
   const searchParam = props.query.match(/\w+-\d+/i)
      ? `issue = ${props.query}`
      : `summary ~ ${props.query}`;
   const url = `${props.jiraBaseUrl}/rest/api/3/search?jql=${searchParam}`;
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

export async function searchJiraIssue(props: SearchProps) {
   const issues = await searchJira(props);
   const res = issues.map((issue: any) => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
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
