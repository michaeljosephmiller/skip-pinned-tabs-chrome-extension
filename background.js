chrome.runtime.onInstalled.addListener(function() {
	chrome.tabs.query({ currentWindow: true }, function(tabs) {
		console.log(tabs);
	});

	chrome.commands.getAll(function(commands) {
		console.log(commands);
	})
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function(tab) {
		console.log(tab.pinned);
	});
});

chrome.commands.onCommand.addListener(function(command) {
	const nextTabId = getNextNonPinnedTabId();
	chrome.tabs.update(tabs[newIndex].id, {active: true, highlighted: true});
});

function getNextNonPinnedTabId() {
	chrome.tabs.query({currentWindow: true}, function(tabs) {
		console.log(tabs);
		const activeTabIndex = getActiveTabIndex(tabs);
		console.log("Active tab index: " + activeTabIndex);

		let nextTabIndex = activeTabIndex + 1;
		if (nextTabIndex > tabs.length) nextTabIndex = 0;
		console.log("Next tab index: " + nextTabIndex);

		return tabs[nextTabIndex].id;
	});
}

function getActiveTabIndex(tabs) {
    return tabs.findIndex( (tab) => { return tab.active; });
}
