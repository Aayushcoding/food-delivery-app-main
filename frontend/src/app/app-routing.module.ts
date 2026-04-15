import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';

import { CustomerHomeComponent } from './customer/customer-home/customer-home.component';
import { CustomerCartComponent } from './customer/customer-cart/customer-cart.component';
import { CustomerOrdersComponent } from './customer/customer-orders/customer-orders.component';
import { CustomerProfileComponent } from './customer/customer-profile/customer-profile.component';
import { SuccessComponent } from './customer/success/success.component';
import { CustomerMenuComponent } from './customer/customer-menu/customer-menu.component';

import { HomePageComponent } from './RestaurantOwner/home-page/home-page.component';
import { MenuComponent } from './RestaurantOwner/menu/menu.component';
import { OrdersComponent } from './RestaurantOwner/orders/orders.component';
import { ProfileComponent } from './RestaurantOwner/profile/profile.component';
import { OwnerDashboardComponent } from './RestaurantOwner/owner-dashboard/owner-dashboard.component';

import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [

  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Public auth routes
  { path: 'login',  component: LoginComponent },
  { path: 'signup', component: SignupComponent },

  // ── CUSTOMER-ONLY ROUTES ───────────────────────────────────────────────
  { path: 'customer/customer-home', component: CustomerHomeComponent, canActivate: [AuthGuard], data: { roles: ['Customer'] } },
  { path: 'customer/cart',          component: CustomerCartComponent,  canActivate: [AuthGuard], data: { roles: ['Customer'] } },
  { path: 'customer/orders',        component: CustomerOrdersComponent,canActivate: [AuthGuard], data: { roles: ['Customer'] } },
  { path: 'customer/profile',       component: CustomerProfileComponent, canActivate: [AuthGuard], data: { roles: ['Customer'] } },
  { path: 'customer/success',       component: SuccessComponent,       canActivate: [AuthGuard], data: { roles: ['Customer'] } },
  { path: 'menu/:id',               component: CustomerMenuComponent,  canActivate: [AuthGuard], data: { roles: ['Customer'] } },

  // ── OWNER-ONLY ROUTES ──────────────────────────────────────────────────
  { path: 'restaurant',  component: HomePageComponent, canActivate: [AuthGuard], data: { roles: ['Owner'] } },
  { path: 'owner/menu',      component: MenuComponent,           canActivate: [AuthGuard], data: { roles: ['Owner'] } },
  { path: 'owner/orders',    component: OrdersComponent,         canActivate: [AuthGuard], data: { roles: ['Owner'] } },
  { path: 'owner/profile',   component: ProfileComponent,        canActivate: [AuthGuard], data: { roles: ['Owner'] } },
  { path: 'owner/dashboard', component: OwnerDashboardComponent, canActivate: [AuthGuard], data: { roles: ['Owner'] } },

  // Wildcard — redirect unknown paths to login
  { path: '**', redirectTo: 'login' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}