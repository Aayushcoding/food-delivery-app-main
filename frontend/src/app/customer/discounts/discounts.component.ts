import { Component } from '@angular/core';

interface Discount {
  id: number;
  title: string;
  description: string;
  code: string;
  type: 'percent' | 'flat' | 'bogo' | 'free';
  value: number;   // % or flat ₹ amount
  cap: number;     // max savings (0 = no cap)
  emoji: string;
  color: string;
  selected?: boolean;
}

@Component({
  selector: 'app-discounts',
  templateUrl: './discounts.component.html',
  styleUrls: ['./discounts.component.css']
})
export class DiscountsComponent {

  appliedDiscount: Discount | null = null;
  appliedMessage = '';
  toastVisible = false;

  discounts: Discount[] = [
    { id:1,  title:'70% OFF',           description:'Up to ₹50 off on your first order',         code:'FIRST70',   type:'percent', value:70,  cap:50,  emoji:'🔥', color:'#ff6a00' },
    { id:2,  title:'Flat ₹100 OFF',     description:'On orders above ₹299',                       code:'FLAT100',   type:'flat',    value:100, cap:100, emoji:'💸', color:'#8a2be2' },
    { id:3,  title:'Buy 1 Get 1',       description:'On selected restaurants today',               code:'BOGO1',     type:'bogo',    value:50,  cap:200, emoji:'🎁', color:'#00c878' },
    { id:4,  title:'40% OFF',           description:'Weekend special — all cuisines',              code:'WKND40',    type:'percent', value:40,  cap:80,  emoji:'🎉', color:'#f7b731' },
    { id:5,  title:'Free Delivery',     description:'On any order, no minimum!',                   code:'FREEDEL',   type:'free',    value:0,   cap:0,   emoji:'🛵', color:'#0fbcf9' },
    { id:6,  title:'Flat ₹60 OFF',      description:'On orders ₹199+',                            code:'SAVE60',    type:'flat',    value:60,  cap:60,  emoji:'🏷',  color:'#fd9644' },
    { id:7,  title:'50% OFF',           description:'On biryani & rice specials up to ₹75',       code:'RICE50',    type:'percent', value:50,  cap:75,  emoji:'🍛', color:'#e84393' },
    { id:8,  title:'₹150 Cashback',     description:'Paid via UPI — credited in 24 hrs',          code:'UPI150',    type:'flat',    value:150, cap:150, emoji:'💳', color:'#26de81' },
    { id:9,  title:'20% OFF',           description:'At premium restaurants, up to ₹100',         code:'PREM20',    type:'percent', value:20,  cap:100, emoji:'⭐', color:'#778ca3' },
    { id:10, title:'Flat ₹50 OFF',      description:'Late night cravings — 10 PM to 2 AM',        code:'LATE50',    type:'flat',    value:50,  cap:50,  emoji:'🌙', color:'#4b7bec' },
    { id:11, title:'30% OFF',           description:'Healthy food category today only',            code:'HEALTH30',  type:'percent', value:30,  cap:60,  emoji:'🥗', color:'#20bf6b' },
    { id:12, title:'Flat ₹200 OFF',     description:'Orders above ₹599 on weekends',              code:'BIG200',    type:'flat',    value:200, cap:200, emoji:'🚀', color:'#eb3b5a' },
  ];

  applyDiscount(d: Discount): void {
    this.discounts.forEach(x => x.selected = false);
    d.selected = true;
    this.appliedDiscount = d;

    // Random discount amount within range
    let savedAmount = 0;
    if (d.type === 'percent') {
      // Assume a random cart between ₹200-₹800 for display purposes
      const cart = Math.floor(Math.random() * 600) + 200;
      savedAmount = Math.min(Math.round(cart * d.value / 100), d.cap > 0 ? d.cap : 9999);
      this.appliedMessage = `🎉 ${d.code} applied! You save ₹${savedAmount} on your next order.`;
    } else if (d.type === 'flat') {
      savedAmount = d.value;
      this.appliedMessage = `🎉 ${d.code} applied! Flat ₹${savedAmount} off on your next order.`;
    } else if (d.type === 'bogo') {
      this.appliedMessage = `🎉 ${d.code} applied! Buy 1 Get 1 free — enjoy double the food!`;
    } else if (d.type === 'free') {
      this.appliedMessage = `🎉 ${d.code} applied! Free delivery on your next order — no minimums!`;
    }

    // Save to session
    sessionStorage.setItem('appliedDiscount', JSON.stringify({ code: d.code, message: this.appliedMessage }));

    this.toastVisible = true;
    setTimeout(() => { this.toastVisible = false; }, 4000);
  }

  removeDiscount(): void {
    this.appliedDiscount = null;
    this.appliedMessage = '';
    this.discounts.forEach(x => x.selected = false);
    sessionStorage.removeItem('appliedDiscount');
  }
}
