import { Component, inject, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../auth.service';
import { DatabaseService } from '../database.service';
import { animate } from 'motion';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="h-screen flex flex-col bg-brand-bg text-brand-ink overflow-hidden border-[12px] border-brand-ink sm:border-[24px]">
      <header class="flex justify-between items-center px-6 py-6 sm:px-12 sm:py-10 animate-fade-in">
        <div class="text-3xl font-black tracking-tighter sm:text-4xl">NUTRI/SCAN</div>
        <div class="hidden sm:block text-right">
          <div class="text-[10px] uppercase tracking-widest font-bold opacity-40">Powered by Gemini AI</div>
          <div class="text-sm font-bold">Shopping Personalized.</div>
        </div>
      </header>

      <main class="flex-grow flex flex-col justify-center px-6 sm:px-12 gap-8 relative">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15vw] font-black opacity-[0.03] pointer-events-none select-none uppercase tracking-tighter leading-none">
          BETTER<br/>BUY
        </div>

        <div class="max-w-3xl space-y-4">
          <div class="micro-label">Introducing NutriScan AI</div>
          <h1 class="text-7xl sm:text-8xl md:text-9xl font-black leading-[0.85] tracking-tighter uppercase mb-6">
            SCAN.<br/>DECIDE.<br/>BUY.
          </h1>
          <p class="max-w-md text-xl font-medium leading-tight opacity-80 mb-8 border-l-4 border-brand-ink pl-6 py-2">
            AI-driven nutrition analysis tailored to your <span class="underline decoration-2 underline-offset-4">allergies</span> and <span class="underline decoration-2 underline-offset-4">dietary goals</span>.
          </p>
        </div>

        <div class="flex flex-wrap gap-4 mt-4">
          <button class="btn-black flex items-center group" (click)="login()">
            <span>Sign in with Google</span>
            <mat-icon class="ml-4 transition-transform group-hover:translate-x-2">arrow_forward</mat-icon>
          </button>
          <div class="flex items-center gap-4 px-6 py-4 bg-brand-ink/5 border border-brand-ink/10">
            <mat-icon class="text-brand-ink/40">verified_user</mat-icon>
            <span class="text-[10px] uppercase font-black tracking-[0.2em] opacity-40">Secure & Personalized</span>
          </div>
        </div>
      </main>

      <footer class="h-20 sm:h-24 px-6 sm:px-12 flex items-center border-t border-brand-ink/10">
        <div class="flex gap-8 overflow-hidden whitespace-nowrap opacity-20">
           <div class="flex gap-8 animate-marquee">
              <span class="font-black text-xs uppercase tracking-widest">PERSONALIZED NUTRITION</span>
              <span class="font-black text-xs uppercase tracking-widest">AI ANALYSIS</span>
              <span class="font-black text-xs uppercase tracking-widest">ALLERGY ALERTS</span>
              <span class="font-black text-xs uppercase tracking-widest">BETTER BUY RECOMMENDATIONS</span>
              <!-- Repeated for marquee -->
              <span class="font-black text-xs uppercase tracking-widest">PERSONALIZED NUTRITION</span>
              <span class="font-black text-xs uppercase tracking-widest">AI ANALYSIS</span>
              <span class="font-black text-xs uppercase tracking-widest">ALLERGY ALERTS</span>
              <span class="font-black text-xs uppercase tracking-widest">BETTER BUY RECOMMENDATIONS</span>
           </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .animate-marquee {
      animation: marquee 30s linear infinite;
    }
    .animate-fade-in {
      animation: fadeIn 0.8s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
  host: { class: 'block' }
})
export class Landing implements AfterViewInit {
  private auth = inject(AuthService);
  private db = inject(DatabaseService);
  private router = inject(Router);

  async login() {
    try {
      const user = await this.auth.loginWithGoogle();
      if (user) {
        await this.db.initializeUser(user);
        this.router.navigate(['/dashboard']);
      }
    } catch (error) {
      console.error('Login failed', error);
    }
  }

  ngAfterViewInit() {
    const main = document.querySelector('main h1');
    if (main) {
      animate(main, { opacity: [0, 1], y: [20, 0] }, { duration: 1.2, ease: [0.22, 1, 0.36, 1] });
    }
  }
}
