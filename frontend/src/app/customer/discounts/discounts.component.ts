import { Component } from '@angular/core';
import { Router } from '@angular/router';

export interface Offer {
  id: number;
  title: string;
  description: string;
  code: string;
  type: 'percent' | 'flat' | 'free' | 'bogo';
  value: number;   // percent or flat ₹
  cap: number;     // max ₹ savings (0 = no cap)
  minOrder: number; // minimum cart value to apply (0 = no min)
  emoji: string;
  color: string;
  selected?: boolean;
}

// Single source of truth — also used by the cart to compute discounts
export const ALL_OFFERS: Offer[] = [
  { id:1,  code:'FIRST70',  title:'70% OFF',        description:'Up to ₹50 off on your first order',        type:'percent', value:70,  cap:50,  minOrder:0,   emoji:'🔥', color:'#ff6a00' },
  { id:2,  code:'FLAT100',  title:'Flat ₹100 OFF',  description:'On orders above ₹299',                      type:'flat',    value:100, cap:100, minOrder:299, emoji:'💸', color:'#8a2be2' },
  { id:3,  code:'BOGO1',    title:'Buy 1 Get 1',    description:'On selected restaurants today',              type:'bogo',    value:50,  cap:200, minOrder:0,   emoji:'🎁', color:'#00c878' },
  { id:4,  code:'WKND40',   title:'40% OFF',        description:'Weekend special — all cuisines',             type:'percent', value:40,  cap:80,  minOrder:0,   emoji:'🎉', color:'#f7b731' },
  { id:5,  code:'FREEDEL',  title:'Free Delivery',  description:'On any order, no minimum',                   type:'free',    value:0,   cap:0,   minOrder:0,   emoji:'🛵', color:'#0fbcf9' },
  { id:6,  code:'SAVE60',   title:'Flat ₹60 OFF',   description:'On orders ₹199+',                           type:'flat',    value:60,  cap:60,  minOrder:199, emoji:'🏷', color:'#fd9644' },
  { id:7,  code:'RICE50',   title:'50% OFF',        description:'On biryani & rice specials up to ₹75',      type:'percent', value:50,  cap:75,  minOrder:0,   emoji:'🍛', color:'#e84393' },
  { id:8,  code:'UPI150',   title:'₹150 Cashback',  description:'Paid via UPI — credited in 24 hrs',         type:'flat',    value:150, cap:150, minOrder:0,   emoji:'💳', color:'#26de81' },
  { id:9,  code:'PREM20',   title:'20% OFF',        description:'At premium restaurants, up to ₹100',        type:'percent', value:20,  cap:100, minOrder:0,   emoji:'⭐', color:'#778ca3' },
  { id:10, code:'LATE50',   title:'Flat ₹50 OFF',   description:'Late night cravings — 10 PM to 2 AM',       type:'flat',    value:50,  cap:50,  minOrder:0,   emoji:'🌙', color:'#4b7bec' },
  { id:11, code:'HEALTH30', title:'30% OFF',        description:'Healthy food category today only',           type:'percent', value:30,  cap:60,  minOrder:0,   emoji:'🥗', color:'#20bf6b' },
  { id:12, code:'BIG200',   title:'Flat ₹200 OFF',  description:'Orders above ₹599 on weekends',             type:'flat',    value:200, cap:200, minOrder:599, emoji:'🚀', color:'#eb3b5a' },
];


export interface CouponContext {
  isFirstOrder: boolean;  // true = user has no delivered orders yet
}

/** Get current context (time & day) from the client clock */
export function getCouponContext(): { hourNow: number; dayNow: number } {
  const now  = new Date();
  const hour = now.getHours();  // 0-23
  const day  = now.getDay();    // 0=Sun, 1=Mon … 6=Sat
  return { hourNow: hour, dayNow: day };
}

/** Returns a human-readable condition hint shown on the offer card */
export function offerConditionHint(code: string): string {
  switch (code) {
    case 'FIRST70':  return '🆕 First order only';
    case 'WKND40':  return '📅 Weekends only (Sat/Sun)';
    case 'LATE50':  return '🌙 10 PM – 2 AM only';
    case 'BIG200':  return '📅 Weekends + cart ≥ ₹599';
    case 'FLAT100': return '🛒 Min cart ₹299';
    case 'SAVE60':  return '🛒 Min cart ₹199';
    default: return '';
  }
}

/**
 * Pure function — compute discount given a code, subtotal and context.
 * Pass isFirstOrder=false by default; cart.ts must fetch and pass the real value.
 */
export function computeDiscount(
  code: string,
  subtotal: number,
  ctx: CouponContext = { isFirstOrder: false }
): { discount: number; message: string; valid: boolean; reason?: string } {

  const offer = ALL_OFFERS.find(o => o.code === code.trim().toUpperCase());
  if (!offer) return { discount: 0, message: '', valid: false, reason: 'Invalid coupon code.' };

  // ── Minimum order check ─────────────────────────────────────────────
  if (offer.minOrder > 0 && subtotal < offer.minOrder) {
    return { discount: 0, message: '', valid: false,
      reason: `Minimum order ₹${offer.minOrder} required for ${offer.code}.` };
  }

  // ── Business rule checks ────────────────────────────────────────────
  const now = new Date();
  const hour = now.getHours();   // 0-23
  const day  = now.getDay();     // 0=Sun, 6=Sat
  const isWeekend = day === 0 || day === 6;
  const isLateNight = hour >= 22 || hour < 2;  // 10 PM to 2 AM

  if (offer.code === 'FIRST70') {
    if (!ctx.isFirstOrder) {
      return { discount: 0, message: '', valid: false,
        reason: '❌ FIRST70 is only valid on your first order. You already have previous orders.' };
    }
  }

  if (offer.code === 'WKND40') {
    if (!isWeekend) {
      return { discount: 0, message: '', valid: false,
        reason: '❌ WKND40 is only valid on Saturdays and Sundays.' };
    }
  }

  if (offer.code === 'LATE50') {
    if (!isLateNight) {
      return { discount: 0, message: '', valid: false,
        reason: '❌ LATE50 is only valid between 10 PM and 2 AM.' };
    }
  }

  if (offer.code === 'BIG200') {
    if (!isWeekend) {
      return { discount: 0, message: '', valid: false,
        reason: '❌ BIG200 is only valid on weekends (Sat/Sun).' };
    }
    // minOrder check already handles ₹599 minimum
  }

  // ── Calculate discount ──────────────────────────────────────────────
  let discount = 0;
  let message  = '';

  if (offer.type === 'flat') {
    discount = Math.min(offer.value, subtotal);
    message  = `${offer.emoji} ${offer.code}: Flat ₹${discount} off!`;
  } else if (offer.type === 'percent') {
    discount = Math.round(subtotal * offer.value / 100);
    if (offer.cap > 0) discount = Math.min(discount, offer.cap);
    message  = `${offer.emoji} ${offer.code}: ${offer.value}% off → ₹${discount} saved!`;
  } else if (offer.type === 'bogo') {
    discount = Math.min(Math.round(subtotal * 0.5), offer.cap || 9999);
    message  = `${offer.emoji} ${offer.code}: 50% off (BOGO) → ₹${discount} saved!`;
  } else if (offer.type === 'free') {
    discount = 0;
    message  = `${offer.emoji} ${offer.code}: Free delivery applied!`;
  }

  return { discount, message, valid: true };
}

@Component({
  selector: 'app-discounts',
  templateUrl: './discounts.component.html',
  styleUrls: ['./discounts.component.css']
})
export class DiscountsComponent {

  discounts: Offer[] = ALL_OFFERS.map(o => ({ ...o }));
  toastVisible = false;
  toastCode    = '';

  constructor(private router: Router) {
    const saved = localStorage.getItem('couponCode') || '';
    if (saved) {
      const match = this.discounts.find(d => d.code === saved);
      if (match) match.selected = true;
    }
  }

  /** Returns condition hint (e.g. 'Weekends only') for a code */
  hintFor(code: string): string { return offerConditionHint(code); }

  copyCode(d: Offer, event: Event): void {
    event.stopPropagation();
    navigator.clipboard.writeText(d.code).catch(() => {});
    localStorage.setItem('couponCode', d.code);
    this.discounts.forEach(x => x.selected = false);
    d.selected     = true;
    this.toastCode = d.code;
    this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 3000);
  }
}
