import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'ShortZ';

  ngOnInit() {
    // Initialiser Firebase avec la configuration depuis l'environnement
    initializeApp(environment.firebase);
  }
}
