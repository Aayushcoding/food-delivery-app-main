import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-menu',
  templateUrl: './add-menu.component.html',
  styleUrls: ['./add-menu.component.css']
})
export class AddMenuComponent {

  menuForm!: FormGroup;
  submitted = false;

  categories = ['FastFood', 'Indian', 'Chinese', 'Continental'];

  constructor(private formBuilder: FormBuilder) {
    this.initForm();
  }

  private initForm(): void {
    this.menuForm = this.formBuilder.group({
      itemName: ['', Validators.required],
      price: ['', Validators.required],
      category: ['', Validators.required],
      description: ['', Validators.required],
      isVeg: [false]
    });
  }

  get f() {
    return this.menuForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.menuForm.invalid) {
      return;
    }

    alert('Menu item added successfully!');
    this.menuForm.reset();
    this.submitted = false;
  }

}