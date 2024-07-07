import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AppLayoutComponent } from "./layout/app.layout.component";
import { AuthGuard } from "./services/auth.guard";
import { ProductsComponent } from "./products/products.component";

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
                component: ProductsComponent,
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
