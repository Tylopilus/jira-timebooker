import { SettingsFormValues } from '@/options/Options';
import { Meeting } from '../content';

function getAggregatedMeetings(
   meetings: Meeting[],
   todaysMeetings: Array<string>,
   bookedMeetingTitles: Record<string, string>,
): Meeting[] {
   const aggregatedMeetings = meetings.map((meeting) => {
      const booked = todaysMeetings.includes(meeting.id);
      const aggregatedMeeting = {
         ...meeting,
         booked,
      };
      if (booked) {
         for (const [key, value] of Object.entries(bookedMeetingTitles)) {
            if (key === meeting.title) {
               aggregatedMeeting.ticket = value;
            }
         }
      }
      return aggregatedMeeting;
   });

   return aggregatedMeetings;
}

export async function getSelectedDay(): Promise<string> {
   const selectedDay = await chrome.runtime.sendMessage('getSelectedDay');
   return new Date(selectedDay).toLocaleDateString();
}

export async function addMeetingBookedByDay(today: string, meeting: Meeting) {
   const { meetingsBookedByDay = {} } = await chrome.storage.sync.get('meetingsBookedByDay');
   if (meetingsBookedByDay[today]) {
      meetingsBookedByDay[today].push(meeting.id);
   } else {
      meetingsBookedByDay[today] = [meeting.id];
   }
   chrome.storage.sync.set({ meetingsBookedByDay });
}

export async function getMeetingsFromCal(): Promise<Meeting[]> {
   const meetings = await chrome.runtime.sendMessage('getCalEntries');
   const { meetingsBookedByDay = {} } = await chrome.storage.sync.get('meetingsBookedByDay');
   const todaysBookedMeetings = meetingsBookedByDay[await getSelectedDay()] || [];
   const { bookedMeetings: bookedMeetingTitles } = await chrome.storage.sync.get('bookedMeetings');

   const aggregatedMeetings = getAggregatedMeetings(
      meetings,
      todaysBookedMeetings,
      bookedMeetingTitles,
   );
   return aggregatedMeetings;
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

export async function getIssueKeyForMeetingName(meetingTitle: string) {
   try {
      const { bookedMeetings } = await chrome.storage.sync.get(['bookedMeetings']);
      if (bookedMeetings && Object.keys(bookedMeetings).includes(meetingTitle)) {
         return bookedMeetings[meetingTitle];
      }
      return chrome.storage.sync.get('jiraDefaultTicket').then((data) => data.jiraDefaultTicket);
   } catch (e) {
      console.error(e);
      return chrome.storage.sync.get('jiraDefaultTicket').then((data) => data.jiraDefaultTicket);
   }
}

export async function saveIssueKeyForMeetingName(meeting: string, issue: string) {
   const { bookedMeetings } = await chrome.storage.sync.get('bookedMeetings');
   bookedMeetings[meeting] = issue;
   const res = await chrome.storage.sync.set({ bookedMeetings });
}

export async function clearBookedMeetings() {
   await chrome.storage.sync.set({ bookedMeetings: {} });
}

export async function createHash(message: string): Promise<string> {
   const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
   const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8); // hash the message
   const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
   const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
   return hashHex;
}
