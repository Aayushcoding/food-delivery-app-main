import { Component } from '@angular/core';

interface Review {
  id: number;
  name: string;
  avatar: string;
  restaurant: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.css']
})
export class ReviewsComponent {

  reviews: Review[] = [
    { id:1,  name:'Arjun Sharma',  avatar:'AS', restaurant:'Spice Garden',       rating:5, comment:'Absolutely amazing biryani! Delivered hot and on time. ByteBites never disappoints.', date:'2 days ago',  verified:true },
    { id:2,  name:'Priya Mehta',   avatar:'PM', restaurant:'The Pizza Hub',      rating:4, comment:'Great pizza, crispy crust. Delivery was slightly delayed but totally worth the wait!', date:'4 days ago',  verified:true },
    { id:3,  name:'Rahul Dev',     avatar:'RD', restaurant:'Burger Barn',        rating:5, comment:'Best burgers in town! The app is super smooth, tracking is accurate. Love it!',       date:'1 week ago',  verified:false },
    { id:4,  name:'Sneha R.',      avatar:'SR', restaurant:'Sushi World',        rating:4, comment:'Fresh sushi, great packaging. Will definitely order again this weekend!',               date:'1 week ago',  verified:true },
    { id:5,  name:'Karan Patel',   avatar:'KP', restaurant:'South Indian Delight',rating:5,comment:'The dosas were crispy and the sambar was divine. Nostalgic home-food vibes!',           date:'2 weeks ago', verified:true },
    { id:6,  name:'Anjali Singh',  avatar:'AJ', restaurant:'Haldiram\'s',        rating:3, comment:'Good food but packaging could be better. Dal makhani was a bit cold on arrival.',       date:'2 weeks ago', verified:false },
    { id:7,  name:'Vikram Rao',    avatar:'VR', restaurant:'Chinese Wok',        rating:5, comment:'Hakka noodles were on a different level! Fast delivery, hot food. 10/10!',              date:'3 weeks ago', verified:true },
    { id:8,  name:'Neha Joshi',    avatar:'NJ', restaurant:'Cake & More',        rating:5, comment:'Ordered a birthday cake — arrived perfectly boxed, fresh, exactly as pictured. Loved!', date:'3 weeks ago', verified:true },
  ];

  stars(n: number): number[] {
    return Array(n).fill(0);
  }

  emptyStars(n: number): number[] {
    return Array(5 - n).fill(0);
  }
}
