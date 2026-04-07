import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { OwnerRoutingModule } from './owner-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AddMenuComponent } from './add-menu/add-menu.component';
import { ManageOrdersComponent } from './manage-orders/manage-orders.component';

@NgModule({
  declarations: [
    DashboardComponent,
    AddMenuComponent,
    ManageOrdersComponent
  ],
  imports: [
    CommonModule,
    OwnerRoutingModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class OwnerModule { }