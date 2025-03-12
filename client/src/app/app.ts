import { Component, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Short {
  id: number;
  duration: string;
  viralScore: number;
  thumbnail: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <!-- Header -->
      <header class="bg-white border-b border-slate-200">
        <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <h1 class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ShortZ
                </h1>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 rounded-full">
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm font-medium text-indigo-600">{{ credits() }} VidCoins</span>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <!-- Upload Section -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
          <div class="max-w-2xl mx-auto">
            <h2 class="text-2xl font-semibold text-slate-900 mb-2">Créer vos Shorts</h2>
            <p class="text-slate-600 mb-8">Transformez vos vidéos en shorts viraux optimisés pour les réseaux sociaux.</p>
            
            <div class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Votre vidéo source</label>
                <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-indigo-500 transition-colors duration-200">
                  <div class="space-y-2 text-center">
                    <svg class="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <div class="flex text-sm text-slate-600">
                      <label class="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                        <span>Sélectionner un fichier</span>
                        <input type="file" class="sr-only" (change)="onFileSelected($event)" accept="video/*">
                      </label>
                      <p class="pl-1">ou glisser-déposer</p>
                    </div>
                    <p class="text-xs text-slate-500">MP4, MOV jusqu'à 2GB</p>
                  </div>
                </div>
                <div *ngIf="selectedFile" class="mt-2 text-sm text-slate-600">
                  Fichier sélectionné: {{ selectedFile.name }}
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Durée des shorts</label>
                <select 
                  [(ngModel)]="selectedDuration"
                  class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg">
                  <option value="30">30 secondes - Format TikTok</option>
                  <option value="45">45 secondes - Format Instagram</option>
                  <option value="60">60 secondes - Format YouTube</option>
                </select>
              </div>

              <button 
                (click)="generateShorts()"
                [disabled]="isGenerating() || !selectedFile"
                class="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                <svg *ngIf="isGenerating()" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isGenerating() ? 'Génération en cours...' : 'Générer les Shorts' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Generated Shorts -->
        <div *ngIf="shorts().length > 0" class="space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-semibold text-slate-900">Vos Shorts</h2>
            <span class="text-sm text-slate-600">{{ shorts().length }} shorts générés</span>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div *ngFor="let short of shorts()" 
                class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div class="aspect-video bg-slate-100 relative">
                <img [src]="short.thumbnail" alt="Short thumbnail" class="w-full h-full object-cover">
                <div class="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-md">
                  {{ short.duration }}
                </div>
              </div>
              <div class="p-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    <span class="font-medium text-slate-900">Score viral: {{ short.viralScore }}</span>
                  </div>
                  <button class="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                    Télécharger
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class App {
  credits = signal(100);
  isGenerating = signal(false);
  shorts = signal<Short[]>([]);
  selectedFile: File | null = null;
  selectedDuration: string = '30';

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      this.selectedFile = file;
    } else {
      alert('Veuillez sélectionner un fichier vidéo valide');
    }
  }

  generateShorts() {
    if (this.credits() < 10) {
      alert('Crédits insuffisants ! Vous avez besoin de 10 VidCoins pour générer des shorts.');
      return;
    }

    this.isGenerating.set(true);
    
    // Simulation de la génération
    setTimeout(() => {
      const generatedShorts: Short[] = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        duration: `${this.selectedDuration}s`,
        viralScore: Math.round(Math.random() * 100),
        thumbnail: `https://picsum.photos/400/225?random=${i}`
      }));

      // Trier par score viral
      generatedShorts.sort((a, b) => b.viralScore - a.viralScore);

      this.shorts.set(generatedShorts);
      this.credits.update(credits => credits - 10);
      this.isGenerating.set(false);
    }, 3000);
  }
}

// Uncomment the line below to bootstrap this component directly for testing
// bootstrapApplication(App); 