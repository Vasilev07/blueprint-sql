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
