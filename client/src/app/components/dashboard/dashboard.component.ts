import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Short {
  id: number;
  duration: string;
  viralScore: number;
  thumbnail: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
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