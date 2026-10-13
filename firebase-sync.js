import { firebaseConfig } from './firebase-config.js';

// O app funciona inteiramente no navegador sem Firebase. Quando a configuração
// estiver preenchida, ele usa login anônimo e mantém um único documento privado
// por usuário em Firestore.
let api = null;

if (firebaseConfig?.apiKey && firebaseConfig?.projectId) {
  try {
    const [{ initializeApp }, { getAuth, signInAnonymously }, { getFirestore, doc, getDoc, setDoc }] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js'),
    ]);
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const credential = await signInAnonymously(auth);
    const db = getFirestore(app);
    const stateRef = doc(db, 'users', credential.user.uid, 'profile', 'today');
    api = {
      async load() {
        const snapshot = await getDoc(stateRef);
        return snapshot.exists() ? snapshot.data().state : null;
      },
      async save(state) {
        await setDoc(stateRef, { state, updatedAt: new Date().toISOString() }, { merge: true });
      },
    };
  } catch (error) {
    console.warn('Firebase indisponível. O app continuará usando o armazenamento local.', error);
  }
}

window.fitpulseFirebase = api;
window.dispatchEvent(new Event('fitpulse:firebase-ready'));
