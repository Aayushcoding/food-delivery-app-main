import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

const routes: Routes = [
  { path: '', loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule) },
  { path: 'auth', loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule) },
  { path: 'login', redirectTo: '', pathMatch: 'full' },
  {
    path: 'user',
    loadChildren: () => import('./modules/user/user.module').then(m => m.UserModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Customer'] }
  },
  {
    path: 'owner',
    loadChildren: () => import('./modules/owner/owner.module').then(m => m.OwnerModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Owner'] }
  },
  {
    path: 'delivery',
    loadChildren: () => import('./modules/delivery/delivery.module').then(m => m.DeliveryModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['DeliveryAgent'] }
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
