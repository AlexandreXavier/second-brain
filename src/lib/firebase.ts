import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyDF_S0fsSgE6MXuby2n5Me0MkeoX7pzJrU",
  authDomain: "my-brain-9d788.firebaseapp.com",
  projectId: "my-brain-9d788",
  storageBucket: "my-brain-9d788.firebasestorage.app",
  messagingSenderId: "765847293388",
  appId: "1:765847293388:web:7c18d47a42cad54c35a169",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export const agentApiUrl =
  import.meta.env.VITE_AGENT_API_URL ||
  `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/agentApi`;

export const suggestTitleApiUrl =
  import.meta.env.VITE_SUGGEST_TITLE_API_URL ||
  `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/suggestTitle`;
