import { SettingsFormValues } from '@/options/Options';
import * as dateLocales from 'date-fns/locale';
import parse from 'date-fns/parse';
import { Meeting } from '../content';
import { JiraIssue, searchJiraIssue } from './jira';
import format from 'date-fns/format';

export function getAggregatedMeetings(
   meetings: Meeting[],
   todaysMeetings: Array<string>,
   bookedMeetingTitles: Record<string, string>,
): Meeting[] {
   const aggregatedMeetings = meetings.map((meeting) => {
      const booked = todaysMeetings.includes(meeting.id);
      const aggregatedMeeting = {
         ...meeting,
         booked,
      };
      if (booked) {
         for (const [key, value] of Object.entries(bookedMeetingTitles)) {
            if (key === meeting.title) {
               aggregatedMeeting.ticket = value;
            }
         }
      }
      return aggregatedMeeting;
   });

   return aggregatedMeetings;
}

export async function getSelectedDay(): Promise<string> {
   const selectedDay = await chrome.runtime.sendMessage('getSelectedDay');
   return new Date(selectedDay).toLocaleDateString();
}

export async function addMeetingBookedByDay(today: string, meeting: Meeting) {
   const { meetingsBookedByDay = {} } = await chrome.storage.local.get('meetingsBookedByDay');
   if (meetingsBookedByDay[today]) {
      meetingsBookedByDay[today].push(meeting.id);
   } else {
      meetingsBookedByDay[today] = [meeting.id];
   }
   chrome.storage.local.set({ meetingsBookedByDay });
}

export async function getMeetingsFromCal(): Promise<Meeting[]> {
   if (chrome.runtime) {
      const meetings = await chrome.runtime.sendMessage('getCalEntries');
      const { meetingsBookedByDay = {} } = await chrome.storage.local.get('meetingsBookedByDay');
      const todaysBookedMeetings = meetingsBookedByDay[await getSelectedDay()] || [];
      const { bookedMeetings: bookedMeetingTitles = {} } = await chrome.storage.local.get(
         'bookedMeetings',
      );

      console.log({ meetings, todaysBookedMeetings, bookedMeetingTitles });
      const aggregatedMeetings = getAggregatedMeetings(
         meetings,
         todaysBookedMeetings,
         bookedMeetingTitles,
      );
      return aggregatedMeetings;
   } else {
      const meetings = [
         {
            id: '1204a7b9ed8103a4303b0c0eadc088f6651281afdb917ba6daa5a319f82843be',
            startTime: '2024-01-30T08:15:00.000Z',
            endTime: '2024-01-30T08:30:00.000Z',
            duration: '900000',
            start: '09:15',
            end: '09:30',
            title: 'WEB daily',
            ticket: 'WEB-170',
            booked: false,
            pending: false,
            discarded: false,
         },
         {
            id: '5b1815c6f6cb5a7c77f96741c65b95bb4fc070d149ad4fe9048af1bc9f206d47',
            startTime: '2024-01-30T09:00:00.000Z',
            endTime: '2024-01-30T09:15:00.000Z',
            duration: '900000',
            start: '10:00',
            end: '10:15',
            title: 'AIDA DRM Absprache',
            ticket: 'CWAL-1',
            booked: false,
            pending: false,
            discarded: false,
         },
         {
            id: 'e351231d499add4b3496d312f2c965f447c67021a96f65b136f73067965df787',
            startTime: '2024-01-30T09:30:00.000Z',
            endTime: '2024-01-30T10:30:00.000Z',
            duration: '3600000',
            start: '10:30',
            end: '11:30',
            title: 'EPL MR Review',
            ticket: 'CWAL-1',
            booked: false,
            pending: false,
            discarded: false,
         },
         {
            id: '64e2f1c932f6b56e12f75304b41c54212d46d0f8d9f3ea79420a8ec9298693a3',
            startTime: '2024-01-30T10:30:00.000Z',
            endTime: '2024-01-30T11:00:00.000Z',
            duration: '1800000',
            start: '11:30',
            end: '12:00',
            title: 'cwal-1 review PR',
            ticket: 'cwal-1',
            booked: false,
            pending: false,
            discarded: false,
         },
         {
            id: '322a74fa3867545c6a05d83c9b886d595ba70fc227ae32d61dda28d916b8bccd',
            startTime: '2024-01-30T13:00:00.000Z',
            endTime: '2024-01-30T14:00:00.000Z',
            duration: '3600000',
            start: '14:00',
            end: '15:00',
            title: 'AEM Template Training',
            ticket: 'CWAL-1',
            booked: false,
            pending: false,
            discarded: false,
         },
         {
            id: '34e3885427f5c8e38cd73808fe27b3fb35e6ee644cf738aafc1c7e4ecdd7f4b6',
            startTime: '2024-01-30T14:00:00.000Z',
            endTime: '2024-01-30T15:00:00.000Z',
            duration: '3600000',
            start: '15:00',
            end: '16:00',
            title: 'Helge AEM EDS Demo',
            ticket: 'CWAL-1',
            booked: false,
            pending: false,
            discarded: false,
         },
      ];
      const bookedMeetingTitles = {
         '1. Onboarding / AIDA Content Cloud': 'CWAL-1',
         'AEM - Asset Share Commons: Anbindung Azure AD': 'AIDA-382',
         'AEM Bi-weekly - \t Image Optimisation with WebP Delivery': 'CWAL-1',
         'AEM Bi-weekly - AEM CDP': 'CWIM-1',
         'AEM Bi-weekly - AEM functional and technical requirements': 'CWAL-1',
         'AEM Bi-weekly - Power of Adobe Analytics + Data Warehouses with Sagepath Reply': 'CWAL-1',
         'AEM Bi-weekly - RAFT in Distributed Systems': 'CWAL-1',
         'AEM Bi-weekly - Roadmap Update with Martin Altmann': 'CWAL-1',
         'AEM consulting weekly': 'CWAL-1',
         'AIDA - Absprache w/ Anja': 'AIDA-382',
         'AIDA - Azure AD Login Research': 'AIDA-382',
         'AIDA Research zu ASC Issues': 'AIDA-382',
         'ALM Check w/ Guillaume': 'EPLANALM-2',
         'ALM Go Live': 'EPLANALM-2',
         'ALM Lauch Update - Open Issues': 'EPLANALM-3',
         'AW: Setup AD Account': 'EPL-479',
         'Abgesagt: Abgesagt: Munich Re - Alignment': 'MRE-346',
         'Absprache w/ Christoph': 'WEB-170',
         'Absprache w/ Jacky zu Sonova Account': 'CWAL-1',
         'Absprache w/ Manuel': 'CWAL-1',
         'Absprache w/ Manuel zu UI Tests Dashboard': 'CWIM-1',
         'Absprache w/ Simone zu Figma': 'CWAL-1',
         'Absprache zu ALM': 'EPLANALM-2',
         'Abstimmung Branchenanimation': 'EPL-382',
         'Abstimmung Business Case EDS': 'CWAL-1',
         'Adobe Developers Live: Content and Commerce': 'CWIM-1',
         'Adobe Experience: Monthly': 'CWAL-1',
         'Adobe Experience: Weekly': 'CWAL-1',
         'Adobe LM - Status Update': 'EPLANALM-2',
         'Alexandra antworten': 'WEB-170',
         'Austausch w/ Gillaume': 'EPL-346',
         'BU Adobe Digital Experience: Weekly': 'CWAL-1',
         'Blocker Translation About Us': 'WEB-170',
         'Brainstorming Sonova Consulting': 'CWSA-1',
         'Branchenanimation - Content update': 'EPL-382',
         'Branchenanimation - Weekly Jour Fixe': 'EPL-382',
         'Branchenanimation Alignment': 'EPL-382',
         'Briefing / Designs for SVALOY-776+777': 'SVALOY-692',
         'CR from Solution Finder UAT document': 'MRE-417',
         'CWAL-1 AEM Blog footer': 'CWAL-1',
         'CWAL-1 Absprache w/ Ive': 'CWAL-1',
         'CWAL-1 Absprache w/ MAL zu AI topics': 'CWAL-1',
         'CWAL-1 BLog': 'CWAL-1',
         'CWAL-1 Blog': 'CWAL-1',
         'CWAL-1 Blog Header / Absprache w/ Ive': 'CWAL-1',
         'CWAL-1 Blog infra check w/ Adobe': 'CWAL-1',
         'CWAL-1 Blog tech issues': 'CWAL-1',
         'CWAL-1 Case Studies': 'CWAL-1',
         'CWAL-1 Comwrap Blog': 'CWAL-1',
         'CWAL-1 Comwrap Blog EDS': 'CWAL-1',
         'CWAL-1 Comwrap Build pipeline update': 'CWAL-1',
         'CWAL-1 Comwrap website': 'CWAL-1',
         'CWAL-1 EDS Check': 'CWAL-1',
         'CWAL-1 Footer blog': 'CWAL-1',
         'CWAL-1 comwrap EDS blog': 'CWAL-1',
         'CWAL-1 eds website': 'CWAL-1',
         'CWAL-1 setup adobe for cwrel relaunch': 'CWAL-1',
         'CWEM-1 Empowerment of animation-timeline': 'CWEM-1',
         'CWHR-1 Helping Ive': 'CWHR-1',
         'CWHR-1 Helping Ive setting up': 'CWHR-1',
         'CWHR-1 Instructing Ive': 'CWHR-1',
         'CWHR-1 Onboarding Ive': 'CWHR-1',
         'CWIM-1 Absprache w/ MAL': 'CWIM-1',
         'CWIM-1 Absprache w/ Manuel zu Okta': 'CWIM-1',
         'CWIM-1 AdaptTo() Videos gucken': 'CWIM-1',
         'CWIM-1 Check Adobe Edge Delivery Services Partner Portal stuff': 'CWIM-1',
         'CWIM-1 EDS Knowledge Talk w/ Adobe': 'CWIM-1',
         'CWIM-1 Fix bug in Jira Timebooker': 'CWIM-1',
         'CWIM-1 Update Jira Booking Extension': 'CWIM-1',
         'CWIM-1 VIM-Config updaten': 'CWIM-1',
         'CWIM-1 comwrap EDS website check': 'CWIM-1',
         'CWIM-1 fix staging sandbox': 'CWIM-1',
         'CWREL Merge': 'CWIM-1',
         'CWREL Setup Target on Dev': 'CWIM-1',
         'CWREL Testing implementation': 'CWAL-1',
         'CWREL-484 CWREL ALignment': 'CWIM-1',
         'CWSA-1 EPL Component schätzen': 'CWSA-1',
         'CWSA-1 Eplan: check EDS import': 'CWSA-1',
         'Comwrap - DTP dev session on AEM Rittal Cloud': 'EPL-513',
         'ComwrapUp 12': 'CWAL-1',
         'Conti | Form Builder + Email templating + SMTP': 'CONTIR-2403',
         'DEV DAY': 'CWAL-1',
         'Daily - MRE Solution Finder': 'MRE-346',
         Deploymemt: 'EPL-346',
         'Discuss Comwrap Edge delivery w/ Adobe': 'CWIM-1',
         'EPL Adobe Incident Project adjustments': 'EPL-348',
         'EPL Angebot Schätzung': 'CWSA-1',
         'EPL Blog Absprache w/ CKenner': 'EPL-469',
         'EPL Branchen Ive helfen': 'EPL-382',
         'EPL Branchenanimation delpoyment + setup': 'EPL-382',
         'EPL Cookie OneTrust settings glattziehen': 'EPL-345',
         'EPL Cookiebot DEV': 'EPL-409',
         'EPL Debug Login w/ CS13': 'EPL-348',
         'EPL Deployment': 'EPL-349',
         'EPL Deployment Prod check': 'EPL-346',
         'EPL Franklin prep': 'CWSA-1',
         'EPL Issue fix w/ Carousel': 'EPL-462',
         'EPL Language Master Docu': 'EPL-346',
         'EPL Prod Language Masters': 'EPL-456',
         'EPL deploy latest changes to dev for cookie testing': 'EPL-409',
         'EPL franklin prep': 'EPL-458',
         'EPL hotfix ja issue': 'EPL-460',
         'EPL-345 Setting Up Launch': 'EPL-345',
         'EPL-345 deployment on prod': 'EPL-345',
         'EPL-436 Revert Production back to Cookiebot': 'EPL-436',
         'EPL-450 Remove Redirect from dispi and add internal path to redirects alignment w/ Angelica':
            'EPL-450',
         'EPL-459 fix issue w/ login on ALM': 'EPL-459',
         'EPL-469 ABsprache w/ Dino zu Wires': 'EPL-469',
         'EPL-469 Absprache zu Blog': 'EPL-469',
         'EPL-510 eplan investigation': 'EPL-510',
         'EPL-510 investigate issue': 'EPL-510',
         'EPL-513 ABsprache w/ MGA und VTJ': 'EPL-513',
         'EPL-550 EPL CSS Issue Investigation': 'EPL-550',
         'EPL-551 change favicons': 'EPL-551',
         'EPL-552 adjust image component to adhear to opening in new tab': 'EPL-552',
         'EPLALM ABsprache w/ Andrii': 'EPLANALM-3',
         'EPLALM Update w/ Guillome': 'EPLANALM-3',
         'EPLALM-58 check implementation': 'EPLANALM-58',
         'EPLAN Blog Setup': 'EPL-479',
         'EPLAN Blog Setup Sharepoint': 'EPL-479',
         'EPLAN Blog | Planning': 'EPL-469',
         'EPLAN Blog | Sync with IT': 'EPL-469',
         'EPLAN Blog | Weekly': 'EPL-469',
         'EPLAN Branchenanimation Design': 'EPL-382',
         'EPLAN Cookiebot entfernen + Launch COnfig prüfen': 'EPL-409',
         'EPLAN Deployment Sonar Check': 'EPL-349',
         'EPLAN Excel Scoping': 'CWSA-1',
         'EPLAN Figma scan': 'EPL-449',
         'EPLAN Mr Review': 'EPL-382',
         'EPLAN Prep': 'EPL-513',
         'EPLAN Prod Language Masters start': 'EPL-456',
         'EPLAN Remove Basic auth on staging': 'EPL-345',
         'EPLAN Setup repo for components': 'EPL-528',
         'EPLAN Style Guide test': 'EPL-449',
         'EPLAN Ticket erstellen + Mails beantworten': 'EPL-348',
         'EPLAN Update Guillome': 'EPL-346',
         'EPLAN | Repo Setup': 'EPL-528',
         'EPLAN | Weekly': 'EPL-513',
         'EPLAN | Angebote/Budget Q&A': 'CWSA-1',
         'EPLAN | Blog Angebote': 'CWSA-1',
         'EPLAN | Blog Backlog': 'EPL-469',
         'EPLAN | Product Backlog / Fetures for CS13': 'EPL-506',
         'EPLAN | Support für Angebot schätzung': 'CWSA-1',
         'EPLAN | Technical Topics': 'EPL-346',
         'EPLAN: Hubspot Blog export für EDS': 'CWSA-1',
         'EPLANALM Fixes': 'EPLANALM-2',
         'EPLANALM go live readiness': 'EPLANALM-2',
         'EPLANALM-58 setup local repo': 'EPLANALM-58',
         'EPLANALM-69 fix cloudconfig deletion': 'EPLANALM-69',
         'EPLANALM-70 validate font clipping': 'EPLANALM-70',
         'EPLANALM-71 fix ca config issue': 'EPLANALM-71',
         'EPLan check figma design': 'EPL-449',
         'Einführung in EDS': 'EPL-458',
         'Epl Franklin prep': 'EPL-458',
         'Eplan Blog | Planning': 'EPL-469',
         'FW: CS13 // Sprint review': 'EPL-513',
         'FW: Kick off technical demands - Mediapool': 'WEB-495',
         'FW: Loyalty / SalesForce': 'SVALOY-692',
         'FW: Repository Gitlab / Azure Devops': 'EPL-513',
         'FW: WEB PM meeting': 'WEB-170',
         'Feedback for Solution Finder': 'MRE-346',
         'Final steps ALM': 'EPLANALM-3',
         'Fix Web Press Detail Template': 'WEB-296',
         'Follow Up Solution Finder - Internal Kick Off': 'MRE-354',
         'Follow up - Solution Finder MVP Demo': 'CWAL-1',
         'HAH / SAD - Alignment': 'CWAL-1',
         'Helios Link Rewriter Check': 'HEKAEM-2',
         'Hello Ive': 'CWHR-1',
         'I edited this': 'CWAL-1',
         'Isi abholen': 'CWAL-1',
         'JF DAM': 'AIDA-382',
         'Jira Timebooking extension': 'CWAL-1',
         'Kickoff: migrate Comwrap to Edge Delivery Services with AEM authoring': 'CWIM-1',
         'LOYALCLOUD-140 Notification sent by email': 'SVALOY-782',
         'Learning about WebSDK': 'WEB-408',
         'Loyalty Scoping': 'SVALOY-692',
         'MRE ABsprache w/ Jacky': 'MRE-346',
         'MRE Absprache': 'MRE-346',
         'MRE Absprache w/ Jacky': 'MRE-346',
         'MRE Author groups': 'MRE-401',
         'MRE Design Tickets': 'MRE-346',
         'MRE Solution Finder - Backlog Refinement': 'MRE-346',
         'MRE Solution Finder - Backlog Refinement/Estimation': 'MRE-346',
         'MRE Solution Finder - Color scheme functionality': 'MRE-346',
         'MRE Solution Finder - Scope vs Acceptance criteria': 'MRE-346',
         'MRE Solution Finder - internal walk through on DEV': 'MRE-346',
         'MRE Tickets / Absprache w/ Andrii & Artur': 'MRE-346',
         'MRE Update w/ Jacky': 'MRE-346',
         'MRE-278 Dynamic Media Scope Discussion': 'MRE-278',
         'MRE-346 Follow up - Solution Finder MVP Demo': 'MRE-346',
         'MRE-347 munich re repo setup': 'MRE-347',
         'MRE-444 Asset Polaris MGA helfen': 'MRE-444',
         'MRExReply - Solution Finder Alignment': 'MRE-346',
         'MRe environment setup': 'MRE-336',
         'Marketing Insights': 'SVALOY-692',
         'Maven Profiles': 'CWIM-1',
         'Munich Re - Alignment': 'MRE-346',
         'Prep Adobe Rollen Setup Rittal': 'CWSA-1',
         'Preview URL PW Schutz entfernen': 'WEB-170',
         'Project Review: Sonova': 'SVALOY-692',
         'Project Review: Webasto': 'WEB-49',
         'Rittal: WG: WG: Adobe Rollen-Setup': 'CWSA-1',
         'SVALOY Absprache w/ Jacky + Ticketing': 'SVALOY-692',
         'SVALOY Check CUG Settings for profile page': 'SVALOY-692',
         'SVALOY Debug issue': 'SVALOY-692',
         'SVALOY MKT testing': 'SVALOY-719',
         'SVALOY Testing': 'SVALOY-692',
         'SVALOY check email': 'SVALOY-723',
         'SVALOY deployments + debug check': 'SVALOY-692',
         'SVALOY fix figma design': 'SVALOY-692',
         'SVALOY mkt testing': 'SVALOY-719',
         'SVALOY ticketing': 'SVALOY-692',
         'SVALOY verify tickets': 'SVALOY-692',
         'SVALOY-719 fix issues': 'SVALOY-719',
         'SVALOY-719 push changes / fix issue w/ table': 'SVALOY-719',
         'SVALOY-755  - Loyalty Scoping Notification': 'SVALOY-755',
         'SVALOY-755 Notifications absprache': 'SVALOY-755',
         'SVALOY-779 Refactor': 'SVALOY-779',
         'SVALOY-779 testing / writing feedback': 'SVALOY-779',
         'SVALOY-779 testing and issue investigation': 'SVALOY-779',
         'SVALOY-795 Check history and answer mail': 'SVALOY-795',
         'Solution Finder - Design Alingment': 'MRE-355',
         'Solution Finder - Internal Kick Off': 'MRE-354',
         'Solution Finder - Requirements documentation': 'MRE-394',
         'Solution Finder - Requirements documentation nachbesprechung': 'MRE-394',
         'Solution Finder: weekly': 'MRE-346',
         'Sonova - internal synch': 'SVALOY-692',
         'Sonova AEM Guides UG team meets Reply': 'CWSA-1',
         'Sonova AEM Guides UG team meets Reply extended': 'CWAL-1',
         'Sonova Clarification overlay': 'SVALOY-692',
         'Sonova Schnack (Raghus Anfrage)': 'CWSA-1',
         'Sonova alignment tickets': 'SVALOY-692',
         'Sonova synch': 'SVALOY-692',
         'Sonova weekly': 'SVALOY-692',
         'Synch Sonova': 'SVALOY-692',
         'TESSUP-189 Quick solution discussion': 'TESSUP-189',
         'Tessloff Adobe Incident Project adjustments': 'TESSUP-23',
         Test: 'CWIM-1',
         Test2: 'CWSA-1',
         'Translation - Roof / Battery / Evolution': 'WEB-170',
         'Try translation of products': 'WEB-170',
         UserCentrics: 'WEB-170',
         'Vorbereitung QA/UAT Phase Solution Finder': 'MRE-346',
         'WEB -  go live follow up pt 2': 'WEB-170',
         'WEB - Adobe - post go live check in': 'WEB-170',
         'WEB - Adobe Launch estimates': 'WEB-170',
         'WEB - DAM portals project': 'WEB-170',
         'WEB - Email an Chris zu XMAS': 'WEB-170',
         'WEB - Go live prep part 2': 'WEB-170',
         'WEB - Maint - Backlog refinement/ estimation': 'WEB-170',
         'WEB - Product Finder check': 'WEB-170',
         'WEB - Product finder review (+ go live prep)': 'WEB-170',
         'WEB - Weekly Sprint planning/ backlog review': 'WEB-170',
         'WEB - backlog refinement (pt2)': 'WEB-170',
         'WEB - country rollout - offer clarification': 'WEB-170',
         'WEB - go live prep MVP + country rollouts': 'WEB-170',
         'WEB - holiday handover': 'WEB-159',
         'WEB - product finder review': 'WEB-306',
         'WEB - sprint prep': 'WEB-170',
         'WEB - sprint prep pt 2': 'WEB-170',
         'WEB - sprint review + projects 2024': 'WEB-170',
         'WEB Absprache w/ Chris': 'WEB-170',
         'WEB Absprache w/ Chris zu Serverside Tracking': 'WEB-170',
         'WEB Absprache w/ Chris zu Translations': 'WEB-170',
         'WEB Absprache w/ Christoph': 'WEB-170',
         'WEB Absprache w/ Raoul': 'WEB-170',
         'WEB Adressing Issues presented by Chris': 'WEB-170',
         'WEB Analytics Setup': 'WEB-170',
         'WEB Analytics data saving ticket': 'WEB-408',
         'WEB Check Product Import': 'WEB-410',
         'WEB Check carousel inital video playthrough': 'WEB-419',
         'WEB Code optimizations': 'WEB-170',
         'WEB Country Roll Out': 'WEB-170',
         'WEB Data Protection Research WebSDK Consent': 'WEB-408',
         'WEB Dataprotection stuff reading': 'WEB-408',
         'WEB GDPR Analytics + Accounts': 'WEB-408',
         'WEB GDPR Setup': 'WEB-408',
         'WEB Hero Video Issue': 'WEB-170',
         'WEB Product Check': 'WEB-170',
         'WEB Redirect Manager erklären': 'WEB-138',
         'WEB Runbook': 'WEB-434',
         'WEB Setup Consent Tool via launch': 'WEB-408',
         'WEB Sprint Scoping meeting': 'WEB-170',
         'WEB Support': 'WEB-170',
         'WEB Support Alex': 'WEB-170',
         'WEB Support Chris': 'WEB-170',
         'WEB Testing': 'WEB-170',
         'WEB Testing x-mas': 'WEB-416',
         'WEB Ticketing': 'WEB-159',
         'WEB Tickets Anbebote': 'WEB-170',
         'WEB check pf component': 'WEB-306',
         'WEB daily': 'WEB-170',
         'WEB ticketing': 'WEB-170',
         'WEB update azure map keys on production env': 'WEB-170',
         'WEB-175 integrate usercentrics': 'WEB-175',
         'WEB-306 Product Import from excel sheet': 'WEB-306',
         'WEB-395 template adjustments': 'WEB-395',
         'WEB-401 Fix menu': 'WEB-401',
         'WEB-408 Webasto Analytics DSGVO shizzle': 'WEB-408',
         'WEB-411 install MS Office Selecotr + deployment': 'WEB-411',
         'WEB-415 Discuss w/ Raoul': 'WEB-415',
         'WEB-416 Absprache zu Vids': 'WEB-416',
         'WEB-439 Deployment of Additional Icons': 'WEB-439',
         'WEB-439 add icons': 'WEB-439',
         'WEB-442  link checker + link referncer for XFs': 'WEB-442',
         'WEB-444 Check translation': 'WEB-444',
         'WEB-444 Implement translation query': 'WEB-444',
         'WEB-477 xmas bug incident': 'WEB-477',
         'WEB-477 xmas incident': 'WEB-477',
         'WEB-495 Big Kick off - Mediapool': 'WEB-495',
         'WEB-495 WEB - Portals project - scope clarification': 'WEB-495',
         'WG: Edge Delivery für Comwrap': 'CWIM-1',
         'WG: SignIn Problems': 'EPL-463',
         'Web Absprache w/ Chris': 'WEB-170',
         'Web Absprache w/ Dirk': 'WEB-170',
         'Web CDN Cache fix': 'WEB-170',
         'Web Check Press Detail Template': 'WEB-296',
         'Web Cookie und Translation Support': 'WEB-170',
         'Web GDPR Liste Erweitern / Einlesen': 'WEB-408',
         'Web Mails Datenschutz': 'WEB-408',
         'Web Support Chris': 'WEB-170',
         'Web XMAS Absprache': 'WEB-416',
         'Web check hero video carousel': 'WEB-170',
         'Web issue fix + Absprache': 'WEB-170',
         'Web setup translation for filters': 'WEB-170',
         'Web translating products and deployment': 'WEB-170',
         'WebSDK research': 'CWAL-1',
         'Webasto AEM Comps walkthrough': 'WEB-170',
         'Webasto Analytics DSGVO einlesen / eintragen': 'WEB-408',
         'Webasto Analytics DSGVO shizzle': 'WEB-408',
         'Webasto Content Migration': 'WEB-170',
         'Webasto DSGVO Themen': 'WEB-170',
         'Webasto Daily': 'WEB-77',
         'Webasto Ticketing': 'WEB-49',
         'Webasto Translation EN>DE': 'WEB-170',
         'Webasto deploy to prod': 'WEB-170',
         'Webasto: daily go live alignment': 'WEB-170',
         'Weekly / Migration AIDA Bilddatenbank': 'AIDA-382',
         'Weekly // Migration AIDA Bilddatenbank': 'AIDA-382',
         'Weekly Synch Sonova': 'SVALOY-692',
         'Weekly: Adobe Content-Struktur': 'AIDA-382',
         'XMAS Support': 'WEB-416',
         'XMAS WEB Absprache w/ Chris': 'WEB-416',
         '[Bi-weekly LAS alignment] Adobe / webasto / reply': 'WEB-170',
         '[Comwrap] AEM - Customer Sponsorship Program: Kick Off': 'CWIM-1',
         'absprache intern eplan ive': 'EPL-348',
         'adobe edge delivery services investigation': 'CWIM-1',
         'check webasto meta navi': 'WEB-170',
         'comwrap Adobe Incident Project adjustments': 'CWAL-1',
         'comwrap-up': 'CWAL-1',
         'cwal-1 blog': 'cwal-1',
         'cwal-1 blog finish': 'cwal-1',
         'cwal-1 blog impl': 'cwal-1',
         'cwal-1 blog performance': 'cwal-1',
         'cwal-1 blog tech issues': 'cwal-1',
         'cwal-1 blog tech review': 'cwal-1',
         'cwal-1 check import w/ solid': 'cwal-1',
         'cwal-1 check import w/ solid + Absprache w/ Ive': 'cwal-1',
         'cwal-1 comwrap blog': 'cwal-1',
         'cwal-1 cowrap blog absprache': 'cwal-1',
         'cwal-1 emails': 'cwal-1',
         'cwal-1 finish footer': 'cwal-1',
         'cwal-1 footer': 'cwal-1',
         'cwal-1 implement analytics': 'cwal-1',
         'cwal-1 technical details blog': 'cwal-1',
         'cwal-1 test': 'CWAL-1',
         'cwal-1 website comwrap': 'cwal-1',
         'cwhr-1 Absprache w/ MGA zu EDS staffing': 'cwhr-1',
         'cwim-1 comwrap website': 'cwim-1',
         'cwrel prod deployment': 'CWIM-1',
         'deployment / mr review': 'WEB-170',
         'deployment auf prod / dev': 'EPL-346',
         'disable image translation': 'WEB-432',
         'ePlan AEM | Editor Training': 'EPL-439',
         'ePlan Adobe Project - Weekly Review': 'EPL-346',
         'ePlan | Angebote': 'CWSA-1',
         'ePlan | Diskussion': 'EPL-348',
         'ePlan | LMS - Jour Fixe': 'EPLANALM-3',
         'ePlan | Blog Angebote Q&A': 'CWSA-1',
         'ePlan | LMS - Jour Fixe': 'EPLANALM-3',
         'ePlan | Setup Dynamic Media for Video': 'EPL-348',
         'elan branchenanimation gitlab': 'EPL-382',
         emails: 'CWAL-1',
         'epl branchenani helping ive': 'EPL-382',
         'epl check MR': 'EPL-346',
         'epl check login rittal cloud': 'EPL-513',
         'epl deployment': 'EPL-349',
         'epl franklin prep': 'CWSA-1',
         'epl helping ive': 'EPL-348',
         'epl redirect check': 'EPL-450',
         'epl scope update prep': 'CWSA-1',
         'epl setup stage cookie': 'EPL-345',
         'epl-506 consultancy': 'epl-506',
         'eplalm deployment': 'EPL-346',
         'eplan alm deployment prep': 'EPLANALM-2',
         'eplan angebote': 'CWSA-1',
         'eplan branchenanimation': 'EPL-382',
         'eplan branchenanimation supporting ive': 'EPL-382',
         'eplan consent tool tauschen': 'EPL-409',
         'eplan deployment': 'EPL-348',
         'eplan franklin prep': 'EPL-458',
         'eplan gitlab stuff / deployments': 'EPL-382',
         'eplan language masters': 'EPL-456',
         'eplan scope update schicken': 'CWSA-1',
         'eplan timings senden': 'EPL-513',
         extended: 'SVALOY-692',
         'extended configs': 'EPL-513',
         'fix and debug menu bug': 'WEB-170',
         'follow up call Solution Finder': 'MRE-346',
         'helping karl': 'CWEM-1',
         'internal synch - MRE Solution Finder': 'MRE-346',
         'language wire estimate webasto': 'WEB-474',
         'loyalty testing': 'SVALOY-692',
         'mac setup / cleanup / start fresh into year': 'CWAL-1',
         'mre read document': 'MRE-346',
         'prep language copy': 'WEB-170',
         'product data import': 'WEB-410',
         'read instructions for kickoff': 'MRE-346',
         'setup cache props on persisted queries': 'WEB-170',
         socialising: 'CWAL-1',
         'svaloy absprache': 'SVALOY-692',
         'svaloy austausch w/ Burak zu Analytics': 'SVALOY-792',
         'svaloy debug issue': 'SVALOY-692',
         'svaloy email issue check': 'SVALOY-692',
         'svaloy issue fix': 'SVALOY-793',
         'svaloy update CFs and testing': 'SVALOY-692',
         'svaloy übergabe w/ Jacky': 'SVALOY-692',
         'svaloy-692 check issues': 'SVALOY-692',
         'svaloy-692 implement missing state': 'SVALOY-692',
         'svaloy-749 investigation': 'svaloy-749',
         test: 'CWAL-1',
         'update pf icons and check analytics tracking': 'WEB-170',
         'web Antwort an Alexandra': 'WEB-170',
         'web MR review': 'WEB-170',
         'web Redirectmaanger': 'WEB-170',
         'web absprache w/ Dirk': 'WEB-170',
         'web absprache w/ chris': 'WEB-170',
         'web absprache xmas': 'WEB-416',
         'web absprache zu dataprotection': 'WEB-408',
         'web after go live support & deployments': 'WEB-170',
         'web alex aw u mr rev': 'WEB-170',
         'web analytics check + Organisatorische w/ Dirk': 'WEB-170',
         'web assiting chris': 'WEB-170',
         'web caching': 'WEB-170',
         'web check analytics': 'WEB-170',
         'web check crux report': 'WEB-170',
         'web check deployment issue': 'WEB-170',
         'web check live copy issue': 'WEB-170',
         'web check permissions issues / deployment on prod': 'WEB-170',
         'web consent absprache': 'WEB-408',
         'web data collection tests tracking': 'WEB-408',
         'web data protection': 'WEB-408',
         'web debug plyr': 'WEB-170',
         'web deployment': 'WEB-170',
         'web dispatcher cache issue': 'WEB-170',
         'web dispatcher changes': 'WEB-170',
         'web fix breadcrumb': 'WEB-395',
         'web fix header mobile menu issue': 'WEB-170',
         'web fix issue w/ links to 404': 'WEB-170',
         'web fix issues': 'WEB-170',
         'web fix multiple issues directly w/ Chris': 'WEB-170',
         'web helping chunliang': 'WEB-170',
         'web lang international site erstellen + deployments': 'WEB-170',
         'web live copy setup': 'WEB-170',
         'web livecopy check dev': 'WEB-170',
         'web mr review': 'CWAL-1',
         'web post go live fussues': 'WEB-170',
         'web prod deployment': 'WEB-170',
         'web project absprache': 'WEB-170',
         'web setup product finder': 'WEB-306',
         'web support Christoph': 'WEB-170',
         'web template check': 'WEB-296',
         'web ticket check': 'WEB-170',
         'web tickets': 'WEB-170',
         'web translation + deployment': 'WEB-170',
         'web translations / products': 'WEB-170',
         'web-170 redirect + deployments': 'web-170',
         'web-303 - content icon update + changes to video': 'web-303',
         'web-393 add settings': 'web-393',
         'web-393 check settings': 'web-393',
         'web-395 fix impl': 'web-395',
         'web-403 Policy fixen': 'web-403',
         'web-407 check issue w/ accordion comp': 'web-407',
         'web: install asc': 'WEB-411',
         'webasto Absprache w/ Chris': 'WEB-170',
         'webasto Dataprotection research': 'WEB-408',
         'webasto MR review': 'WEB-170',
         "webasto MR's": 'WEB-170',
         'webasto Ticketing': 'WEB-170',
         'webasto absprache w/ chris zu Weihnachtsseite': 'WEB-170',
         'webasto caching': 'WEB-170',
         'webasto chaching': 'WEB-170',
         'webasto check content/ fix content': 'WEB-170',
         'webasto check header component teaser': 'WEB-170',
         'webasto check news issue': 'WEB-421',
         'webasto deployment prod': 'WEB-170',
         'webasto dispi': 'WEB-393',
         'webasto live copy setup': 'WEB-170',
         'webasto livecopy setup': 'WEB-170',
         'webasto release stage': 'WEB-170',
         'webasto support': 'WEB-170',
         'webasto zugänge machen': 'WEB-170',
         'xWalk - classic EDS comwrap blog': 'CWAL-1',
         'Übersetzungs-Jobs - Helge': 'WEB-170',
      };
      const todaysBookedMeetings: string[] = [];
      return getAggregatedMeetings(meetings, todaysBookedMeetings, bookedMeetingTitles);
   }
}

export function openOptionsPage() {
   if (import.meta.env.MODE === 'testing') {
      window.location.href = '/options.html';
      return;
   }
   chrome.runtime.openOptionsPage();
}

async function testConnection(data: SettingsFormValues) {
   try {
      const test = await fetch(`${data.jiraBaseUrl}/rest/api/3/issue/${data.jiraDefaultTicket}`, {
         headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${btoa(`${data.email}:${data.jiraToken}`)}`,
            Accept: 'application/json',
            'X-Atlassian-Token': 'no-check',
         },
      });
      if (test.status !== 200) {
         throw new Error('Could not connect to Jira');
      }
   } catch (e) {
      throw new Error('Could not connect to Jira');
   }
}

export async function storeJiraSettings(data: SettingsFormValues) {
   await testConnection(data);
   if (import.meta.env.MODE === 'testing') {
      return;
   }
   await chrome.storage.sync.set(data);
}

export async function getIssueKeyForMeetingName(meetingTitle: string) {
   try {
      const { bookedMeetings = {} } = await chrome.storage.local.get(['bookedMeetings']);
      if (Object.keys(bookedMeetings).includes(meetingTitle)) {
         return bookedMeetings[meetingTitle];
      }
      return chrome.storage.sync.get('jiraDefaultTicket').then((data) => data.jiraDefaultTicket);
   } catch (e) {
      console.error(e);
      return chrome.storage.sync.get('jiraDefaultTicket').then((data) => data.jiraDefaultTicket);
   }
}

export async function saveIssueKeyForMeetingName(meeting: string, issue: string) {
   const { bookedMeetings = {} } = await chrome.storage.local.get('bookedMeetings');
   bookedMeetings[meeting] = issue;
   await chrome.storage.local.set({ bookedMeetings });
}

export async function clearBookedMeetings() {
   await chrome.storage.local.set({ bookedMeetings: {} });
}

export async function createHash(message: string): Promise<string> {
   const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
   const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8); // hash the message
   const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
   const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
   return hashHex;
}

export async function getLastUsedIssues(): Promise<Array<JiraIssue>> {
   return chrome.storage.local.get(['lastUsedIssues']).then((res) => res.lastUsedIssues || []);
}

export async function clearLastUsedIssues() {
   chrome.storage.local.set({ lastUsedIssues: [] });
}

export async function addLastUsedIssue(issue: Pick<JiraIssue, 'key'>) {
   const lastUsedIssues = await getLastUsedIssues();
   const jiraIssue = await searchJiraIssue({ query: issue.key });
   const newIssues = [jiraIssue[0], ...lastUsedIssues.filter((i) => i.key !== jiraIssue[0].key)];
   return chrome.storage.local.set({ lastUsedIssues: newIssues });
}

export function createTimeObject(timeString: string): Date {
   const date = new Date();

   const [hoursStr, minutesPeriod] = timeString.split(':');
   const [minutesStr, period] = minutesPeriod.split(' ');

   const hours = parseInt(hoursStr, 10);
   const minutes = parseInt(minutesStr, 10);

   const adjustedHours = period === 'PM' && hours < 12 ? hours + 12 : hours;

   date.setHours(adjustedHours);
   date.setMinutes(minutes);

   return date;
}

export function formatTo24HourFormat(timeString: string): string {
   console.log({ timeString });
   const date = new Date(`2023 ${timeString}`);
   return format(date, 'HH:mm');
}

export async function parseCalenderDateString(
   date: string,
   time: string,
   locale: keyof typeof dateLocales,
): Promise<string> {
   const parsedDateString = parse(
      [date, formatTo24HourFormat(time)].join(' '),
      'dd, MMMM, yyyy HH:mm',
      new Date(),
      {
         locale: dateLocales[locale],
      },
   ).toISOString();
   return parsedDateString;
}

export function getLocaleFromDocument(lang: string): keyof typeof dateLocales {
   let _lang = lang
      .split('-')
      .map((item, idx) => (idx > 0 ? item.toUpperCase() : item))
      .join('');
   if (_lang === 'en') {
      _lang = 'enUS';
   }

   const locales = Object.keys(dateLocales);
   if (!locales.includes(_lang as keyof typeof dateLocales)) {
      throw new Error(`Locale ${_lang} not found`);
   }
   return _lang as keyof typeof dateLocales;
}

export function roundTimeToNearestMinutes(date: Date, minutes: number) {
   const ms = 1000 * 60 * minutes; // convert minutes to ms
   const roundedDate = new Date(Math.ceil(date.getTime() / ms) * ms);
   return roundedDate;
}

export function round24hStringToNearestMinutes(timeStr: string, minutes: number): string {
   const [hours, minute] = timeStr.split(':');

   const roundedMinutes = Math.ceil(+minute / minutes) * minutes;
   const date = new Date(0, 0, 0, +hours, roundedMinutes);

   const roundedTimeString = `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padEnd(2, '0')}`;
   return roundedTimeString;
}

export function isDurationDivisibleByMinutes(durationInMs: number, minutes: number): boolean {
   const meetingDurationInMinutes = durationInMs / 1000 / 60;
   return meetingDurationInMinutes % minutes === 0;
}

export function roundDurationToNearestMinutes(durationInMs: number, minutes: number): number {
   const meetingDurationInMinutes = durationInMs / 1000 / 60;
   const roundedDurationInMinutes = Math.ceil(meetingDurationInMinutes / minutes) * minutes;
   return roundedDurationInMinutes * 60 * 1000;
}
