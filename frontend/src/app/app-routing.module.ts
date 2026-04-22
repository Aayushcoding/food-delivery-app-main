import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// ── Auth ────────────────────────────────────────────────────────────────────
import { LandingComponent } from './auth/landing/landing.component';
import { AuthComponent } from './auth/auth/auth.component';

// ── Customer ─────────────────────────────────────────────────────────────────
import { CustomerHomeComponent } from './customer/customer-home/customer-home.component';
import { CustomerCartComponent } from './customer/customer-cart/customer-cart.component';
import { CustomerOrdersComponent } from './customer/customer-orders/customer-orders.component';
import { CustomerProfileComponent } from './customer/customer-profile/customer-profile.component';
import { SuccessComponent } from './customer/success/success.component';
import { CustomerMenuComponent } from './customer/customer-menu/customer-menu.component';
import { DiscountsComponent } from './customer/discounts/discounts.component';
import { InvoiceComponent } from './customer/invoice/invoice.component';

// ── Restaurant Owner ─────────────────────────────────────────────────────────
import { HomePageComponent } from './RestaurantOwner/home-page/home-page.component';
import { MenuComponent } from './RestaurantOwner/menu/menu.component';
import { OrdersComponent } from './RestaurantOwner/orders/orders.component';
import { ProfileComponent } from './RestaurantOwner/profile/profile.component';
import { OwnerDashboardComponent } from './RestaurantOwner/owner-dashboard/owner-dashboard.component';


// ── Agent ─────────────────────────────────────────────────────
import { AgentDashboardComponent } from './agent/agent-dashboard/agent-dashboard.component';
import { AgentProfileComponent } from './agent/agent-profile/agent-profile.component';

// ── Guards ────────────────────────────────────────────────────────────────────
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [

  // ── Landing (role selector hero page) ───────────────────────────────────
  { path: '', component: LandingComponent },
  { path: 'select-role', redirectTo: '', pathMatch: 'full' },

  // ── Unified Auth ─────────────────────────────────────────────────────────
  { path: 'auth', component: AuthComponent },

  // ── Legacy auth routes → redirect to /auth ───────────────────────────────
  { path: 'login', redirectTo: 'auth', pathMatch: 'full' },
  { path: 'login/customer', redirectTo: 'auth?role=Customer', pathMatch: 'full' },
  { path: 'login/owner', redirectTo: 'auth?role=Owner', pathMatch: 'full' },
  { path: 'login/delivery', redirectTo: 'auth?role=DeliveryAgent', pathMatch: 'full' },
  { path: 'signup', redirectTo: 'auth?mode=signup', pathMatch: 'full' },
  { path: 'signup/delivery', redirectTo: 'auth?role=DeliveryAgent&mode=signup', pathMatch: 'full' },

  // ── CUSTOMER ROUTES ────────────────────────────────────────────────────────
  { path: 'customer/customer-home', component: CustomerHomeComponent, canActivate: [AuthGuard], data: { roles: ['Customer'] } },
  { path: 'customer/cart', component: CustomerCartComponent, canActivate: [AuthGuard], data: { roles: ['Customer'] } },
  { path: 'customer/orders', component: CustomerOrdersComponent, canActivate: [AuthGuard], data: { roles: ['Customer'] } },
  { path: 'customer/profile', component: CustomerProfileComponent, canActivate: [AuthGuard], data: { roles: ['Customer'] } },
  { path: 'customer/success', component: SuccessComponent, canActivate: [AuthGuard], data: { roles: ['Customer'] } },
  { path: 'customer/discounts', component: DiscountsComponent, canActivate: [AuthGuard], data: { roles: ['Customer'] } },
  { path: 'invoice/:orderId', component: InvoiceComponent, canActivate: [AuthGuard], data: { roles: ['Customer'] } },
  { path: 'menu/:id', component: CustomerMenuComponent, canActivate: [AuthGuard], data: { roles: ['Customer'] } },

  // ── OWNER ROUTES ───────────────────────────────────────────────────────────
  { path: 'restaurant', component: HomePageComponent, canActivate: [AuthGuard], data: { roles: ['Owner'] } },
  { path: 'owner/menu', component: MenuComponent, canActivate: [AuthGuard], data: { roles: ['Owner'] } },
  { path: 'owner/orders', component: OrdersComponent, canActivate: [AuthGuard], data: { roles: ['Owner'] } },
  { path: 'owner/profile', component: ProfileComponent, canActivate: [AuthGuard], data: { roles: ['Owner'] } },
  { path: 'owner/dashboard', component: OwnerDashboardComponent, canActivate: [AuthGuard], data: { roles: ['Owner'] } },


  // ── AGENT ROUTES ───────────────────────────────────────────────────────────
  { path: 'agent/dashboard', component: AgentDashboardComponent, canActivate: [AuthGuard], data: { roles: ['DeliveryAgent'] } },
  { path: 'agent/profile', component: AgentProfileComponent, canActivate: [AuthGuard], data: { roles: ['DeliveryAgent'] } },
  { path: 'agent', redirectTo: 'agent/dashboard' },

  // Wildcard
  { path: '**', redirectTo: '' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }