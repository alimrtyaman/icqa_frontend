import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const titles: Record<string, string> = {
    "/": "ICQA Abnormal Analysis",
    "/audits/second-sorting": "Second Sorting Audit • ICQA",
    "/audits/picking-exception": "Picking Exception Audit • ICQA",
    "/audits/auto-pack": "Auto Pack Audit • ICQA",
    "/audits/defect-rate": "Defect Rate Analysis • ICQA",
    "/shipping/warehouse-overdue": "Warehouse Overdue • ICQA",
    "/shipping/critical-overdue": "Critical Overdue • ICQA",
    "/shift/inventory-check": "Inventory Check Report • ICQA",
    "/shift/abnormal-sorting": "Abnormal Sorting Report • ICQA",
};

export function TitleManager() {
    const { pathname } = useLocation();

    useEffect(() => {
        document.title = titles[pathname] ?? "ICQA Abnormal Analysis";
    }, [pathname]);

    return null;
}