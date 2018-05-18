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
	chrome.tabs.query({currentWindow: true}, function(tabs) {
		const nextTabId = getNextNonPinnedTabId(tabs);
		chrome.tabs.update(nextTabId, {active: true, highlighted: true});
	});
});

function getNextNonPinnedTabId(tabs) {
	const nonPinnedTabs = tabs.filter( (tab) => { return !tab.pinned });
	const activeTabIndex = getActiveTabIndex(tabs);
	if (tabs[activeTabIndex].pinned) {
		if (nonPinnedTabs.length > 0) return nonPinnedTabs[0].id;
		return tabs[activeTabIndex].id;
	}

	const activeNonPinnedTabIndex = getActiveTabIndex(nonPinnedTabs);
	let nextTabIndex = activeNonPinnedTabIndex + 1;
	if (nextTabIndex > nonPinnedTabs.length - 1) nextTabIndex = 0;

	return nonPinnedTabs[nextTabIndex].id;
}

function getActiveTabIndex(tabs) {
    return tabs.findIndex( (tab) => { return tab.active; });
}
