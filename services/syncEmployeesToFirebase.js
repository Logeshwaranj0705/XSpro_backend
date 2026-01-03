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

    for (const emp of employees) {
        if (!emp.name) continue;

        const workerId = makeWorkerId(emp.name);

        await firestore.collection("workers").doc(workerId).set({
            name: emp.name,
            phone: emp.phone || "",
            password: "elsaddai_09",
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
