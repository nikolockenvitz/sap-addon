const jira = {
    countTips: {
        optionName: "jira-count-tips",
        pathname: "/issues/",
    },
};

function badge(priority) {
    const name = { "Very High": "highest" }[priority] || priority.toLowerCase();
    return `<img src="/images/icons/priorities/${name}.svg" height="16" width="16" border="0" align="absmiddle" alt="${priority}" title="${priority} - ${priority}">`;
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
        ticket.querySelector("td.assignee").innerHTML = '<em class="aui-lozenge aui-lozenge-moved aui-lozenge-subtle">Unassigned</em>';
    });

    const countEndElement = document.querySelector("span.results-count-end");
    countEndElement.innerHTML = `${tickets.length} (${Object.keys(countByPriority)
        .map((priority) => `${badge(priority)} ${countByPriority[priority]}`)
        .join(" ")}, <em class="aui-lozenge aui-lozenge-moved aui-lozenge-subtle">Unassigned</em> ${unassignedTickets.length})`;
}

function showCountTips() {
    if (location.pathname != jira.countTips.pathname) return;
    executeFunctionAfterPageLoaded(fetchCountTips);
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
