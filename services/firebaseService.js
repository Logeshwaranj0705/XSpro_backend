const firestore = require("../config/firebase");

async function getAllWorkers() {
  try {
    const snapshot = await firestore.collection("workers").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Error fetching workers:", err);
    throw err;
  }
}

async function getAssignments(workerId) {
  try {
    const docRef = firestore.collection("assignments").doc(workerId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return { points: [] };
    return docSnap.data();
  } catch (err) {
    console.error(`Error fetching assignments for ${workerId}:`, err);
    throw err;
  }
}

module.exports = { getAllWorkers, getAssignments };
