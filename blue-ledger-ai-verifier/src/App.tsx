// src/App.tsx

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useLenis } from '@/hooks/useLenis';

// --- Page Imports ---
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { PublicRegistry } from '@/pages/PublicRegistry';
import ProjectDetails from "./pages/ProjectDetails";
import PublicProjectDetail from "./pages/PublicProjectDetail"; // ✅ ADDED: Import the new page
import NotFound from "./pages/NotFound";
import VerificationPage from "./pages/VerificationPage";
import TradingPlatform from "./pages/TradingPlatform"; // ✅ ADD THIS IMPORT
import ProjectsPage from "./pages/ProjectsPage"; // ✅ ADD THIS IMPORT
import ReportsPage from "./pages/ReportsPage"; 



function App() {
  useLenis(); // ✅ CORRECTED: Call hooks at the top level of the component body

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <div className="h-6 w-px bg-border mx-2" />
                <h1 className="text-lg font-semibold">Blue Ledger</h1>
                
                <div className="ml-auto">
                  <ConnectButton />
                </div>
              </header>
              
              <main>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/verify/:projectId" element={<VerificationPage />} /> 
                  
                  {/* --- Public Routes --- */}
                  <Route path="/public" element={<PublicRegistry />} />
                  
                  <Route path="/trading" element={<TradingPlatform />} /> {/* ✅ ADD THIS ROUTE */}
                  <Route path="/registry/project/:projectId" element={<PublicProjectDetail />} /> {/* ✅ ADDED: Route for the public detail page */}

                  {/* --- Internal/NGO Route --- */}
                  <Route path="/project/:projectId" element={<ProjectDetails />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;