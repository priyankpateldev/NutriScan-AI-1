import { Injectable } from '@angular/core';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from './firebase.config';
import { UserProfile, ProductScan, DietType } from './models';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  private handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const path = `users/${uid}`;
    try {
      const docSnap = await getDoc(doc(db, 'users', uid));
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (e) {
      this.handleFirestoreError(e, OperationType.GET, path);
    }
    return null;
  }

  async saveUserProfile(profile: Partial<UserProfile>): Promise<void> {
    const uid = profile.uid || auth.currentUser?.uid;
    if (!uid) throw new Error('No user UID');
    const path = `users/${uid}`;
    try {
      await setDoc(doc(db, 'users', uid), {
        ...profile,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      this.handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  async initializeUser(user: { uid: string, displayName?: string | null, photoURL?: string | null }): Promise<void> {
    const existing = await this.getUserProfile(user.uid);
    if (!existing) {
      const path = `users/${user.uid}`;
      try {
        const newProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          preferences: {
            allergies: [],
            diet: DietType.None,
            goals: [],
            healthConditions: []
          },
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'users', user.uid), newProfile);
      } catch (e) {
        this.handleFirestoreError(e, OperationType.CREATE, path);
      }
    }
  }

  async addScan(scan: Omit<ProductScan, 'id' | 'userId' | 'scannedAt'>): Promise<string> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');
    const path = 'scans';
    try {
      const docRef = await addDoc(collection(db, 'scans'), {
        ...scan,
        userId,
        scannedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (e) {
      this.handleFirestoreError(e, OperationType.CREATE, path);
    }
    return '';
  }

  async getScans(): Promise<ProductScan[]> {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];
    const path = 'scans';
    try {
      const q = query(
        collection(db, 'scans'),
        where('userId', '==', userId),
        orderBy('scannedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as unknown as ProductScan[];
    } catch (e) {
      this.handleFirestoreError(e, OperationType.LIST, path);
    }
    return [];
  }

  async deleteScan(scanId: string): Promise<void> {
    const path = `scans/${scanId}`;
    try {
      await deleteDoc(doc(db, 'scans', scanId));
    } catch (e) {
      this.handleFirestoreError(e, OperationType.DELETE, path);
    }
  }
}
