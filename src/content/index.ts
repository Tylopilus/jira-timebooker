import {
   createHash,
   parseCalenderDateString,
   getIssueKeyForMeetingName,
   getLocaleFromDocument,
   formatTo24HourFormat,
} from '@/lib/extension-utils';
import { differenceInMilliseconds } from 'date-fns';
console.info('chrome-ext template-react-ts content script');

export type Meeting = {
   id: string;
   startTime: string;
   endTime: string;
   start: string;
   end: string;
   duration: string;
   title: string;
   ticket: string;
   booked: boolean;
   pending: boolean;
   discarded: boolean;
};

async function getMeetings(): Promise<Meeting[]> {
   const meetingElements = [...document.querySelectorAll('div[role=button][class^=root]')];
   if (!meetingElements.length) throw new Error('No meetings found');

   const meetings: Meeting[] = await Promise.all(
      meetingElements.map(async (el): Promise<Meeting> => {
         const matchedLabel = el.ariaLabel?.match(
            /([01]?[0-9]|2[0-3]):([0-5][0-9]) ?([APap][Mm])?/g,
         );
         const start = matchedLabel ? formatTo24HourFormat(matchedLabel[0]) : '00:00';
         console.log({ matchedLabel });
         const end = matchedLabel ? formatTo24HourFormat(matchedLabel[1]) : '00:00';
         const date = getSelectedDay();
         const locale = getLocaleFromDocument(document.documentElement.lang);
         const startTime = await parseCalenderDateString(date, start, locale);
         const endTime = await parseCalenderDateString(date, end, locale);
         const duration = String(differenceInMilliseconds(new Date(endTime), new Date(startTime)));
         const title = el.getAttribute('title')?.split('\n')[0].trim() ?? 'No title';
         const id = await createHash([title, startTime, endTime].join(''));
         const ticketMatch = title.match(/\w+-\d+\s/i);
         const issueForMeeting = await getIssueKeyForMeetingName(title);
         const ticket = ticketMatch ? ticketMatch[0].trim() : issueForMeeting;
         return {
            id,
            startTime,
            endTime,
            duration,
            start,
            end,
            title,
            ticket,
            booked: false,
            pending: false,
            discarded: false,
         };
      }),
   ).catch((err) => {
      console.log(err);
      return [];
   });
   return meetings;
}

function getSelectedDay(): string {
   const date = document
      .querySelector('#leftPaneContainer')!
      .querySelector('[aria-selected=true] button')!
      .getAttribute('aria-label')!;
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
