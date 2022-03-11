import {Injectable} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ErrorNotifier {

  public snackBarOptions = { panelClass: ['backenderror-snackbar'], duration: 6000 };

  constructor(public snackBar: MatSnackBar) { }

  showSuccess(message: string): void {
    this.snackBar.open(message);
  }

  showError(message: string): void {
    // The second parameter is the text in the button.
    // In the third, we send in the css class for the snack bar.
    this.snackBar.open(message, ' ', this.snackBarOptions);
  }
}
