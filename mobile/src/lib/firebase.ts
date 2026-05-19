import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Web client ID from Firebase console → Project settings → Your apps → Web app → OAuth client ID
// Required for Google Sign-In on Android to exchange the Google token for a Firebase credential.
const WEB_CLIENT_ID = '765847293388-REPLACE_WITH_WEB_CLIENT_ID.apps.googleusercontent.com';

GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });

export { auth, firestore, storage };

export const PROJECT_ID = 'my-brain-9d788';
export const agentApiUrl = `https://us-central1-${PROJECT_ID}.cloudfunctions.net/agentApi`;
