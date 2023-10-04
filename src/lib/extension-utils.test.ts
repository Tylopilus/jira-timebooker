import { test } from 'vitest';
import {
   addMeetingBookedByDay,
   createHash,
   getAggregatedMeetings,
   getMeetingsFromCal,
   getSelectedDay,
} from './extension-utils';
import * as sampleData from '../test/sampleData';
import { Meeting } from '@/content';

describe('extension-utils', () => {
   test('should create a hash', async () => {
      await expect(createHash('test')).resolves.toEqual(
         '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      );
   });

   test('getSelectedDay', async () => {
      await expect(getSelectedDay()).resolves.toEqual('10/4/2023');
   });

   test('getAggregatedMeetings', async () => {
      const aggregatedMeetings = getAggregatedMeetings(
         sampleData.meetings,
         sampleData.todaysMeetings,
         sampleData.bookedMeetingTitles,
      );

      expect(aggregatedMeetings).toHaveLength(3);
      expect(aggregatedMeetings[0].id).toEqual('1');
      expect(aggregatedMeetings[0].booked).toEqual(true);
      expect(aggregatedMeetings[0].ticket).toEqual('TICKET-1');
      expect(aggregatedMeetings[1].id).toEqual('2');
      expect(aggregatedMeetings[1].booked).toEqual(false);
      expect(aggregatedMeetings[2].id).toEqual('3');
      expect(aggregatedMeetings[2].booked).toEqual(true);
      expect(aggregatedMeetings[2].ticket).toEqual('TICKET-3');
   });

   test('getMeetingsFromCal', async () => {
      // await e;
      const meetings = await getMeetingsFromCal();

      expect(meetings).toHaveLength(3);
      expect(meetings[0].id).toEqual('1');
      expect(meetings[0].booked).toEqual(true);
      expect(meetings[0].ticket).toEqual('TICKET-1');
      expect(meetings[1].id).toEqual('2');
      expect(meetings[1].booked).toEqual(false);
      expect(meetings[2].id).toEqual('3');
      expect(meetings[2].booked).toEqual(true);
      expect(meetings[2].ticket).toEqual('TICKET-3');
   });

   test('addMeetingBookedByDay', async () => {
      const meetingsBookObj = { meetingsBookedByDay: {} };

      const meetingsBookedByDayFn = vi.fn(async () => meetingsBookObj);
      const setMeetingsBookedByDayFn = vi.fn();
      vi.stubGlobal('chrome', {
         storage: {
            sync: {
               get: meetingsBookedByDayFn,
               set: setMeetingsBookedByDayFn,
            },
         },
      });

      await addMeetingBookedByDay('01/4/2023', {
         id: '1',
      } as Meeting);
      expect(meetingsBookedByDayFn).toHaveBeenCalledTimes(1);
      expect(setMeetingsBookedByDayFn).toHaveBeenCalledWith({
         meetingsBookedByDay: { '01/4/2023': ['1'] },
      });

      await addMeetingBookedByDay('01/4/2023', {
         id: '2',
      } as Meeting);
      expect(meetingsBookedByDayFn).toHaveBeenCalledTimes(2);
      expect(setMeetingsBookedByDayFn).toHaveBeenCalledWith({
         meetingsBookedByDay: { '01/4/2023': ['1', '2'] },
      });
   });
});
