chrome.runtime.onMessage.addListener(handleMessages);

async function handleMessages(message, sender, sendResponse) {
  const response = { type: message.type, text: 'success' };

  if (message.target !== 'offscreen') {
    return false;
  }
  switch (message.type) {
    case 'command-collision':
    case 'install':
    case 'update':
      alert(message.text);
      break;
    default:
      response.text = 'failed: Unexpected message type received';
      break;
  }

  sendResponse(response);
}
