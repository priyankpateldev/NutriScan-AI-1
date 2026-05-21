import { Component, ElementRef, ViewChild, inject, signal, OnDestroy, AfterViewInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AiService } from '../ai.service';
import { DatabaseService } from '../database.service';
import { AuthService } from '../auth.service';
import { ScanAnalysis, UserProfile } from '../models';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, RouterLink],
  template: `
    <div class="h-screen flex flex-col bg-brand-ink text-white overflow-hidden border-4 border-brand-ink sm:border-[12px]">
      
      <!-- Top Rail Navigation -->
      <header class="flex justify-between items-center px-6 py-6 sm:px-10 border-b border-white/10 shrink-0">
        <div class="text-xl font-black tracking-tighter">N/SCAN v1.0</div>
        <button routerLink="/dashboard" class="flex items-center gap-2 micro-label !text-white !opacity-100 bg-white/10 hover:bg-white/20 px-4 py-2 transition-colors">
          <mat-icon class="!text-sm !w-auto !h-auto">close</mat-icon>
          <span>Abort Scan</span>
        </button>
      </header>

      <!-- Camera Area with Brutalist Accents -->
      <div class="relative flex-1 bg-black overflow-hidden flex flex-col">
        <video #video autoplay playsinline class="w-full h-full object-cover grayscale opacity-60"></video>
        <canvas #canvas class="hidden"></canvas>
        
        <!-- Overlay -->
        <div class="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
          <div class="w-full max-w-sm aspect-square relative px-8">
            <div class="absolute inset-0 border-[24px] border-black/40"></div>
            <div class="w-full h-full border-4 border-brand-bg relative">
               <!-- Animated Corner Accents -->
               <div class="absolute -top-2 -left-2 w-10 h-10 border-t-8 border-l-8 border-brand-bg"></div>
               <div class="absolute -top-2 -right-2 w-10 h-10 border-t-8 border-r-8 border-brand-bg"></div>
               <div class="absolute -bottom-2 -left-2 w-10 h-10 border-b-8 border-l-8 border-brand-bg"></div>
               <div class="absolute -bottom-2 -right-2 w-10 h-10 border-b-8 border-r-8 border-brand-bg"></div>
               
               <!-- Scan Line -->
               <div class="absolute top-0 left-0 right-0 h-1 bg-brand-bg shadow-[0_0_20px_rgba(248,247,242,0.8)] animate-scan-y"></div>
            </div>
          </div>
          
          <div class="mt-8 text-center px-10">
            <div class="micro-label !text-brand-bg !opacity-100 mb-2">Optical Analysis Engine</div>
            <p class="text-lg font-black uppercase tracking-tighter italic">Position the nutrition label<br/>within the frame</p>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="bg-brand-ink px-10 py-10 flex items-center justify-between shrink-0">
        <div class="flex-1 hidden sm:flex flex-col">
           <div class="micro-label !text-white/40 mb-1">System State</div>
           <div class="text-xs font-bold font-mono tracking-widest text-emerald-400">CAMERA_ACTIVE_GR_01</div>
        </div>
        
        <button (click)="capture()" [disabled]="isProcessing()"
                class="w-24 h-24 rounded-full border-8 border-white p-2 flex items-center justify-center group active:scale-90 transition-transform disabled:opacity-50">
          <div class="w-full h-full rounded-full bg-white group-hover:scale-90 transition-transform"></div>
        </button>

        <div class="flex-1 flex justify-end">
           <div class="micro-label !text-white/40 mb-1 hidden sm:block text-right">Detection</div>
           <div class="text-xs font-bold font-mono tracking-widest text-emerald-400 hidden sm:block">READY_TO_EXTRACT</div>
        </div>
      </div>

      <!-- Processing Modal (Themed) -->
      @if (isProcessing()) {
        <div class="fixed inset-0 z-[100] bg-brand-ink flex flex-col items-center justify-center p-12 text-center animate-fade-in">
           <div class="text-[12vw] font-black leading-[0.8] tracking-tighter mb-8 animate-pulse text-white">
              ANALYZING<br/>NUTRITION<br/>DATA
           </div>
           <div class="h-1 w-64 bg-white/10 relative overflow-hidden">
              <div class="absolute inset-0 bg-white animate-progress"></div>
           </div>
           <div class="mt-6 micro-label !text-white !opacity-40 italic">Querying Intelligence Server...</div>
        </div>
      }

      <!-- Result View (Themed as per instructions) -->
      @if (result(); as r) {
        <div class="fixed inset-0 z-[150] bg-brand-bg text-brand-ink flex flex-col overflow-hidden animate-slide-up border-[12px] sm:border-[24px] border-brand-ink">
          <header class="flex justify-between items-center px-8 pt-8 pb-4 shrink-0">
            <div class="text-xl font-black tracking-tighter">VITA/SCAN RESULT</div>
            <button (click)="result.set(null)" class="micro-label !opacity-100 flex items-center gap-2">
              <mat-icon class="!text-sm !w-auto !h-auto">close</mat-icon>
              <span>Dismiss</span>
            </button>
          </header>

          <main class="flex-grow grid grid-cols-1 md:grid-cols-12 px-8 pb-8 gap-8 overflow-hidden">
            <!-- Left: Product Context -->
            <div class="col-span-full md:col-span-5 flex flex-col justify-center gap-6 overflow-y-auto pr-4 custom-scroll">
              <div class="relative">
                <div class="absolute -top-3 -left-3 w-10 h-10 border-t-4 border-l-4 border-brand-ink"></div>
                <div class="bg-white aspect-square w-full rounded-sm shadow-sm flex flex-col items-center justify-center border border-brand-ink/5 overflow-hidden">
                  <img [src]="capturedImage()" [alt]="r.productName" class="w-full h-full object-cover grayscale opacity-80">
                </div>
                <div class="absolute -bottom-3 -right-3 w-10 h-10 border-b-4 border-r-4 border-brand-ink"></div>
              </div>

              <div class="space-y-4 bg-white p-6 border border-brand-ink/10">
                <div class="micro-label">Captured Label Data</div>
                <h3 class="text-2xl font-black truncate leading-none uppercase">{{ r.productName }}</h3>
                <div class="text-xs font-bold text-brand-accent-blue tracking-widest uppercase">Category: {{ r.category }}</div>
                
                <div class="pt-4 space-y-3">
                  @if (r.analysis.nutritionInfo) {
                    @for (item of nutritionArray(r.analysis.nutritionInfo); track item.key) {
                      <div class="border-b border-brand-ink/10 pb-1 flex justify-between items-end">
                         <span class="text-xs font-bold uppercase opacity-40">{{ item.key }}</span>
                         <span class="font-black text-sm">{{ item.value }}</span>
                      </div>
                    }
                  }
                </div>
              </div>
            </div>

            <!-- Right: AI Verdict -->
            <div class="col-span-full md:col-span-7 flex flex-col justify-center items-end text-right">
              <div class="micro-label opacity-100 bg-brand-ink text-brand-bg px-3 py-1 mb-6">NUTRI/AI VERDICT</div>
              
              <div class="verdict-huge" [class.text-brand-accent-red]="!r.analysis.isGoodMatch" [class.text-emerald-600]="r.analysis.isGoodMatch" [innerHTML]="r.analysis.isGoodMatch ? 'BEST<br/>BUY' : 'NOT<br/>BEST<br/>BUY'">
              </div>

              <p class="max-w-md text-lg font-medium leading-tight opacity-80 mt-6 mb-8 italic">
                {{ r.analysis.summary }}
              </p>

              <div class="bg-white p-6 rounded-sm text-left w-full border-l-8 border-brand-accent-blue shadow-sm">
                <div class="micro-label !text-brand-accent-blue !opacity-100 mb-2">Recommendation</div>
                <div class="flex justify-between items-center">
                  <div class="font-black text-2xl leading-none uppercase pr-4">{{ r.analysis.recommendation }}</div>
                  <mat-icon class="!w-auto !h-auto !text-4xl">arrow_forward</mat-icon>
                </div>
              </div>
              
              <div class="mt-8 flex gap-4">
                <button class="btn-black" routerLink="/dashboard">Close & Log</button>
                <button class="btn-outline" (click)="result.set(null)">Scan Again</button>
              </div>
            </div>
          </main>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes scanY {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(224px); } /* 256px container height - line height */
    }
    .animate-scan-y { animation: scanY 3s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
    @keyframes progress {
      from { transform: translateX(-100%); }
      to { transform: translateX(100%); }
    }
    .animate-progress { animation: progress 2s linear infinite; }
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
    .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #1A1A1A; opacity: 0.2; }
  `],
  host: { class: 'block' }
})
export class Scanner implements AfterViewInit, OnDestroy {
  @ViewChild('video') video!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  private ai = inject(AiService);
  private db = inject(DatabaseService);
  private auth = inject(AuthService);
  private router = inject(Router);

  stream: MediaStream | null = null;
  isProcessing = signal(false);
  result = signal<{ productName: string, category: string, analysis: ScanAnalysis, id: string } | null>(null);
  capturedImage = signal<string | null>(null);

  ngAfterViewInit() {
    this.startCamera();
  }

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
        audio: false
      });
      this.video.nativeElement.srcObject = this.stream;
    } catch (err) {
      console.error('Camera access error:', err);
      // alert('Could not access camera. Please allow camera permissions.');
      this.router.navigate(['/dashboard']);
    }
  }

  async capture() {
    const video = this.video.nativeElement;
    const canvas = this.canvas.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    this.capturedImage.set(dataUrl);

    this.isProcessing.set(true);
    const base64 = dataUrl.split(',')[1];

    try {
      const user = this.auth.user();
      let profile: UserProfile | null = null;
      if (user) {
        profile = await this.db.getUserProfile(user.uid);
      }

      const analysis = await this.ai.analyzeProduct(base64, profile);
      
      const scanId = await this.db.addScan({
        productName: analysis.productName,
        category: analysis.category as 'food' | 'beverage' | 'personal-care' | 'household' | 'other',
        imageUrl: dataUrl,
        analysis: analysis.analysis as ScanAnalysis
      });

      this.result.set({ ...analysis, id: scanId } as { productName: string, category: string, analysis: ScanAnalysis, id: string });
    } catch (err) {
      console.error('Analysis error:', err);
      // alert('AI failed to analyze. Try a clearer photo.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  nutritionArray(info: Record<string, string>) {
    if (!info) return [];
    return Object.keys(info).map(key => ({ key, value: info[key] }));
  }

  ngOnDestroy() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }
}
