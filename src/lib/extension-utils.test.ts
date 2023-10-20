import { Meeting } from '@/content';
import { test } from 'vitest';
import * as sampleData from '../test/sampleData';
import {
   addMeetingBookedByDay,
   createHash,
   getAggregatedMeetings,
   getLocaleFromDocument,
   getMeetingsFromCal,
   getSelectedDay,
   isDurationDivisibleByMinutes,
   parseCalenderDateString,
   round24hStringToNearestMinutes,
   roundDurationToNearestMinutes,
   roundTimeToNearestMinutes,
} from './extension-utils';

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

      expect(aggregatedMeetings).toHaveLength(4);
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

      expect(meetings).toHaveLength(4);
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
            local: {
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

   test('parseCalendarDatString', async () => {
      type referenceDatesType = { date: string; locale: keyof typeof import('date-fns/locale') };
      const referenceDates: Array<referenceDatesType> = [
         { date: '10, October, 2023', locale: 'enUS' },
         { date: '10, Oktober, 2023', locale: 'de' },
      ];
      const date = new Date('10. October 2023 9:00').toISOString();
      for await (const referenceDate of referenceDates) {
         const parsedDate = await parseCalenderDateString(
            referenceDate.date,
            '9:00',
            referenceDate.locale,
         );
         expect(parsedDate).toEqual(date);
      }
   });

   test('getLocaleFromDocument', () => {
      expect(getLocaleFromDocument('de')).toEqual('de');
      expect(getLocaleFromDocument('en')).toEqual('enUS');
      expect(getLocaleFromDocument('en-US')).toEqual('enUS');
      expect(getLocaleFromDocument('en-CA')).toEqual('enCA');
      expect(() => getLocaleFromDocument('de-DE')).toThrowError();
   });

   test('roundTimeToNearestMinutes', () => {
      for (const meeting of sampleData.meetings) {
         const roundedDate = roundTimeToNearestMinutes(new Date(meeting.endTime), 15);
         expect(roundedDate.toISOString()).toMatch(
            /:00:00.000Z$|:15:00.000Z$|:30:00.000Z$|:45:00.000Z$/,
         );
      }
   });

   test('round24hStringToNearestMinutes', () => {
      expect(round24hStringToNearestMinutes('08:50', 15)).toEqual('09:00');
      expect(round24hStringToNearestMinutes('10:50', 15)).toEqual('11:00');
      expect(round24hStringToNearestMinutes('10:00', 15)).toEqual('10:00');
      expect(round24hStringToNearestMinutes('10:15', 15)).toEqual('10:15');
      expect(round24hStringToNearestMinutes('10:16', 15)).toEqual('10:30');
      expect(round24hStringToNearestMinutes('23:46', 15)).toEqual('00:00');
   });

   test('roundDurationToNearestMinutes', () => {
      for (const meeting of sampleData.meetings) {
         const { duration } = meeting;
         const adjustedDuration = roundDurationToNearestMinutes(Number(duration), 15);

         expect(isDurationDivisibleByMinutes(adjustedDuration, 15)).toEqual(true);
      }
   });
});
