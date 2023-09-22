import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
   name: 'jira timebooker',
   description: 'Enables you to book time in your jira based on your meetings in outlook calendar',
   version: '1.0.0',
   manifest_version: 3,
   icons: {
      '16': 'img/icon16.png',
      '32': 'img/icon32.png',
      '48': 'img/icon48.png',
      '128': 'img/icon128.png',
   },
   action: {
      default_popup: 'popup.html',
      default_icon: 'img/icon48.png',
   },
   options_page: 'options.html',
   background: {
      service_worker: 'src/background/index.ts',
      type: 'module',
   },
   content_scripts: [
      {
         matches: ['https://outlook.office.com/calendar/view/day'],
         js: ['src/content/index.ts'],
      },
   ],
   web_accessible_resources: [
      {
         resources: ['img/icon16.png', 'img/icon32.png', 'img/icon48.png', 'img/icon128.png'],
         matches: [],
      },
   ],
   permissions: ['activeTab', 'storage', 'webRequest', 'tabs'],
});
