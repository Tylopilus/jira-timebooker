console.info('chrome-ext template-react-ts background script');

export {};
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
   console.log('message', message);
   if (message === 'getCalEntries') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
         chrome.tabs.sendMessage(tabs[0].id!, 'getCalEntries', (response) => {
            console.log('response', response);
            sendResponse(response);
         });
      });
   }
   return true;
});
