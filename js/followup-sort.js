/**
 * Sort follow-up plans for display only — stored data is not modified.
 */
function getFollowupTimestamp(followup, field = 'discussionDate') {
    let raw = '';

    if (field === 'followupDate') {
        raw = followup?.followupDate || '';
    } else {
        raw = followup?.discussionDate || followup?.followupDate || '';
    }

    if (!raw) {
        return null;
    }

    const time = new Date(raw).getTime();
    return Number.isNaN(time) ? null : time;
}

function getDiscussionTimestamp(followup) {
    return getFollowupTimestamp(followup, 'discussionDate');
}

function sortFollowups(followups, options = {}) {
    const { field = 'discussionDate', ascending = true } = options;
    const direction = ascending ? 1 : -1;

    return [...followups].sort((a, b) => {
        const timeA = getFollowupTimestamp(a, field);
        const timeB = getFollowupTimestamp(b, field);

        if (timeA === null && timeB === null) {
            return 0;
        }
        if (timeA === null) {
            return 1;
        }
        if (timeB === null) {
            return -1;
        }

        return (timeA - timeB) * direction;
    });
}

function sortFollowupsByDiscussionDate(followups, options = {}) {
    return sortFollowups(followups, { ...options, field: 'discussionDate' });
}

function groupFollowupsByDate(followups, options = {}) {
    const {
        field = 'discussionDate',
        ascending = true,
        formatDate = (timestamp) => new Date(timestamp).toLocaleDateString()
    } = options;
    const sorted = sortFollowups(followups, { field, ascending });
    const groups = [];

    sorted.forEach((followup) => {
        const timestamp = getFollowupTimestamp(followup, field);
        const dateLabel = timestamp === null ? '' : formatDate(timestamp);
        const lastGroup = groups[groups.length - 1];

        if (lastGroup && lastGroup.dateLabel === dateLabel) {
            lastGroup.items.push(followup);
            return;
        }

        groups.push({
            dateLabel,
            timestamp,
            items: [followup]
        });
    });

    return groups;
}

function groupFollowupsByDiscussionDate(followups, options = {}) {
    return groupFollowupsByDate(followups, { ...options, field: 'discussionDate' });
}

const FollowupSort = {
    getFollowupTimestamp,
    getDiscussionTimestamp,
    sortFollowups,
    sortFollowupsByDiscussionDate,
    groupFollowupsByDate,
    groupFollowupsByDiscussionDate
};

if (typeof window !== 'undefined') {
    window.FollowupSort = FollowupSort;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FollowupSort;
}
