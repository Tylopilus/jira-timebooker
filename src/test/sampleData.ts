import { Meeting } from '@/content';
import { differenceInMilliseconds } from 'date-fns';

const meetings: Meeting[] = [
   {
      id: '1',
      startTime: '2023-10-04T07:00:00.000Z',
      endTime: '2023-10-04T08:45:00.000Z',
      start: '09:00',
      end: '10:45',
      duration: differenceInMilliseconds(
         new Date('2023-10-04T08:45:00.000Z'),
         new Date('2023-10-04T07:00:00.000Z'),
      ).toString(),
      title: 'Meeting 1',
      ticket: 'TICKET-1',
      booked: false,
      pending: false,
      discarded: false,
   },
   {
      id: '2',
      startTime: '2023-10-04T08:45:00.000Z',
      endTime: '2023-10-04T09:00:00.000Z',
      start: '10:45',
      end: '11:00',
      duration: '900000',
      title: 'Daily',
      ticket: 'TICKET-2',
      booked: false,
      pending: false,
      discarded: false,
   },
   {
      id: '3',
      startTime: '2023-10-04T09:00:00.000Z',
      endTime: '2023-10-04T11:00:00.000Z',
      start: '11:00',
      end: '13:00',
      duration: '7200000',
      title: 'ticket-123 setup local repo',
      ticket: 'TICKET-123',
      booked: false,
      pending: false,
      discarded: false,
   },
   {
      id: '4',
      startTime: '2023-10-04T09:00:00.000Z',
      endTime: '2023-10-04T11:10:00.000Z',
      start: '11:00',
      end: '13:10',
      duration: '7500000',
      title: 'ticket-123 setup local repo',
      ticket: 'TICKET-123',
      booked: false,
      pending: false,
      discarded: false,
   },
];
const todaysMeetings = ['1', '3'];
const bookedMeetingTitles = { 'Meeting 1': 'TICKET-1', 'ticket-123 setup local repo': 'TICKET-3' };

export { meetings, todaysMeetings, bookedMeetingTitles };
