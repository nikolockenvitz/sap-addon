const jira = {
    countTips: {
        optionName: "jira-count-tips",
        containerName: "issue-table-container",
        pathname: "/issues/",
        className: "count-tips",
        lengthData: "data-length",
        unassignedBadge: "unassigned-badge",
    },
};

function _getBadgeElem(priority) {
    const filename = { "Very High": "highest" }[priority] || priority.toLowerCase();
    const title = `${priority} - ${priority}`;
    const imageElem = document.createElement("img");
    imageElem.setAttribute("src", `/images/icons/priorities/${filename}.svg`);
    imageElem.setAttribute("height", 16);
    imageElem.setAttribute("width", 16);
    imageElem.setAttribute("border", 0);
    imageElem.setAttribute("align", "absmiddle");
    imageElem.setAttribute("title", title);
    return imageElem;
}

function _fetchCountTips() {
    const orderedPriorities = {
        "Very High": 0,
        High: 0,
        Medium: 0,
        Low: 0,
    };
    const tickets = Array.from(document.querySelectorAll("tr.issuerow"));
    const countByPriority = tickets.reduce((mem, ticket) => {
        const priorityElement = ticket.querySelector("td.priority");
        if (priorityElement) {
            const priority = priorityElement.getElementsByTagName("img")[0].getAttribute("alt");
            mem[priority] ||= 0;
            mem[priority]++;
        }
        return mem;
    }, orderedPriorities);

    const unassignedTickets = tickets.filter((ticket) => ticket.querySelector("td.assignee").textContent.includes("Unassigned"));
    unassignedTickets.forEach((ticket) => {
        ticket
            .querySelector("td.assignee em")
            .classList.add(jira.countTips.unassignedBadge, "aui-lozenge", "aui-lozenge-moved", "aui-lozenge-subtle");
    });

    const countEndElem = document.querySelector("span.results-count-end");
    countEndElem.replaceChildren();

    countEndElem.append(`${tickets.length} (`);
    Object.keys(countByPriority).forEach((priority) => {
        countEndElem.appendChild(_getBadgeElem(priority));
        countEndElem.append(` ${countByPriority[priority]} `);
    });

    const unassignedEmElem = document.createElement("em");
    unassignedEmElem.classList.add("aui-lozenge", "aui-lozenge-moved", "aui-lozenge-subtle");
    unassignedEmElem.textContent = "Unassigned";
    countEndElem.appendChild(unassignedEmElem);
    countEndElem.append(` ${unassignedTickets.length})`);
    countEndElem.classList.add(jira.countTips.className);
    countEndElem.setAttribute(jira.countTips.lengthData, tickets.length);
}

let updated = false;
let issueTableObserver;
function showCountTips(force = false) {
    if (force) {
        executeFunctionAfterPageLoaded(() => {
            const issueTable = document.querySelector(`.${jira.countTips.containerName}`);
            if (issueTable) {
                _fetchCountTips();
            }
        });
    }

    domObserver.registerCallbackFunction(jira.countTips.optionName, () => {
        executeFunctionAfterPageLoaded(() => {
            const issueTable = document.querySelector(`.${jira.countTips.containerName}`);
            if (issueTable) {
                if (!updated) {
                    updated = true;
                    _fetchCountTips();

                    // the issue table will be replaced and not observed after updating
                    issueTableObserver = new DOMObserver(issueTable);
                    issueTableObserver.registerCallbackFunction(jira.countTips.containerName, () => {
                        updated = false;
                        issueTableObserver.disconnect();
                    });
                }
            } else {
                updated = false;
            }
        });
    });
}

function removeCountTips() {
    domObserver.unregisterCallbackFunction(jira.countTips.optionName);
    updated = false;

    const countTips = document.querySelector(`.${jira.countTips.className}`);
    if (countTips) {
        countTips.replaceChildren();
        countTips.append(countTips.getAttribute(jira.countTips.lengthData));
        countTips.classList.remove(jira.countTips.className);
        countTips.removeAttribute(jira.countTips.lengthData);
        document.querySelectorAll(`.${jira.countTips.unassignedBadge}`).forEach((badge) => {
            badge.removeAttribute("class");
        });
    }
}

let options = {};
let config = {};

async function main(force = false) {
    [options, config] = await Promise.all([loadFromStorage("options"), loadFromStorage("config")]);
    if (isEnabled(jira.countTips.optionName)) {
        showCountTips(force);
    } else {
        removeCountTips();
    }
}

main();
browser.runtime.onConnect.addListener(async () => {
    await main(true);
});
