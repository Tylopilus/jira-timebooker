import { SettingsFormValues } from '@/options/Options';
import * as dateLocales from 'date-fns/locale';
import parse from 'date-fns/parse';
import { Meeting } from '../content';
import { JiraIssue, searchJiraIssue } from './jira';

export function getAggregatedMeetings(
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
   const { meetingsBookedByDay = {} } = await chrome.storage.local.get('meetingsBookedByDay');
   if (meetingsBookedByDay[today]) {
      meetingsBookedByDay[today].push(meeting.id);
   } else {
      meetingsBookedByDay[today] = [meeting.id];
   }
   chrome.storage.local.set({ meetingsBookedByDay });
}

export async function getMeetingsFromCal(): Promise<Meeting[]> {
   const meetings = await chrome.runtime.sendMessage('getCalEntries');
   const { meetingsBookedByDay = {} } = await chrome.storage.local.get('meetingsBookedByDay');
   const todaysBookedMeetings = meetingsBookedByDay[await getSelectedDay()] || [];
   const { bookedMeetings: bookedMeetingTitles = {} } = await chrome.storage.local.get(
      'bookedMeetings',
   );

   console.log({ meetings, todaysBookedMeetings, bookedMeetingTitles });
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

export async function storeJiraSettings(data: SettingsFormValues) {
   await testConnection(data);
   if (import.meta.env.MODE === 'testing') {
      return;
   }
   await chrome.storage.sync.set(data);
}

export async function getIssueKeyForMeetingName(meetingTitle: string) {
   try {
      const { bookedMeetings = {} } = await chrome.storage.local.get(['bookedMeetings']);
      if (Object.keys(bookedMeetings).includes(meetingTitle)) {
         return bookedMeetings[meetingTitle];
      }
      return chrome.storage.sync.get('jiraDefaultTicket').then((data) => data.jiraDefaultTicket);
   } catch (e) {
      console.error(e);
      return chrome.storage.sync.get('jiraDefaultTicket').then((data) => data.jiraDefaultTicket);
   }
}

export async function saveIssueKeyForMeetingName(meeting: string, issue: string) {
   const { bookedMeetings = {} } = await chrome.storage.local.get('bookedMeetings');
   bookedMeetings[meeting] = issue;
   await chrome.storage.local.set({ bookedMeetings });
}

export async function clearBookedMeetings() {
   await chrome.storage.local.set({ bookedMeetings: {} });
}

export async function createHash(message: string): Promise<string> {
   const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
   const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8); // hash the message
   const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
   const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
   return hashHex;
}

export async function getLastUsedIssues(): Promise<Array<JiraIssue>> {
   return chrome.storage.local.get(['lastUsedIssues']).then((res) => res.lastUsedIssues || []);
}

export async function clearLastUsedIssues() {
   chrome.storage.local.set({ lastUsedIssues: [] });
}

export async function addLastUsedIssue(issue: Pick<JiraIssue, 'key'>) {
   const lastUsedIssues = await getLastUsedIssues();
   const jiraIssue = await searchJiraIssue({ query: issue.key });
   const newIssues = [jiraIssue[0], ...lastUsedIssues.filter((i) => i.key !== jiraIssue[0].key)];
   return chrome.storage.local.set({ lastUsedIssues: newIssues });
}

export async function parseCalenderDateString(
   date: string,
   time: string,
   locale: keyof typeof dateLocales,
): Promise<string> {
   const parsedDateString = parse([date, time].join(' '), 'dd, MMMM, yyyy HH:mm', new Date(), {
      locale: dateLocales[locale],
   }).toISOString();
   return parsedDateString;
}

export function getLocaleFromDocument(lang: string): keyof typeof dateLocales {
   let _lang = lang
      .split('-')
      .map((item, idx) => (idx > 0 ? item.toUpperCase() : item))
      .join('');
   if (_lang === 'en') {
      _lang = 'enUS';
   }

   const locales = Object.keys(dateLocales);
   if (!locales.includes(_lang as keyof typeof dateLocales)) {
      throw new Error(`Locale ${_lang} not found`);
   }
   return _lang as keyof typeof dateLocales;
}

export function roundTimeToNearestMinutes(date: Date, minutes: number) {
   const ms = 1000 * 60 * minutes; // convert minutes to ms
   const roundedDate = new Date(Math.ceil(date.getTime() / ms) * ms);
   return roundedDate;
}
