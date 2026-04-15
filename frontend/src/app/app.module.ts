import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

// AUTH
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';

// SHARED
import { NavbarComponent } from './shared/navbar/navbar.component';

// CUSTOMER
import { CustomerHomeComponent } from './customer/customer-home/customer-home.component';
import { CustomerCartComponent } from './customer/customer-cart/customer-cart.component';
import { CustomerOrdersComponent } from './customer/customer-orders/customer-orders.component';
import { CustomerProfileComponent } from './customer/customer-profile/customer-profile.component';
import { ItemCardComponent } from './customer/item-card/item-card.component';
import { SuccessComponent } from './customer/success/success.component';
import { CustomerMenuComponent } from './customer/customer-menu/customer-menu.component';

// OWNER
import { HomePageComponent } from './RestaurantOwner/home-page/home-page.component';
import { MenuComponent } from './RestaurantOwner/menu/menu.component';
import { OrdersComponent } from './RestaurantOwner/orders/orders.component';
import { ProfileComponent } from './RestaurantOwner/profile/profile.component';
import { OwnerDashboardComponent } from './RestaurantOwner/owner-dashboard/owner-dashboard.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    NavbarComponent,
    CustomerHomeComponent,
    CustomerCartComponent,
    CustomerOrdersComponent,
    CustomerProfileComponent,
    ItemCardComponent,
    SuccessComponent,
    CustomerMenuComponent,
    HomePageComponent,
    MenuComponent,
    OrdersComponent,
    ProfileComponent,
    OwnerDashboardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}