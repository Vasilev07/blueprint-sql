import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AppLayoutComponent } from "./layout/app.layout.component";
import { AuthGuard } from "./services/auth.guard";

const routes: Routes = [
    {
        path: "",
        component: AppLayoutComponent,
        children: [
            {
                path: "",
                loadChildren: () =>
                    import("./dashboard/dashboard.module").then(
                        (m) => m.DashboardModule,
                    ),
            },
            {
                path: "products",
                loadChildren: () =>
                    import("./products/products.module").then(
                        (m) => m.ProductsModule,
                    ),
            },
            {
                path: "categories",
                loadChildren: () =>
                    import("./categories/categories.module").then(
                        (m) => m.CategoriesModule,
                    ),
            },
            {
                path: "orders",
                loadChildren: () =>
                    import("./orders/orders.module").then(
                        (m) => m.OrdersModule,
                    ),
            },
            {
                path: "cart",
                loadChildren: () =>
                    import("./cart/cart.module").then((m) => m.CartModule),
            },
            {
                path: "chat",
                loadChildren: () =>
                    import("./chat/chat.module").then((m) => m.ChatModule),
            },
            {
                path: "messages",
                loadChildren: () =>
                    import("./messages/messages.module").then(
                        (m) => m.MessagesModule,
                    ),
            },
            {
                path: "friends",
                loadChildren: () =>
                    import("./friends/friends.module").then(
                        (m) => m.FriendsModule,
                    ),
            },
            {
                path: "live-tv",
                loadChildren: () =>
                    import("./stories/story.module").then(
                        (m) => m.StoryModule,
                    ),
            },
            {
                path: "subscriptions",
                loadChildren: () =>
                    import("./subscriptions/subscriptions.module").then(
                        (m) => m.SubscriptionsModule,
                    ),
            },
            {
                path: "profile",
                loadChildren: () =>
                    import("./profile/profile.module").then(
                        (m) => m.ProfileModule,
                    ),
            },
        ],
        canActivate: [AuthGuard],
    },
    {
        path: "login",
        loadChildren: () =>
            import("./login/login.module").then((m) => m.LoginModule),
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}
