import { NgModule } from '@angular/core';
import { RouterModule,Routes } from '@angular/router';

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

import { AuthGuard } from './core/guards/auth.guard';

const routes:Routes=[

{path:'',redirectTo:'login',pathMatch:'full'},

{path:'login',component:LoginComponent},
{path:'signup',component:SignupComponent},

// PROTECTED CUSTOMER ROUTES
{path:'customer/customer-home',component:CustomerHomeComponent,canActivate:[AuthGuard]},
{path:'customer/cart',component:CustomerCartComponent,canActivate:[AuthGuard]},
{path:'customer/orders',component:CustomerOrdersComponent,canActivate:[AuthGuard]},
{path:'customer/profile',component:CustomerProfileComponent,canActivate:[AuthGuard]},
{path:'customer/success',component:SuccessComponent,canActivate:[AuthGuard]},

// MENU ROUTE (Dynamic - :id is restaurant ID)
{path:'menu/:id',component:CustomerMenuComponent,canActivate:[AuthGuard]},

// PROTECTED OWNER ROUTES
{path:'restaurant',component:HomePageComponent,canActivate:[AuthGuard]},
{path:'owner/menu',component:MenuComponent,canActivate:[AuthGuard]},
{path:'owner/orders',component:OrdersComponent,canActivate:[AuthGuard]},

// Wildcard - redirect to login if no route matches
{path:'**',redirectTo:'login'}

];

@NgModule({
imports:[RouterModule.forRoot(routes)],
exports:[RouterModule]
})
export class AppRoutingModule{}