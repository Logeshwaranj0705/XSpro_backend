const Employee = require("../models/employee");
const firestore = require("../config/firebase");
const getLatLng = require("../utils/geoCode");

const delay = ms => new Promise(res => setTimeout(res, ms));

function makeWorkerId(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_");
}

async function syncEmployeesToFirebase() {
    console.log("🔄 Employee sync started:", new Date().toISOString());

    const employees = await Employee.find();
    const currentWorkerIds = employees
        .filter(emp => emp.name)
        .map(emp => makeWorkerId(emp.name));
    const existingWorkersSnapshot = await firestore.collection("workers").get();
    for (const doc of existingWorkersSnapshot.docs) {
        if (!currentWorkerIds.includes(doc.id)) {
            await firestore.collection("workers").doc(doc.id).delete();
            await firestore.collection("assignments").doc(doc.id).delete();
            console.log(`🗑 Deleted old worker: ${doc.id}`);
        }
    }
    for (const emp of employees) {
        if (!emp.name) continue;

        const workerId = makeWorkerId(emp.name);

        await firestore.collection("workers").doc(workerId).set({
            name: emp.name,
            phone: emp.phone || "",
            password: "elshaddai_9897",
            updatedAt: new Date()
        });

        const points = [];
        let index = 1;

        for (const item of emp.work || []) {
            if (!item.includes(" - ")) continue;

            const [customerName, address] = item.split(" - ");
            const location = await getLatLng(address);
            if (!location) continue;

            points.push({
                id: "p" + index,
                name: customerName.trim(),
                lat: location.lat,
                lng: location.lng,
                visited: false
            });

            index++;
            await delay(1100);
        }

        await firestore.collection("assignments").doc(workerId).set({
            points,
            status: "pending",
            assignedAt: new Date()
        });

        console.log(`✅ Synced worker: ${workerId} | points: ${points.length}`);
    }

    console.log("🎉 Employee sync completed");
}

module.exports = syncEmployeesToFirebase;
