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
   CommandInput,
   CommandItem,
   CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Meeting } from '@/content';
import { getCalEntries, openOptionsPage } from '@/lib/extension-utils';
import { Loader2, RefreshCcw, Send } from 'lucide-react';
import { ReactElement, ReactNode, useEffect, useState, useTransition } from 'react';

function App() {
   const [items, setItems] = useState<Meeting[]>();
   const [isUpdating, setUpdating] = useState(false);
   const [, startTransition] = useTransition();

   useEffect(() => {
      getCalEntries(setItems);
   }, []);

   async function bookMeeting(meeting: Meeting): Promise<void> {
      await new Promise((resolve, reject) => {
         // setTimeout(() => reject('error'), 1000);
         setTimeout(
            () =>
               Math.random() > 0.5
                  ? resolve(
                       setItems((items) =>
                          items?.map((item) => {
                             if (item.id === meeting.id) {
                                return meeting;
                             }
                             return item;
                          }),
                       ),
                    )
                  : reject('error'),
            1000,
         );
      });
   }
   async function updateMeeting(meeting: Meeting) {
      try {
         await bookMeeting(meeting);
      } catch (error) {
         console.log(error);
      }
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
                     <IssueEntry meeting={item} updateMeeting={updateMeeting} key={item.id} />
                  ))}
               </div>
            </CardContent>
            <CardFooter className='justify-end pt-4'>
               <Button
                  variant={'secondary'}
                  onClick={() => {
                     openOptionsPage();
                  }}
               >
                  Settings
               </Button>
               <Button
                  onClick={async () => {
                     setUpdating(true);
                     await Promise.allSettled(
                        items?.map((item) =>
                           item.booked ? null : bookMeeting({ ...item, booked: true }),
                        ) ?? [],
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
}: {
   meeting: Meeting;
   updateMeeting: (meeting: Meeting) => Promise<void>;
}): ReactElement {
   const [isUpdating, setUpdating] = useState(false);
   const [, startTransition] = useTransition();

   return (
      <div className='flex justify-between'>
         <div>
            <p className='text-sm font-medium leading-none'>{meeting.title}</p>
            <p className='text-sm text-muted-foreground'>
               {meeting.start}h - {meeting.end}h
            </p>
         </div>
         <div className='flex items-center gap-2'>
            <Popover>
               <PopoverTrigger asChild>
                  <Button
                     variant='outline'
                     disabled={meeting.booked}
                     className='w-[120px] justify-center'
                  >
                     {meeting.ticket}
                  </Button>
               </PopoverTrigger>
               <PopoverContent className='p-0' side='bottom' align='start'>
                  <Command>
                     <CommandInput placeholder='Search issue...' />
                     <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                           <CommandItem>test</CommandItem>
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
                        await updateMeeting({ ...meeting, booked: true });
                        startTransition(() => setUpdating(false));
                     }}
                  >
                     {isUpdating ? (
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
