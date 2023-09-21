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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Meeting } from '@/content';
import { clearBookedMeetings, getCalEntries, storeIssueForMeeting } from '@/lib/extension-utils';
import { addLastUsedIssue, bookTimeOnIssue, clearLastUsedIssues, useJiraSearch } from '@/lib/jira';
import { useDebounce } from '@/lib/utils';
import { Loader2, RefreshCcw, Search, Send } from 'lucide-react';
import { ReactElement, useEffect, useState, useTransition } from 'react';

function App() {
   const [items, setItems] = useState<Meeting[]>();
   const [isUpdating, setUpdating] = useState(false);
   const [, startTransition] = useTransition();

   useEffect(() => {
      getCalEntries(setItems);
   }, []);

   async function bookMeeting(meeting: Meeting): Promise<void> {
      updateMeeting(meeting, { pending: true });
      try {
         await bookTimeOnIssue({
            issueId: meeting.ticket,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            title: meeting.title,
         });
         updateMeeting(meeting, { pending: false, booked: true });
         addLastUsedIssue({
            key: meeting.ticket,
         });

         storeIssueForMeeting(meeting.title, meeting.ticket);
      } catch (e) {
         const { message } = e instanceof Error ? e : { message: 'unknown error' };
         console.log('unable to book meeting', message);
         updateMeeting(meeting, { pending: false, booked: false });
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
                              getCalEntries(setItems);
                           }}
                           variant={'ghost'}
                        >
                           <RefreshCcw className='h-4 w-4 mr-4' /> refresh
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>
                        <p>Refresh calendar entries</p>
                     </TooltipContent>
                  </Tooltip>
               </div>
            </CardHeader>
            <CardContent className='p-4 pr-2'>
               <div className='space-y-6 max-h-[380px] overflow-y-auto'>
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
            <CardFooter className='justify-end pt-4'>
               <Button
                  variant={'secondary'}
                  onClick={() => {
                     clearLastUsedIssues();
                     clearBookedMeetings();
                  }}
               >
                  Settings
               </Button>
               <Button
                  onClick={async () => {
                     setUpdating(true);
                     await Promise.allSettled(
                        items?.map((meeting) => (meeting.booked ? null : bookMeeting(meeting))) ??
                           [],
                     );
                     startTransition(() => setUpdating(false));
                  }}
               >
                  {isUpdating ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : null} Book all
               </Button>
            </CardFooter>
         </Card>
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
   const [open, setOpen] = useState(false);
   const [isUpdating, setUpdating] = useState(false);
   const [, startTransition] = useTransition();

   const [search, setSearch] = useState<string>(meeting.ticket);
   const debouncedValue = useDebounce<string>(search, 500);
   const { isFetching, isError, data, error } = useJiraSearch(debouncedValue);

   return (
      <div className='flex justify-between'>
         <div>
            <p className='text-sm font-medium leading-none'>{meeting.title}</p>
            <p className='text-sm text-muted-foreground'>
               {meeting.start}h - {meeting.end}h
            </p>
         </div>
         <div className='flex items-center gap-2'>
            <Popover open={open} onOpenChange={setOpen}>
               <PopoverTrigger asChild>
                  <Button
                     variant='outline'
                     disabled={meeting.booked}
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
                     <CommandList>
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
                     disabled={meeting.booked || isUpdating}
                     onClick={async () => {
                        setUpdating(true);
                        await bookMeeting(meeting);
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
         </div>
      </div>
   );
}
