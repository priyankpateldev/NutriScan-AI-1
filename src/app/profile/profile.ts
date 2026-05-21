import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../auth.service';
import { DatabaseService } from '../database.service';
import { UserProfile, DietType } from '../models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MatButtonModule, 
    MatIconModule, MatFormFieldModule, MatSelectModule, MatChipsModule,
    MatInputModule, RouterLink
  ],
  template: `
    <div class="min-h-screen bg-brand-bg text-brand-ink flex flex-col border-[12px] sm:border-[24px] border-brand-ink">
      <header class="flex justify-between items-center px-10 pt-10 pb-6 shrink-0">
        <div class="flex items-center gap-6">
           <button mat-icon-button routerLink="/dashboard" class="!bg-brand-ink !text-white !p-2 !w-12 !h-12 flex items-center justify-center">
             <mat-icon>arrow_back</mat-icon>
           </button>
           <div class="text-2xl font-black tracking-tighter">VITA/PROFILE</div>
        </div>
        <button class="btn-black" (click)="save()">Save Profile</button>
      </header>

      <main class="flex-grow overflow-y-auto px-10 pb-12 custom-scroll">
         <div class="grid grid-cols-1 md:grid-cols-12 gap-12 max-w-6xl mx-auto">
            
            <!-- Sidebar Labels -->
            <div class="md:col-span-4 space-y-10">
               <div class="relative inline-block mb-4">
                  <div class="absolute -top-2 -left-2 w-10 h-10 border-t-4 border-l-4 border-brand-ink"></div>
                  <img [src]="userProfile()?.photoURL" alt="User Avatar" class="w-32 h-32 rounded-sm border border-brand-ink/10 grayscale shadow-sm" referrerpolicy="no-referrer">
                  <div class="absolute -bottom-2 -right-2 w-10 h-10 border-b-4 border-r-4 border-brand-ink"></div>
               </div>
               
               <div class="space-y-2">
                 <h2 class="text-4xl font-black tracking-tighter leading-none">{{ userProfile()?.displayName }}</h2>
                 <div class="micro-label !opacity-100 italic">NutriScan User Level 01</div>
               </div>

               <div class="p-6 bg-brand-ink text-white space-y-4">
                 <div class="micro-label !text-white/40">AI Context Engine</div>
                 <p class="text-xs font-medium leading-relaxed opacity-80">
                   This information is processed by Gemini AI to filter ingredients, calculate health scores, and generate survival warnings for your specific physiological profile.
                 </p>
               </div>
            </div>

            <!-- Form Area -->
            <div class="md:col-span-8 bg-white border border-brand-ink/10 p-10 shadow-sm relative">
               <div class="absolute inset-x-0 top-0 h-2 bg-brand-ink"></div>
               
               <form [formGroup]="profileForm" class="space-y-12">
                  
                  <div class="space-y-4">
                    <div class="flex items-center justify-between border-b-2 border-brand-ink pb-2">
                      <label for="diet-select" class="text-sm font-black uppercase tracking-widest">Dietary Restriction</label>
                      <mat-icon class="opacity-20">restaurant</mat-icon>
                    </div>
                    <mat-form-field appearance="outline" class="w-full !font-bold">
                       <mat-select id="diet-select" formControlName="diet">
                          @for (type of dietTypes; track type) {
                            <mat-option [value]="type" class="!font-bold">{{ type | titlecase }}</mat-option>
                          }
                       </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="space-y-4">
                    <div class="flex items-center justify-between border-b-2 border-brand-ink pb-2">
                      <label for="allergy-input" class="text-sm font-black uppercase tracking-widest">Known Allergies / Prohibited</label>
                      <mat-icon class="opacity-20 text-brand-accent-red">warning</mat-icon>
                    </div>
                    <div class="flex flex-wrap gap-2 py-4">
                       @for (allergy of selectedAllergies; track allergy) {
                         <div class="bg-brand-accent-red text-white px-4 py-2 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <span>{{ allergy }}</span>
                            <button (click)="removeAllergy(allergy)" class="hover:opacity-60 transition-opacity"><mat-icon class="!text-sm !w-auto !h-auto">close</mat-icon></button>
                         </div>
                       }
                       @if (selectedAllergies.length === 0) {
                         <div class="text-xs italic opacity-40">No allergies listed. AI will assume normal tolerance.</div>
                       }
                    </div>
                    <mat-form-field appearance="outline" class="w-full">
                       <input id="allergy-input" matInput placeholder="e.g. Peanuts, Palm Oil, Dairy" #allergyInput (keyup.enter)="addAllergy(allergyInput)">
                       <mat-hint class="!font-black !uppercase !tracking-tighter !text-[10px]">Press ENTER to inject parameter</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="space-y-4">
                    <div class="flex items-center justify-between border-b-2 border-brand-ink pb-2">
                      <label for="goal-input" class="text-sm font-black uppercase tracking-widest">Optimization Goals</label>
                      <mat-icon class="opacity-20 text-brand-accent-blue">flag</mat-icon>
                    </div>
                    <div class="flex flex-wrap gap-2 py-4">
                       @for (goal of selectedGoals; track goal) {
                         <div class="bg-brand-accent-blue text-white px-4 py-2 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <span>{{ goal }}</span>
                            <button (click)="removeGoal(goal)" class="hover:opacity-60 transition-opacity"><mat-icon class="!text-sm !w-auto !h-auto">close</mat-icon></button>
                         </div>
                       }
                       @if (selectedGoals.length === 0) {
                         <div class="text-xs italic opacity-40">No goals defined. AI will use standard health benchmarks.</div>
                       }
                    </div>
                    <mat-form-field appearance="outline" class="w-full">
                       <input id="goal-input" matInput placeholder="e.g. Muscle gain, Zero Sugar, Organic Only" #goalInput (keyup.enter)="addGoal(goalInput)">
                       <mat-hint class="!font-black !uppercase !tracking-tighter !text-[10px]">Press ENTER to set objective</mat-hint>
                    </mat-form-field>
                  </div>

               </form>
            </div>
         </div>
      </main>

      <footer class="h-16 border-t border-brand-ink/10 flex items-center px-10 gap-8 justify-between shrink-0">
         <div class="micro-label">PROFILE_STATE_STABLE</div>
         <div class="micro-label opacity-100">NUTRI/SCAN v1.0 • END TO END ENCRYPTION</div>
      </footer>
    </div>
  `,
  styles: [`
    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #1A1A1A; opacity: 0.2; }
  `],
  host: { class: 'block' }
})
export class Profile implements OnInit {
  private auth = inject(AuthService);
  private db = inject(DatabaseService);
  private router = inject(Router);

  userProfile = signal<UserProfile | null>(null);
  dietTypes = Object.values(DietType);
  selectedAllergies: string[] = [];
  selectedGoals: string[] = [];

  profileForm = new FormGroup({
    diet: new FormControl<DietType>(DietType.None)
  });

  async ngOnInit() {
    const user = this.auth.user();
    if (user) {
      const profile = await this.db.getUserProfile(user.uid);
      this.userProfile.set(profile);
      if (profile) {
        this.profileForm.patchValue({ diet: profile.preferences.diet as DietType });
        this.selectedAllergies = [...profile.preferences.allergies];
        this.selectedGoals = [...profile.preferences.goals];
      }
    } else {
      this.router.navigate(['/']);
    }
  }

  addAllergy(input: HTMLInputElement) {
    const value = input.value.trim();
    if (value && !this.selectedAllergies.includes(value)) {
      this.selectedAllergies.push(value);
      input.value = '';
    }
  }

  removeAllergy(allergy: string) {
    this.selectedAllergies = this.selectedAllergies.filter(a => a !== allergy);
  }

  addGoal(input: HTMLInputElement) {
    const value = input.value.trim();
    if (value && !this.selectedGoals.includes(value)) {
      this.selectedGoals.push(value);
      input.value = '';
    }
  }

  removeGoal(goal: string) {
    this.selectedGoals = this.selectedGoals.filter(g => g !== goal);
  }

  async save() {
    const user = this.auth.user();
    if (user && this.userProfile()) {
      await this.db.saveUserProfile({
        uid: user.uid,
        preferences: {
          diet: this.profileForm.value.diet || DietType.None,
          allergies: this.selectedAllergies,
          goals: this.selectedGoals,
          healthConditions: this.userProfile()!.preferences.healthConditions
        }
      });
      this.router.navigate(['/dashboard']);
    }
  }
}
