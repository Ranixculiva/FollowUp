const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
    sortFollowupsByDiscussionDate,
    groupFollowupsByDiscussionDate,
    getDiscussionTimestamp,
    sortFollowups
} = require('../js/followup-sort.js');

test('sortFollowupsByDiscussionDate orders by discussion date ascending', () => {
    const input = [
        { discussionDate: '2025-03-10', followupPlan: 'C' },
        { discussionDate: '2025-01-05', followupPlan: 'A' },
        { discussionDate: '2025-02-20', followupPlan: 'B' }
    ];

    const sorted = sortFollowupsByDiscussionDate(input);

    assert.deepEqual(sorted.map((item) => item.followupPlan), ['A', 'B', 'C']);
    assert.deepEqual(input.map((item) => item.followupPlan), ['C', 'A', 'B']);
});

test('sortFollowupsByDiscussionDate falls back to followupDate for legacy records', () => {
    const sorted = sortFollowupsByDiscussionDate([
        { followupDate: '2025-06-01', followupPlan: 'Later' },
        { discussionDate: '2025-01-01', followupPlan: 'Earlier' }
    ]);

    assert.deepEqual(sorted.map((item) => item.followupPlan), ['Earlier', 'Later']);
});

test('groupFollowupsByDiscussionDate groups sorted items without mutating stored fields', () => {
    const followups = [
        {
            customerId: '1',
            customerName: 'Ada',
            discussionDate: '2025-02-01',
            followupPlan: 'Plan A'
        },
        {
            customerId: '2',
            customerName: 'Bob',
            discussionDate: '2025-02-01',
            followupPlan: 'Plan B'
        },
        {
            customerId: '3',
            customerName: 'Cara',
            discussionDate: '2025-03-15',
            followupPlan: 'Plan C'
        }
    ];

    const groups = groupFollowupsByDiscussionDate(followups, {
        formatDate: (timestamp) => new Date(timestamp).toISOString().slice(0, 10)
    });

    assert.equal(groups.length, 2);
    assert.equal(groups[0].dateLabel, '2025-02-01');
    assert.equal(groups[0].items.length, 2);
    assert.equal(groups[1].dateLabel, '2025-03-15');
    assert.equal(followups[0].discussionDate, '2025-02-01');
});

test('sortFollowups orders by action date when field is followupDate', () => {
    const sorted = sortFollowups([
        { discussionDate: '2025-01-01', followupDate: '2025-06-01', followupPlan: 'Later action' },
        { discussionDate: '2025-05-01', followupDate: '2025-02-01', followupPlan: 'Earlier action' }
    ], { field: 'followupDate', ascending: true });

    assert.deepEqual(sorted.map((item) => item.followupPlan), ['Earlier action', 'Later action']);
});

test('getDiscussionTimestamp prefers discussionDate over followupDate', () => {
    const timestamp = getDiscussionTimestamp({
        discussionDate: '2025-04-01',
        followupDate: '2025-05-01'
    });

    assert.equal(timestamp, new Date('2025-04-01').getTime());
});
