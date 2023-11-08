import { Button } from '@/components/ui/button';
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from '@/components/ui/card';
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandItem,
   CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Toaster } from '@/components/ui/toaster';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { Meeting } from '@/content';
import {
   addLastUsedIssue,
   addMeetingBookedByDay,
   getMeetingsFromCal,
   getSelectedDay,
   isDurationDivisibleByMinutes,
   openOptionsPage,
   roundDurationToNearestMinutes,
   saveIssueKeyForMeetingName,
} from '@/lib/extension-utils';
import { bookTimeOnIssue, useJiraSearch, useRoundUp } from '@/lib/jira';
import { cn, useDebounce } from '@/lib/utils';
import { CalendarOff, Loader2, Search, Send, Settings } from 'lucide-react';
import { ReactElement, useEffect, useRef, useState, useTransition } from 'react';

function App() {
   const [items, setItems] = useState<Meeting[]>();
   const [isUpdating, setUpdating] = useState(false);
   const [, startTransition] = useTransition();

   useEffect(() => {
      const getMeetings = async () => {
         const meetings = await getMeetingsFromCal();
         setItems(meetings);
      };
      getMeetings();
   }, []);

   async function bookMeeting(meeting: Meeting): Promise<void> {
      updateMeeting(meeting, { pending: true });
      try {
         await bookTimeOnIssue({
            issueId: meeting.ticket,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            title: meeting.title,
            durationInMS: +meeting.duration,
         });
         await updateMeeting(meeting, { pending: false, booked: true });
         const selectedDay = await getSelectedDay();
         await addMeetingBookedByDay(selectedDay, meeting);
         await addLastUsedIssue({
            key: meeting.ticket,
         });

         await saveIssueKeyForMeetingName(meeting.title, meeting.ticket);
         toast({
            title: 'Success',
            description: `Booked ${meeting.title} on ${meeting.ticket}`,
         });
      } catch (e) {
         const { message } = e instanceof Error ? e : { message: 'unknown error' };
         console.log('unable to book meeting', message);
         updateMeeting(meeting, { pending: false, booked: false });
         toast({
            title: 'Error',
            description: `Unable to book ${meeting.title} on ${meeting.ticket}`,
            variant: 'destructive',
         });
      }
   }
   async function updateMeeting(meeting: Meeting, update?: Partial<Meeting>) {
      setItems((items) =>
         items?.map((item) => {
            if (item.id === meeting.id) {
               return { ...meeting, ...update };
            }
            return item;
         }),
      );
   }

   return (
      <main className='mx-auto px-2 min-w-[600px] my-4 max-w-[600px]'>
         <Card>
            <CardHeader className='p-4 pr-2'>
               <div className='flex justify-between items-center'>
                  <div className='flex-col space-y-1.5 '>
                     <CardTitle>Jira Timebookings</CardTitle>
                     <CardDescription>
                        Get the times from your meetings and book them in Jira
                     </CardDescription>
                  </div>

                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Button
                           onClick={() => {
                              openOptionsPage();
                           }}
                           variant={'ghost'}
                        >
                           <Settings className='h-4 w-4 mr-2' /> Options
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>
                        <p>Open options page</p>
                     </TooltipContent>
                  </Tooltip>
               </div>
            </CardHeader>
            <CardContent className='p-4 pr-2'>
               <div className='card-content space-y-6 max-h-[380px] min-h-[300px] overflow-y-scroll'>
                  {items?.map((item) => (
                     <IssueEntry
                        meeting={item}
                        updateMeeting={updateMeeting}
                        bookMeeting={bookMeeting}
                        key={item.id}
                     />
                  ))}
               </div>
            </CardContent>
            <CardFooter className='justify-between pt-4 p-4 pr-6'>
               <div>
                  <Duration meetings={items} />
               </div>
               <Button
                  onClick={async () => {
                     setUpdating(true);
                     for (const meeting of items ?? []) {
                        if (meeting.booked || meeting.discarded) continue;
                        await bookMeeting(meeting);
                     }
                     startTransition(() => setUpdating(false));
                  }}
               >
                  {isUpdating ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : null} Book all
               </Button>
            </CardFooter>
         </Card>
         <Toaster />
      </main>
   );
}

export default App;

function IssueEntry({
   meeting,
   updateMeeting,
   bookMeeting,
}: {
   meeting: Meeting;
   updateMeeting: (meeting: Meeting, update?: Partial<Meeting>) => Promise<void>;
   bookMeeting: (meeting: Meeting) => Promise<void>;
}): ReactElement {
   const meetingDurationRef = useRef(meeting.duration);
   const [open, setOpen] = useState(false);
   const [isUpdating, setUpdating] = useState(false);
   const [, startTransition] = useTransition();

   const [search, setSearch] = useState<string>(meeting.ticket);
   const debouncedValue = useDebounce<string>(search, 500);
   const { isFetching, data } = useJiraSearch(debouncedValue);
   const [edit, setEdit] = useState(false);

   const roundUpToFull15Minutes = useRoundUp();
   const shouldRoundUp =
      (roundUpToFull15Minutes && !isDurationDivisibleByMinutes(+meeting.duration, 15)) || false;
   if (shouldRoundUp) {
      meetingDurationRef.current = roundDurationToNearestMinutes(+meeting.duration, 15).toString();
   }
   return (
      <div className='flex justify-between'>
         <div className='w-full'>
            {edit ? (
               <div className='pr-4'>
                  <Input
                     defaultValue={meeting.title}
                     ref={(inputElement) => {
                        if (!inputElement) return;

                        inputElement.select();
                     }}
                     onBlur={(event) => {
                        updateMeeting(meeting, { title: event.target.value });
                        setEdit(false);
                     }}
                     onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                           event.preventDefault();
                           setEdit(false);
                        }
                     }}
                     className='p-0 font-medium shadow-none border-0 focus-visible:ring-0 focus-visible:border-b focus-visible:border-primary'
                  />
               </div>
            ) : (
               <Button
                  variant={'link'}
                  size={'default'}
                  className='px-0 justify-start text-left py-0 h-auto'
                  onClick={() => setEdit(true)}
               >
                  {meeting.title}
               </Button>
            )}
            {shouldRoundUp ? (
               <Tooltip>
                  <TooltipTrigger asChild>
                     <p
                        className={cn(
                           {
                              'border-b border-dashed cursor-help border-primary': shouldRoundUp,
                           },
                           'text-sm text-muted-foreground max-w-min whitespace-nowrap',
                        )}
                     >
                        {meeting.start}h - {meeting.end}h
                     </p>
                  </TooltipTrigger>
                  <TooltipContent side='bottom'>
                     <p>
                        Duration of Meeting does not round to 15 minutes. Booked time will be
                        adjusted
                     </p>
                  </TooltipContent>
               </Tooltip>
            ) : (
               <p
                  className={cn(
                     {
                        'border-b border-dashed cursor-help border-primary': shouldRoundUp,
                     },
                     'text-sm text-muted-foreground max-w-min whitespace-nowrap',
                  )}
               >
                  {meeting.start}h - {meeting.end}h
               </p>
            )}
         </div>
         <div className='flex items-center gap-2'>
            <Popover open={open} onOpenChange={setOpen}>
               <PopoverTrigger asChild>
                  <Button
                     variant='outline'
                     disabled={meeting.booked || meeting.discarded}
                     className='w-[140px] justify-center'
                  >
                     {meeting.ticket}
                  </Button>
               </PopoverTrigger>
               <PopoverContent className='p-0' side='bottom' align='start'>
                  <Command>
                     <div className='flex items-center border-b px-3'>
                        <Search className='mr-2 h-4 w-4 shrink-0 opacity-50' />
                        <Input
                           className={
                              'flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none focus-visible:ring-0'
                           }
                           value={search}
                           onChange={(e) => setSearch(e.target.value)}
                           placeholder='Search issue...'
                        />
                        {isFetching && <Loader2 className='h-4 w-4 animate-spin' />}
                     </div>
                     <CommandList className='max-h-[180px]'>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                           {data &&
                              data.map((item) => (
                                 <CommandItem
                                    key={item.id}
                                    onSelect={() => {
                                       updateMeeting(meeting, { ticket: item.key });
                                       setOpen(false);
                                    }}
                                 >
                                    {item.key} - {item.fields.summary}
                                 </CommandItem>
                              ))}
                        </CommandGroup>
                     </CommandList>
                  </Command>
               </PopoverContent>
            </Popover>
            <Tooltip>
               <TooltipTrigger asChild>
                  <Button
                     variant={'ghost'}
                     className='p-2'
                     disabled={meeting.booked || isUpdating || meeting.discarded}
                     onClick={async () => {
                        setUpdating(true);
                        await bookMeeting({ ...meeting, duration: meetingDurationRef.current });
                        startTransition(() => setUpdating(false));
                     }}
                  >
                     {meeting.pending ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                     ) : (
                        <Send className='h-4 w-4' />
                     )}
                  </Button>
               </TooltipTrigger>
               <TooltipContent>
                  <p>Book time on ticket</p>
               </TooltipContent>
            </Tooltip>
            <Tooltip>
               <TooltipTrigger asChild>
                  <Button
                     variant={'ghost'}
                     className='p-2'
                     onClick={() => {
                        updateMeeting(meeting, { discarded: !meeting.discarded });
                     }}
                  >
                     <CalendarOff className='h-4 w-4' />
                  </Button>
               </TooltipTrigger>
               <TooltipContent>
                  <p>Discard this entry</p>
               </TooltipContent>
            </Tooltip>
         </div>
      </div>
   );
}
function Duration({ meetings }: { meetings: Meeting[] | undefined }) {
   const cummulatedMinutes = meetings?.reduce(
      (acc, meeting) => {
         if (meeting.discarded) return acc;
         if (meeting.booked) {
            acc.booked += +meeting.duration / 1000 / 60;
         }
         acc.total += +meeting.duration / 1000 / 60;
         return acc;
      },
      { total: 0, booked: 0 },
   );
   const totalMinutes = cummulatedMinutes?.total;
   const totalBookedMinutes = cummulatedMinutes?.booked || 0;
   if (!totalMinutes) return null;
   const totalHours = Math.floor(totalMinutes / 60);
   const minutes = Math.floor(totalMinutes % 60);
   const bookedHours = Math.floor(totalBookedMinutes / 60);
   const bookedMinutes = Math.floor(totalBookedMinutes % 60);

   return (
      <>
         <div className='font-semibold leading-none tracking-tight text-sm'>
            Time booked <span className='text-muted-foreground font-normal'>(calendar)</span>
         </div>
         <span className='text-primary text-sm'>
            {bookedHours.toString().padStart(2, '0')}h:{bookedMinutes.toString().padStart(2, '0')}m
         </span>{' '}
         <span className='text-muted-foreground text-sm'>
            ({totalHours.toString().padStart(2, '0')}h:{minutes.toString().padStart(2, '0')}m)
         </span>
      </>
   );
}
