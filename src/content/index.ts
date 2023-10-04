import { createHash, getIssueKeyForMeetingName } from '@/lib/extension-utils';

console.info('chrome-ext template-react-ts content script');

export {};
export type Meeting = {
   id: string;
   startTime: string;
   endTime: string;
   start: string;
   end: string;
   title: string;
   ticket: string;
   booked: boolean;
   pending: boolean;
};

async function getMeetings(): Promise<Meeting[]> {
   const meetingElements = [...document.querySelectorAll('div[role=button][class^=root]')];
   if (!meetingElements.length) throw new Error('No meetings found');

   const meetings: Meeting[] = await Promise.all(
      meetingElements.map(async (el): Promise<Meeting> => {
         const matchedLabel = el.ariaLabel?.match(/(\d{2}:\d{2}).*(\d{2}:\d{2})/i);
         const start = matchedLabel ? matchedLabel[1] : '00:00';
         const end = matchedLabel ? matchedLabel[2] : '00:00';
         const date = getSelectedDay();
         const startTime = new Date([date, start].join(' ')).toISOString();
         const endTime = new Date([date, end].join(' ')).toISOString();
         const title = el.getAttribute('title')?.split('\n')[0].trim() ?? 'No title';
         const id = await createHash([title, startTime, endTime].join(''));
         const ticketMatch = title.match(/\w+-\d+\s/i);
         const issueForMeeting = await getIssueKeyForMeetingName(title);
         const ticket = ticketMatch ? ticketMatch[0].trim() : issueForMeeting;
         return {
            id,
            startTime,
            endTime,
            start,
            end,
            title,
            ticket,
            booked: false,
            pending: false,
         };
      }),
   );
   return meetings;
}

function getSelectedDay(): string {
   const date = document.querySelector('.YjxmP.zVmbM')?.textContent || new Date().toDateString();
   return date;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
   if (message === 'getCalEntries') {
      getMeetings().then((meetings) => {
         console.log('sending..', meetings);
         sendResponse(meetings);
      });
   }
   if (message === 'getSelectedDay') {
      const selectedDay = getSelectedDay();
      sendResponse(selectedDay);
   }
   return true;
});
