import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MenuItem } from "primeng/api";
import { debounceTime, Subscription } from "rxjs";
import { LayoutService } from "src/app/layout/service/app.layout.service";
import { ChartModule } from "primeng/chart";
import { MenuModule } from "primeng/menu";
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { RippleModule } from "primeng/ripple";

@Component({
    selector: "app-dashboard",
    standalone: true,
    imports: [
        CommonModule,
        ChartModule,
        MenuModule,
        TableModule,
        ButtonModule,
        RippleModule,
    ],
    templateUrl: "./dashboard.component.html",
})
export class DashboardComponent implements OnInit, OnDestroy {
    items!: MenuItem[];

    products!: any[];

    chartData: any;

    chartOptions: any;

    subscription!: Subscription;

    constructor(public layoutService: LayoutService) {
        this.subscription = this.layoutService.configUpdate$
            .pipe(debounceTime(25))
            .subscribe(() => {
                this.initChart();
            });
    }

    ngOnInit() {
        this.initChart();
        this.items = [
            { label: "Add New", icon: "pi pi-fw pi-plus" },
            { label: "Remove", icon: "pi pi-fw pi-minus" },
        ];
    }

    initChart() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue("--text-color");
        const textColorSecondary = documentStyle.getPropertyValue(
            "--text-color-secondary",
        );
        const surfaceBorder =
            documentStyle.getPropertyValue("--surface-border");

        this.chartData = {
            labels: [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
            ],
            datasets: [
                {
                    label: "First Dataset",
                    data: [65, 59, 80, 81, 56, 55, 40],
                    fill: false,
                    backgroundColor:
                        documentStyle.getPropertyValue("--bluegray-700"),
                    borderColor:
                        documentStyle.getPropertyValue("--bluegray-700"),
                    tension: 0.4,
                },
                {
                    label: "Second Dataset",
                    data: [28, 48, 40, 19, 86, 27, 90],
                    fill: false,
                    backgroundColor:
                        documentStyle.getPropertyValue("--green-600"),
                    borderColor: documentStyle.getPropertyValue("--green-600"),
                    tension: 0.4,
                },
            ],
        };

        this.chartOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                    },
                },
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary,
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false,
                    },
                },
                y: {
                    ticks: {
                        color: textColorSecondary,
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false,
                    },
                },
            },
        };
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
