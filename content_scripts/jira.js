const jira = {
    countTips: {
        optionName: "jira-count-tips",
        pathname: "/issues/",
    },
};



function getBadgeElem(priority) {
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

function fetchCountTips() {
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
        ticket.querySelector("td.assignee em").classList.add("aui-lozenge", "aui-lozenge-moved", "aui-lozenge-subtle");
    });

    const countEndElem = document.querySelector("span.results-count-end");
    countEndElem.innerHTML = "";

    const ticketCountElem = document.createElement("span");
    ticketCountElem.textContent = `${tickets.length} (`;
    countEndElem.appendChild(ticketCountElem);

    Object.keys(countByPriority).forEach((priority) => {
        countEndElem.appendChild(getBadgeElem(priority));
        const span = document.createElement("span");
        span.textContent = ` ${countByPriority[priority]} `;
        countEndElem.appendChild(span);
    });

    const unassignedEmElem = document.createElement("em");
    unassignedEmElem.classList.add("aui-lozenge", "aui-lozenge-moved", "aui-lozenge-subtle");
    unassignedEmElem.textContent = "unassigned"
    countEndElem.appendChild(unassignedEmElem);

    const unassignedCountElem = document.createElement("span");
    unassignedCountElem.textContent = ` ${unassignedTickets.length})`;
    countEndElem.appendChild(unassignedCountElem);
}

function showCountTips() {
    if (location.pathname != jira.countTips.pathname) return;
    executeFunctionAfterPageLoaded(() => {
        fetchCountTips();
        const issueTable = document.querySelector(".issue-table-container");
        if (issueTable) {
            const issueTableObserver = new DOMObserver(issueTable);
            issueTableObserver.registerCallbackFunction(jira.countTips.optionName, fetchCountTips);
        }
    });
}

let options = {};
let config = {};

async function main() {
    [options, config] = await Promise.all([loadFromStorage("options"), loadFromStorage("config")]);
    if (isEnabled(jira.countTips.optionName)) {
        showCountTips();
    }
}

main();
browser.runtime.onConnect.addListener(() => {
    main();
});
