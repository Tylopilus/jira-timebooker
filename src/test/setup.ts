import '@testing-library/jest-dom';
import { bookedMeetingTitles, meetings, todaysMeetings } from './sampleData';

beforeAll(() => {
   const chromeMock = {
      tabs: {
         query: vi.fn((_queryInfo, callback) => {
            callback([{ id: 123 }]);
         }),
         // eslint-disable-next-line @typescript-eslint/no-unused-vars
         create: vi.fn(({ url }: { url: string }) => {}),
      },
      sidePanel: {
         open: vi.fn(),
      },
      commands: {
         getAll: vi.fn(() => {
            return [];
         }),
      },
      runtime: {
         sendMessage: vi.fn(async (msg: string) => {
            switch (true) {
               case msg === 'getSelectedDay': {
                  return 'October 04, 2023';
               }
               case msg === 'getCalEntries': {
                  return meetings;
               }
               default: {
                  return 'should not happen, you idiot';
               }
            }
         }),
      },
      storage: {
         sync: {
            get: vi.fn(async (msg) => {
               switch (true) {
                  case msg === 'meetingsBookedByDay': {
                     return { meetingsBookedByDay: { '10/4/2023': todaysMeetings } };
                  }
                  case msg === 'bookedMeetings': {
                     return { bookedMeetings: bookedMeetingTitles };
                  }
               }
            }),
            set: vi.fn(async () => {}),
         },
         local: {
            get: vi.fn(async (msg) => {
               switch (true) {
                  case msg === 'meetingsBookedByDay': {
                     return { meetingsBookedByDay: { '10/4/2023': todaysMeetings } };
                  }
                  case msg === 'bookedMeetings': {
                     return { bookedMeetings: bookedMeetingTitles };
                  }
               }
            }),
            set: vi.fn(async () => {}),
         },
      },
   };

   vi.stubGlobal('chrome', chromeMock);
});
