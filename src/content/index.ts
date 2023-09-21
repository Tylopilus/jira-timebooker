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
function getMeetings(): Promise<Meeting[]> {
   return new Promise((resolve, reject) => {
      const meetingElements = [...document.querySelectorAll('div[role=button][class^=root]')];
      if (!meetingElements.length) reject('No meetings found');

      const meetings: Meeting[] = meetingElements.map((el): Meeting => {
         const matchedLabel = el.ariaLabel?.match(/(\d{2}\:\d{2}).*(\d{2}\:\d{2})/i);
         const start = matchedLabel ? matchedLabel[1] : '00:00';
         const end = matchedLabel ? matchedLabel[2] : '00:00';
         const startTime = new Date([new Date().toDateString(), start].join(' ')).toISOString();
         const endTime = new Date([new Date().toDateString(), end].join(' ')).toISOString();
         const title = el.getAttribute('title')?.split('\n')[0].trim() ?? 'No title';
         const id = crypto.randomUUID();
         const ticketMatch = title.match(/\w+-\d+\s/i);
         const ticket = ticketMatch ? ticketMatch[0].trim() : 'CWAL-1';
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
      });
      resolve(meetings);
   });
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
   if (message === 'getCalEntries') {
      getMeetings().then(sendResponse).catch(console.error);
   }
});
