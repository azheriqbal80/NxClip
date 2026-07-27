import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { toast } from "sonner";
import firebaseConfig from "../firebase-applet-config.json";
import { safeStringify } from "./lib/utils";
import { getPersistedUser } from "./services/auth/authService";

const app = initializeApp(firebaseConfig);

const originalAuth = getAuth(app);

export const isFirebaseConfigured = 
  firebaseConfig && 
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== "remixed-project-id" &&
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "remixed-api-key";

export const auth = new Proxy(originalAuth, {
  get(target, prop, receiver) {
    if (prop === 'currentUser') {
      try {
        const user = getPersistedUser();
        if (user) {
          return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified ?? true,
            isAnonymous: false,
            providerData: [],
          };
        }
      } catch (e) {
        console.error("Error reading mock auth.currentUser:", e);
      }
      return null;
    }

    if (prop === 'onAuthStateChanged') {
      return (callback: (user: any) => void) => {
        const getCurrentUser = () => {
          try {
            const user = getPersistedUser();
            if (user) {
              return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                emailVerified: user.emailVerified ?? true,
                isAnonymous: false,
                providerData: [],
              };
            }
          } catch (e) {
            console.error("Error reading mock auth.currentUser in onAuthStateChanged:", e);
          }
          return null;
        };

        // Fire immediately with current state
        callback(getCurrentUser());

        const handleAuthChange = () => {
          callback(getCurrentUser());
        };

        if (typeof window !== "undefined") {
          window.addEventListener("storage", handleAuthChange);
          window.addEventListener("nx_auth_state_changed", handleAuthChange);
        }

        return () => {
          if (typeof window !== "undefined") {
            window.removeEventListener("storage", handleAuthChange);
            window.removeEventListener("nx_auth_state_changed", handleAuthChange);
          }
        };
      };
    }
    
    const value = Reflect.get(target, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(target);
    }
    return value;
  }
});

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, (firebaseConfig as any).firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  
  console.error('Firestore Error: ', safeStringify(errInfo));

  // User-friendly mapping
  let friendlyMessage = "Something went wrong with the database. Please try again.";
  if (errorMessage.includes("permission-denied") || errorMessage.includes("insufficient permissions")) {
    friendlyMessage = `You don't have permission to ${operationType} this data.`;
  } else if (errorMessage.includes("quota-exceeded")) {
    friendlyMessage = "Database quota exceeded. Please try again tomorrow.";
  } else if (errorMessage.includes("offline")) {
    friendlyMessage = "You appear to be offline. Please check your connection.";
  } else if (errorMessage.includes("not-found")) {
    friendlyMessage = "The requested data was not found.";
  }

  toast.error("Database Error", {
    description: friendlyMessage,
    action: {
      label: "Retry",
      onClick: () => window.location.reload(),
    }
  });

  throw new Error(safeStringify(errInfo));
}


