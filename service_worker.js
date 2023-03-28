const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

chrome.commands.onCommand.addListener(handleCommands);
chrome.runtime.onInstalled.addListener(handleInstalled);

function handleCommands(command) {
  chrome.tabs.query({ currentWindow: true }, function (tabs) {
    const nextTabId = getNextTabId(tabs, command);
    chrome.tabs.update(nextTabId, { active: true, highlighted: true });
  });
}

async function handleInstalled(e) {
  let type = '';

  switch (e.reason) {
    case chrome.runtime.OnInstalledReason.INSTALL:
      if (await isCommandColission()) {
        type = 'command-collision';
      } else {
        type = 'install';
      }
      break;
    case chrome.runtime.OnInstalledReason.UPDATE:
      type = 'update';
      break;
    default:
      console.warn(`Unexpected message type ${type} received`);
      break;
  }

  sendMessageToOffscreenDocument(type);
}

function getActiveTabIndex(tabs) {
  return tabs.findIndex((tab) => {
    return tab.active;
  });
}

function getNextTabId(tabs, command) {
  const nonPinnedTabs = tabs.filter((tab) => {
    return !tab.pinned;
  });
  const activeNonPinnedTabIndex = getActiveTabIndex(nonPinnedTabs);
  const activeTabIndex = getActiveTabIndex(tabs, command);
  let nextTabIndex;

  if (tabs[activeTabIndex].pinned) {
    if (nonPinnedTabs.length > 0) return nonPinnedTabs[0].id;
    return tabs[activeTabIndex].id;
  }

  if (command === 'next-tab') {
    nextTabIndex = activeNonPinnedTabIndex + 1;
    if (nextTabIndex > nonPinnedTabs.length - 1) nextTabIndex = 0;
  } else if (command === 'prev-tab') {
    nextTabIndex = activeNonPinnedTabIndex - 1;
    if (nextTabIndex < 0) nextTabIndex = nonPinnedTabs.length - 1;
  }

  return nonPinnedTabs[nextTabIndex].id;
}

async function isCommandColission() {
  let missingShortcuts = [];

  chrome.commands.getAll(async (commands) => {
    for (let { name, shortcut } of commands) {
      if (shortcut === '') {
        missingShortcuts.push(name);
      }
    }
  });

  return missingShortcuts.length > 1 ? true : false;
}

function getMessageText(type) {
  const message = { type, target: 'offscreen' };

  switch (type) {
    case 'install':
      message.text = `Thank you for installing Skip Pinned Tabs!

To tab-surf and skip any pinned tabs:
    Press Ctrl + Q for Next tab
    Press Ctrl + Shift + Q for Previous tab

To customize the shortcut keys go to chrome://extensions/shortcuts and find the "Skip Pinned Tabs" section`;
      break;
    case 'update':
      message.text = 'Skip Pined Tabs extension has been updated.';
      break;
    case 'command-collision':
      message.text =
        'The extension\'s shortcut keys conflict with another installed extension. Please go to chrome://extensions/shortcuts, then find the "Skip Pinned Tabs" section and add your own custom shortcuts.';
      break;
    default:
      break;
  }

  return message;
}

async function hasDocument() {
  // Check all windows controlled by the service worker if one of them is the offscreen document
  const matchedClients = await clients.matchAll();

  for (const client of matchedClients) {
    if (client.url.endsWith(OFFSCREEN_DOCUMENT_PATH)) {
      return true;
    }
  }

  return false;
}

async function closeOffscreenDocument() {
  if (!(await hasDocument())) {
    return;
  }
  await chrome.offscreen.closeDocument();
}

async function sendMessageToOffscreenDocument(type) {
  const message = getMessageText(type);

  // Create an offscreen document if one doesn't exist yet
  if (!(await hasDocument())) {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: 'Parse DOM',
    });
  }
  // Now that we have an offscreen document, we can dispatch the
  // message.
  chrome.runtime.sendMessage(message).then((response) => {
    console.log(response);
    closeOffscreenDocument();
  });
}
