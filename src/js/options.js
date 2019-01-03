import '../css/options.css'

$(() => {
    chrome.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {
        });
    chrome.runtime.sendMessage('playlist', (response) => {
    });
});


