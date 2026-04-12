import { Component } from '@angular/core';

@Component({
selector:'app-owner-dashboard',
templateUrl:'./owner-dashboard.component.html',
styleUrls:['./owner-dashboard.component.css']
})
export class OwnerDashboardComponent{

restaurantName='My Restaurant';

stats={
orders:50,
revenue:20000,
pending:5
};

}