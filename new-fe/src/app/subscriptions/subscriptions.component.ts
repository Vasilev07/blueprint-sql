import { Component } from "@angular/core";

@Component({
    selector: "app-subscriptions",
    templateUrl: "./subscriptions.component.html",
    styleUrls: ["./subscriptions.component.scss"],
})
export class SubscriptionsComponent {
    tiers = [
        { key: 'bronze', title: 'Bronze', price: '$4.99/mo', perks: ['Basic support', 'Standard quality'], cta: 'Choose Bronze' },
        { key: 'silver', title: 'Silver', price: '$9.99/mo', perks: ['Priority support', 'HD quality'], cta: 'Choose Silver' },
        { key: 'gold', title: 'Gold', price: '$19.99/mo', perks: ['24/7 support', 'Full HD', 'Early features'], cta: 'Choose Gold' },
        { key: 'vip', title: 'VIP', price: '$49.99/mo', perks: ['Dedicated support', '4K', 'Beta access', 'Exclusive perks'], cta: 'Become VIP' },
    ];
}


