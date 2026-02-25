import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { Root } from "./root";

import { AppShell } from "../components/layout/AppShell";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";

import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";

import { SecondSortingAuditPage } from "../features/audits/pages/SecondSortingAuditPage";
import DefectRateAnalysisPage from "../features/audits/pages/DefectRateAnalysisPage";

// ✅ Inventory Check
import InventoryCheckReportPage from "../features/audits/pages/InventoryCheckReportPage";

// ✅ Abnormal Sorting
import AbnormalSortingReportPage from "../features/audits/pages/AbnormalSortingReportPage";

// ✅ NEW: Operational Overview (Work Efficiency)
import { OperationalOverviewPage } from "../features/audits/pages/OperationalOverviewPage";

function Placeholder({ title }: { title: string }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="mt-2 text-slate-400">This module will be implemented soon.</p>
        </div>
    );
}

function ProtectedOutlet() {
    return (
        <ProtectedRoute>
            <Outlet />
        </ProtectedRoute>
    );
}

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Root />,
        children: [
            { index: true, element: <Navigate to="/app" replace /> },

            {
                path: "app",
                element: <AppShell />,
                children: [
                    { index: true, element: <HomePage /> },

                    {
                        element: <ProtectedOutlet />,
                        children: [
                            { path: "audits/second-sorting", element: <SecondSortingAuditPage /> },
                            { path: "audits/defect-rate", element: <DefectRateAnalysisPage /> },

                            { path: "audits/picking-exception", element: <Placeholder title="Picking Exception Audit" /> },
                            { path: "audits/auto-pack", element: <Placeholder title="Auto Pack Audit" /> },

                            { path: "shipping/warehouse-overdue", element: <Placeholder title="Warehouse Overdue" /> },
                            { path: "shipping/critical-overdue", element: <Placeholder title="Critical Overdue" /> },

                            // ✅ Real pages
                            { path: "shift/inventory-check", element: <InventoryCheckReportPage /> },
                            { path: "shift/abnormal-sorting", element: <AbnormalSortingReportPage /> },

                            // ✅ Work Efficiency
                            { path: "efficiency/overview", element: <OperationalOverviewPage /> },
                            { path: "efficiency/libiao", element: <Placeholder title="Libiao" /> },
                            { path: "efficiency/sorting", element: <Placeholder title="Sorting" /> },

                            { path: "faq", element: <Placeholder title="FAQ" /> },
                        ],
                    },

                    { path: "404", element: <NotFoundPage /> },
                    { path: "*", element: <Navigate to="/app/404" replace /> },
                ],
            },

            { path: "*", element: <Navigate to="/app" replace /> },
        ],
    },
]);