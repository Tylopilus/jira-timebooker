import { Separator } from '@/components/ui/separator';
import { zodResolver } from '@hookform/resolvers/zod';
import {
   Form,
   FormControl,
   FormDescription,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { useState, useTransition } from 'react';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/components/ui/use-toast';
import { storeData } from '@/lib/extension-utils';
import { Loader2 } from 'lucide-react';

function App() {
   return (
      <main className='max-w-[600px] mx-auto py-4'>
         <div className='space-y-6'>
            <div>
               <h3 className='text-lg font-medium'>Account</h3>
               <p className='text-sm text-muted-foreground'>
                  Update your Jira settings. Set your token and base-url.
               </p>
            </div>
            <Separator />
            <SettingsForm />
         </div>
      </main>
   );
}

export default App;
const settingsFormSchema = z.object({
   email: z.string().email({ message: 'Please enter a valid email' }),
   jiraToken: z.string().min(1, { message: 'Please enter a valid token' }),
   jiraBaseUrl: z.string().url({ message: 'Please enter a valid url' }),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
const defaultValues = async (): Promise<SettingsFormValues> => {
   const settings = await chrome.storage.sync.get(['email', 'jiraToken', 'jiraBaseUrl']);
   return {
      email: settings?.email || '',
      jiraToken: settings?.jiraToken || '',
      jiraBaseUrl: settings?.jiraBaseUrl || '',
   };
};
function SettingsForm() {
   const [isSubmitting, setSubmitting] = useState(false);
   const [, startTransition] = useTransition();
   const form = useForm<SettingsFormValues>({
      resolver: zodResolver(settingsFormSchema),
      defaultValues,
   });
   async function onSubmit(data: SettingsFormValues) {
      setSubmitting(true);
      try {
         await storeData(data);
         toast({
            title: 'Success 🎉',
            description: 'Settings have been saved.',
            variant: 'default',
            duration: 2000,
         });
      } catch (error: unknown) {
         const message = error instanceof Error ? error.message : 'Some unknown error happend.';
         toast({
            title: 'Something went wrong.',
            description: <p>{message}</p>,
            variant: 'destructive',
            duration: 2000,
         });
      } finally {
         startTransition(() => setSubmitting(false));
      }
   }
   return (
      <main>
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
               <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                           <Input placeholder='Your email' {...field} />
                        </FormControl>
                        <FormDescription>
                           This is the email address that you use to log in.
                        </FormDescription>
                        <FormMessage />
                     </FormItem>
                  )}
               />
               <FormField
                  control={form.control}
                  name='jiraToken'
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Personal Access Token</FormLabel>
                        <FormControl>
                           <Input placeholder='Jira token' type='password' {...field} />
                        </FormControl>
                        <FormDescription>
                           This is your personal access token (PAT). You can create one in your Jira
                        </FormDescription>
                        <FormMessage />
                     </FormItem>
                  )}
               />
               <FormField
                  control={form.control}
                  name='jiraBaseUrl'
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Jira base url</FormLabel>
                        <FormControl>
                           <Input placeholder='Jira base url' {...field} />
                        </FormControl>
                        <FormDescription>
                           This is the base url of your Jira instance.
                        </FormDescription>
                        <FormMessage />
                     </FormItem>
                  )}
               />
               <Button type='submit'>
                  {isSubmitting ? <Loader2 className='w-4 h-4 animate-spin mr-2' /> : null} Update
                  account
               </Button>
            </form>
         </Form>
         <Toaster />
      </main>
   );
}
