// src/pages/ReportsPage.tsx

import { FileText, Wrench } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center p-8">
      <div className="p-6 bg-gradient-ocean rounded-full mb-6">
        <FileText className="h-12 w-12 text-primary-foreground" />
      </div>
      <h1 className="text-4xl font-bold text-foreground">Project Reports</h1>
      <p className="text-2xl text-muted-foreground mt-2">Coming Soon</p>
      <div className="mt-8 max-w-2xl mx-auto">
        <p className="text-muted-foreground">
          This section will allow you to generate and download comprehensive PDF reports for your
          projects. Reports will include details on carbon sequestration, MRV data history, and
          the number of carbon credits issued, providing a valuable resource for stakeholders and compliance.
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-12">
        <Wrench className="h-4 w-4" />
        <span>This feature is currently under development.</span>
      </div>
    </div>
  );
}