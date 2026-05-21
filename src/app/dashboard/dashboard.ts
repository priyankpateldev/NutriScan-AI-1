import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { DatabaseService } from '../database.service';
import { ProductScan, UserProfile } from '../models';
import { animate, stagger } from 'motion';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule, RouterLink],
  template: `
    <div class="h-screen flex flex-col bg-brand-bg text-brand-ink overflow-hidden border-4 border-brand-ink">
      <!-- Header -->
      <header class="flex justify-between items-center px-6 py-6 sm:px-10 border-b border-brand-ink/10">
        <div class="text-2xl font-black tracking-tighter">NUTRI/SCAN</div>
        <div class="flex items-center gap-6">
          <div class="hidden sm:block text-right">
            <div class="micro-label !opacity-100 mb-1">Current Profile</div>
            <div class="text-sm font-bold flex items-center gap-2">
              {{ userProfile()?.displayName }} / <span class="text-emerald-600">{{ userProfile()?.preferences?.diet }}</span>
            </div>
          </div>
          <button routerLink="/profile" class="w-10 h-10 rounded-full bg-brand-ink flex items-center justify-center text-white font-bold text-xs border-2 border-brand-ink hover:bg-transparent hover:text-brand-ink transition-colors overflow-hidden">
            <img [src]="userProfile()?.photoURL" alt="Profile" referrerpolicy="no-referrer" class="w-full h-full object-cover">
          </button>
          <button mat-icon-button (click)="logout()">
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </header>

      <!-- Main Scrollable Area -->
      <main class="flex-grow overflow-y-auto px-6 py-10 sm:px-10 relative">
        <div class="max-w-6xl mx-auto space-y-12">
          
          <!-- Summary Banner -->
          <section class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white p-8 sm:p-12 border border-brand-ink/10 shadow-sm relative overflow-hidden">
            <div class="md:col-span-8 space-y-4">
              <div class="micro-label !text-emerald-600">Active Intelligence</div>
              <h2 class="text-5xl sm:text-7xl font-black leading-[0.9] tracking-tighter">
                SCAN YOUR<br/>PURCHASE.
              </h2>
              <p class="max-w-md font-medium text-slate-500 italic">Get instant AI-driven verdicts based on your dietary constraints and health goals.</p>
            </div>
            <div class="md:col-span-4 flex justify-end">
              <button class="btn-black !py-8 !px-12 !text-lg flex items-center gap-4 group" routerLink="/scan">
                <mat-icon class="!w-auto !h-auto !text-3xl">camera</mat-icon>
                <span>SCAN NOW</span>
              </button>
            </div>
            <div class="absolute -top-10 -right-10 text-[20vw] font-black opacity-[0.02] pointer-events-none select-none">AI</div>
          </section>

          <!-- Metrics -->
          <section class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
             <div class="p-6 border border-brand-ink shadow-sm bg-white">
                <div class="micro-label mb-2">History</div>
                <div class="text-4xl font-black leading-none">{{ scans().length }}</div>
                <div class="text-[10px] font-bold opacity-40 mt-1 uppercase tracking-widest">Total Scans</div>
             </div>
             <div class="p-6 border border-brand-ink shadow-sm bg-brand-ink text-white">
                <div class="micro-label !text-white/40 mb-2">Performance</div>
                <div class="text-4xl font-black leading-none text-emerald-400">{{ goodMatchCount() }}</div>
                <div class="text-[10px] font-bold text-white/40 mt-1 uppercase tracking-widest">Better Buys Found</div>
             </div>
             <div class="p-6 border border-brand-ink shadow-sm bg-white">
                <div class="micro-label mb-2">Diet</div>
                <div class="text-4xl font-black leading-none truncate">{{ userProfile()?.preferences?.diet || 'None' }}</div>
                <div class="text-[10px] font-bold opacity-40 mt-1 uppercase tracking-widest">Active Constraint</div>
             </div>
             <div class="p-6 border border-brand-ink shadow-sm bg-emerald-500 text-white">
                <div class="micro-label !text-white/40 mb-2">Status</div>
                <div class="text-4xl font-black leading-none">ACTIVE</div>
                <div class="text-[10px] font-bold text-white/40 mt-1 uppercase tracking-widest">Scanning Engine</div>
             </div>
          </section>

          <!-- History List -->
          <div class="space-y-6">
            <div class="flex justify-between items-end border-b-2 border-brand-ink pb-2">
              <h3 class="text-2xl font-black tracking-tighter">RECENT / LOGS</h3>
              <div class="micro-label">History ({{ scans().length }})</div>
            </div>

            @if (loading()) {
              <div class="h-64 flex items-center justify-center">
                 <div class="micro-label animate-pulse italic">RELOADING ENGINE...</div>
              </div>
            } @else if (scans().length === 0) {
              <div class="h-64 border-4 border-dashed border-brand-ink/10 flex flex-col items-center justify-center gap-4 text-brand-ink/40">
                 <mat-icon class="!w-auto !h-auto !text-6xl">receipt_long</mat-icon>
                 <div class="micro-label">No data logs found. Start scanning.</div>
              </div>
            } @else {
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="scan-grid">
                @for (scan of scans(); track scan.id) {
                  <div class="bold-card bold-card-accents scan-item bg-white">
                    <div class="aspect-[16/9] bg-slate-100 relative overflow-hidden border-b border-brand-ink/10">
                      <img [src]="scan.imageUrl" [alt]="scan.productName" class="w-full h-full object-cover grayscale-[0.5] hover:grayscale-0 transition-all duration-500">
                      <div class="absolute top-4 right-4 bg-brand-ink text-white text-[10px] font-black uppercase tracking-widest px-3 py-1">
                        {{ scan.category }}
                      </div>
                    </div>
                    <div class="p-6 space-y-4">
                      <div class="flex justify-between items-start">
                        <h4 class="text-xl font-black leading-tight flex-1 truncate pr-4">{{ scan.productName }}</h4>
                        <div [class]="scan.analysis.isGoodMatch ? 'text-emerald-600' : 'text-brand-accent-red'">
                          <mat-icon>{{ scan.analysis.isGoodMatch ? 'verified' : 'report' }}</mat-icon>
                        </div>
                      </div>
                      
                      <p class="text-sm font-medium leading-tight opacity-60 line-clamp-2 italic">"{{ scan.analysis.summary }}"</p>
                      
                      <div class="flex items-center justify-between pt-4 border-t border-brand-ink/10">
                        <div>
                          <div class="micro-label mb-1">Verdict Score</div>
                          <div class="text-2xl font-black">{{ scan.analysis.score }}<span class="text-xs opacity-20 ml-1">/100</span></div>
                        </div>
                        <button class="bg-brand-ink/5 hover:bg-brand-accent-red/10 hover:text-brand-accent-red p-2 rounded-sm transition-colors" (click)="deleteScan(scan.id!)">
                          <mat-icon>delete_outline</mat-icon>
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </main>

      <footer class="h-16 border-t border-brand-ink/10 flex items-center px-10 gap-8 justify-center sm:justify-start">
         <div class="micro-label">SYSTEM READY</div>
         <div class="flex-grow hidden sm:block h-px bg-brand-ink/10"></div>
         <div class="micro-label opacity-100">NUTRI/SCAN v1.0.0 (BETA)</div>
      </footer>
    </div>
  `,
  host: { class: 'block' }
})
export class Dashboard implements OnInit {
  private auth = inject(AuthService);
  private db = inject(DatabaseService);
  private router = inject(Router);

  userProfile = signal<UserProfile | null>(null);
  scans = signal<ProductScan[]>([]);
  loading = signal(true);

  async ngOnInit() {
    const user = this.auth.user();
    if (user) {
      const profile = await this.db.getUserProfile(user.uid);
      this.userProfile.set(profile);
      this.loadScans();
    } else {
      this.router.navigate(['/']);
    }
  }

  async loadScans() {
    this.loading.set(true);
    const scans = await this.db.getScans();
    this.scans.set(scans);
    this.loading.set(false);
    
    setTimeout(() => this.animateItems(), 100);
  }

  goodMatchCount() {
    return this.scans().filter(s => s.analysis.isGoodMatch).length;
  }

  async deleteScan(id: string) {
    if (confirm('Delete this scan log?')) {
      await this.db.deleteScan(id);
      this.scans.update(s => s.filter(item => item.id !== id));
    }
  }

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/']);
  }

  private animateItems() {
    const items = document.querySelectorAll('.scan-item');
    if (items.length > 0) {
      animate(items, { opacity: [0, 1], y: [20, 0] }, { 
        delay: stagger(0.05),
        duration: 0.5, 
        ease: "easeOut" 
      });
    }
  }
}
