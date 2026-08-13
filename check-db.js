import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA7QDjiPidXB2bBPT2XtoEHY2ceEe08dvo",
  authDomain: "barberia-3d632.firebaseapp.com",
  projectId: "barberia-3d632",
  databaseURL: "https://barberia-3d632-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function checkAppts() {
  const snapshot = await get(ref(db, 'appointments'));
  if (snapshot.exists()) {
    console.log(snapshot.val());
  } else {
    console.log("No appointments found.");
  }
  process.exit(0);
}

checkAppts();
