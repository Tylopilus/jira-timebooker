import { SettingsFormValues } from '@/options/Options';
import { Meeting } from '../content';

export function getCalEntries(cb: (response: Meeting[]) => void) {
   // if (import.meta.env.MODE === 'testing') {
   //    const meetings = [
   //       {
   //          id: 'dd2cd604-999d-41be-822f-b48f57ebf340',
   //          startTime: '2023-09-20T07:30:00.000Z',
   //          endTime: '2023-09-20T09:00:00.000Z',
   //          start: '09:30',
   //          end: '11:00',
   //          title: 'webasto absprache w/ MAL',
   //          ticket: 'CWAL-1',
   //          booked: false,
   //          pending: false,
   //       },
   //       {
   //          id: '73ad973e-cde0-4084-bf8c-3d3ff808017e',
   //          startTime: '2023-09-20T08:00:00.000Z',
   //          endTime: '2023-09-20T08:30:00.000Z',
   //          start: '10:00',
   //          end: '10:30',
   //          title: 'Abgesagt: Branchenanimation - Weekly Jour Fixe',
   //          ticket: 'CWAL-1',
   //          booked: false,
   //          pending: false,
   //       },
   //       {
   //          id: 'a81411cc-5231-4867-b983-86af15c7b4d9',
   //          startTime: '2023-09-20T09:00:00.000Z',
   //          endTime: '2023-09-20T09:30:00.000Z',
   //          start: '11:00',
   //          end: '11:30',
   //          title: 'ePlan ALM // MVP Last tasks',
   //          ticket: 'CWAL-1',
   //          booked: false,
   //          pending: false,
   //       },
   //       {
   //          id: '6ef6bce7-d822-4f22-a593-96397cc7a921',
   //          startTime: '2023-09-20T09:30:00.000Z',
   //          endTime: '2023-09-20T09:45:00.000Z',
   //          start: '11:30',
   //          end: '11:45',
   //          title: 'extended',
   //          ticket: 'CWAL-1',
   //          booked: false,
   //          pending: false,
   //       },
   //       {
   //          id: '92dbb3bc-835d-46f0-84a3-037e577b5627',
   //          startTime: '2023-09-20T09:45:00.000Z',
   //          endTime: '2023-09-20T10:00:00.000Z',
   //          start: '11:45',
   //          end: '12:00',
   //          title: 'Munich Re - Alignment',
   //          ticket: 'CWAL-1',
   //          booked: false,
   //          pending: false,
   //       },
   //       {
   //          id: '09faabdb-1761-4d53-8eb7-fb8f349e292d',
   //          startTime: '2023-09-20T10:00:00.000Z',
   //          endTime: '2023-09-20T10:15:00.000Z',
   //          start: '12:00',
   //          end: '12:15',
   //          title: 'extended',
   //          ticket: 'CWAL-1',
   //          booked: false,
   //          pending: false,
   //       },
   //       {
   //          id: '9729b720-c4ce-4ebc-b1b2-e46060d0e729',
   //          startTime: '2023-09-20T11:15:00.000Z',
   //          endTime: '2023-09-20T12:00:00.000Z',
   //          start: '13:15',
   //          end: '14:00',
   //          title: 'Weekly // Migration AIDA Bilddatenbank',
   //          ticket: 'CWAL-1',
   //          booked: false,
   //          pending: false,
   //       },
   //       {
   //          id: 'ad5ffe6b-cfc3-4736-8e31-898ea86e9799',
   //          startTime: '2023-09-20T11:45:00.000Z',
   //          endTime: '2023-09-20T12:30:00.000Z',
   //          start: '13:45',
   //          end: '14:30',
   //          title: 'Sonova Guides Estimations',
   //          ticket: 'CWAL-1',
   //          booked: false,
   //          pending: false,
   //       },
   //       {
   //          id: '39044870-358c-406d-bebb-c0b36857ab58',
   //          startTime: '2023-09-20T12:30:00.000Z',
   //          endTime: '2023-09-20T13:15:00.000Z',
   //          start: '14:30',
   //          end: '15:15',
   //          title: 'WEB - test findings discussion',
   //          ticket: 'CWAL-1',
   //          booked: false,
   //          pending: false,
   //       },
   //       {
   //          id: 'eafdb74f-0e0f-4b3f-ab88-ea87aa49bd1e',
   //          startTime: '2023-09-20T13:00:00.000Z',
   //          endTime: '2023-09-20T13:30:00.000Z',
   //          start: '15:00',
   //          end: '15:30',
   //          title: 'Solution Finder Workshop - Alignment & Next Steps',
   //          ticket: 'CWAL-1',
   //          booked: false,
   //          pending: false,
   //       },
   //       {
   //          id: '4e2449ca-d3da-471b-8cc1-e35736369a03',
   //          startTime: '2023-09-20T13:30:00.000Z',
   //          endTime: '2023-09-20T14:00:00.000Z',
   //          start: '15:30',
   //          end: '16:00',
   //          title: 'ePlan | OneTrust Cookie Consent Manager',
   //          ticket: 'CWAL-1',
   //          booked: false,
   //          pending: false,
   //       },
   //       {
   //          id: 'bbaed56d-7bb0-4a73-8658-f610bf5ac60e',
   //          startTime: '2023-09-20T14:00:00.000Z',
   //          endTime: '2023-09-20T16:00:00.000Z',
   //          start: '16:00',
   //          end: '18:00',
   //          title: 'jira booking',
   //          ticket: 'CWAL-1',
   //          booked: false,
   //          pending: false,
   //       },
   //    ];
   //    cb(meetings);
   //    return;
   // }
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
