function getCustomers(callback) {
    const transaction = db.transaction(["customers"], "readonly");
    const store = transaction.objectStore("customers");
    const request = store.getAll();

    request.onsuccess = () => {
        callback(request.result);
    };
}

function getCustomer(id, callback) {
    const transaction = db.transaction(["customers"], "readonly");
    const store = transaction.objectStore("customers");
    const request = store.get(id);

    request.onsuccess = () => {
        callback(request.result);
    };
}

function saveCustomer(customer, followup, callback) {
    const transaction = db.transaction(["customers"], "readwrite");
    const store = transaction.objectStore("customers");
    const request = store.add(customer);

    request.onsuccess = () => {
        if (followup && followup.plan && followup.date) {
            const followupData = {
                customerId: request.result,
                plan: followup.plan,
                date: followup.date
            };

            const followupTransaction = db.transaction(["followups"], "readwrite");
            const followupStore = followupTransaction.objectStore("followups");
            followupStore.add(followupData);
        }

        if (callback) callback();
    };
}

function getFollowups(customerId, callback) {
    const transaction = db.transaction(["followups"], "readonly");
    const store = transaction.objectStore("followups");
    const index = store.index("customerId");
    const request = index.getAll(customerId);

    request.onsuccess = () => {
        callback(request.result);
    };
}
