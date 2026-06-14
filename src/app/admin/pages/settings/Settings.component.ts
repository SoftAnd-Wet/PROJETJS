import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatSnackBarModule],
  templateUrl: './Settings.component.html',
  styleUrls:   ['./Settings.component.scss'],
})
export class SettingsComponent {

  platformName     = 'StudyTogether';
  maxMembers       = 10;
  requireApproval  = false;
  autoClose        = true;

  emailOnReport    = true;
  dailyDigest      = true;
  alertOnSpike     = false;

  constructor(private snack: MatSnackBar) {}

  save(): void {
    this.snack.open('Settings saved successfully.', 'OK', { duration: 2500 });
  }
}
