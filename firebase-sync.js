import { firebaseConfig } from './firebase-config.js';

// O app funciona inteiramente no navegador sem Firebase. Quando a configuração
// estiver preenchida, ele exige login com Google e mantém um documento privado
// por usuário em Firestore.
let api = null;

if (firebaseConfig?.apiKey && firebaseConfig?.projectId) {
  try {
    const [{ initializeApp }, { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }, { getFirestore, doc, getDoc, setDoc }] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js'),
    ]);
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const provider = new GoogleAuthProvider();
    const stateRef = () => auth.currentUser ? doc(db, 'users', auth.currentUser.uid, 'profile', 'today') : null;
    api = {
      getUser() { return auth.currentUser; },
      async signIn() { await signInWithPopup(auth, provider); },
      async signOut() { await signOut(auth); },
      async load() {
        const ref = stateRef();
        if (!ref) return null;
        const snapshot = await getDoc(ref);
        return snapshot.exists() ? snapshot.data().state : null;
      },
      async save(state) {
        const ref = stateRef();
        if (ref) await setDoc(ref, { state, updatedAt: new Date().toISOString() }, { merge: true });
      },
    };
    onAuthStateChanged(auth, user => window.dispatchEvent(new CustomEvent('fitpulse:auth-changed', { detail: user })));
  } catch (error) {
    console.warn('Firebase indisponível. O app continuará usando o armazenamento local.', error);
  }
}

window.fitpulseFirebase = api;
window.dispatchEvent(new Event('fitpulse:firebase-ready'));
