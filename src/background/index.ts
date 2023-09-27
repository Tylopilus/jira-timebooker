console.info('chrome-ext template-react-ts background script');

export {};
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
   if (message === 'getCalEntries') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
         chrome.tabs.sendMessage(tabs[0].id!, 'getCalEntries', async (response) => {
            console.log('got response from tab', response);
            sendResponse(response);
            return true;
         });
      });
   }

   if (message === 'getSelectedDay') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
         chrome.tabs.sendMessage(tabs[0].id!, 'getSelectedDay', async (response) => {
            sendResponse(response);
            return true;
         });
      });
   }
   return true;
});
