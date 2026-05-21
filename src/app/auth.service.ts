import { Injectable, signal } from '@angular/core';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user = signal<User | null>(null);
  loading = signal<boolean>(true);

  constructor() {
    onAuthStateChanged(auth, (user) => {
      this.user.set(user);
      this.loading.set(false);
    });
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  }

  async logout() {
    await signOut(auth);
  }
}
