import { SettingsFormValues } from '@/options/Options';
import { Meeting } from '../content';

export function getCalEntries(cb: (response: Meeting[]) => void) {
   chrome.runtime.sendMessage('getCalEntries', cb);
}

export function openOptionsPage() {
   if (import.meta.env.MODE === 'testing') {
      window.location.href = '/options.html';
      return;
   }
   chrome.runtime.openOptionsPage();
}

async function testConnection(data: SettingsFormValues) {
   try {
      const test = await fetch(`${data.jiraBaseUrl}/rest/api/3/issue/${data.jiraDefaultTicket}`, {
         headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${btoa(`${data.email}:${data.jiraToken}`)}`,
            Accept: 'application/json',
            'X-Atlassian-Token': 'no-check',
         },
      });
      if (test.status !== 200) {
         throw new Error('Could not connect to Jira');
      }
   } catch (e) {
      throw new Error('Could not connect to Jira');
   }
}
export async function storeData(data: SettingsFormValues) {
   try {
      await testConnection(data);
      if (import.meta.env.MODE === 'testing') {
         return;
      }
      await chrome.storage.sync.set(data);
   } catch (e) {
      throw e;
   }
}

export async function getIssueForMeeting(meeting: string) {
   try {
      const { bookedMeetings } = await chrome.storage.sync.get(['bookedMeetings']);
      if (bookedMeetings && Object.keys(bookedMeetings).includes(meeting)) {
         return bookedMeetings[meeting];
      }
      return chrome.storage.sync.get('jiraDefaultTicket').then((data) => data.jiraDefaultTicket);
   } catch (e) {
      console.error(e);
      return chrome.storage.sync.get('jiraDefaultTicket').then((data) => data.jiraDefaultTicket);
   }
}

export async function storeIssueForMeeting(meeting: string, issue: string) {
   const bookedMeetings = await chrome.storage.sync.get('bookedMeetings');
   bookedMeetings[meeting] = issue;
   const res = await chrome.storage.sync.set({ bookedMeetings });
}

export async function clearBookedMeetings() {
   await chrome.storage.sync.set({ bookedMeetings: {} });
}
