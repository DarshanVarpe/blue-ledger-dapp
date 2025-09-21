// src/pages/ProjectsPage.tsx

import { useAccount, useReadContract } from "wagmi";
import { Link, useNavigate } from "react-router-dom"; // ✅ 1. Import useNavigate
import { contractAddress, contractAbi } from "@/contracts/contractConfig";
import { Badge } from "@/components/ui/badge";
import { Loader2, Info, ArrowRight, MapPin } from "lucide-react";
import { PinContainer } from '@/components/ui/3d-pin'; // ✅ 2. Import the 3D Pin component
import { RetroGrid } from "@/components/ui/RetroGrid";

interface Project {
  id: bigint;
  name: string;
  location: string;
  metadataHash: string;
  owner: `0x${string}`;
  status: number;
  lastSubmittedAt: bigint;
  carbonSequestered: bigint;
  creditsMinted: bigint;
  rejectionReason: string;
  registrationTimestamp: bigint;
  decisionTimestamp: bigint;
}

const statusInfo: { [key: number]: { label: string; className: string } } = {
  0: { label: "Pending", className: "bg-gray-500" },
  1: { label: "Awaiting Verification", className: "bg-yellow-500" },
  2: { label: "Verified", className: "bg-green-600" },
  3: { label: "Rejected", className: "bg-red-600" },
};

export default function ProjectsPage() {
  const { address: connectedAddress, isConnected } = useAccount();
  const navigate = useNavigate(); // ✅ 3. Initialize the navigate hook

  const { data: allProjects, isLoading } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getAllProjects',
    query: { enabled: isConnected },
  });

  const myProjects = (allProjects as Project[] || []).filter(
    (p: Project) => p.owner.toLowerCase() === connectedAddress?.toLowerCase()
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden p-4 md:p-8">
      <RetroGrid />
      <div className="relative z-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">My Projects</h1>
          <p className="text-muted-foreground">A list of all the projects you have registered on the Blue Ledger.</p>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && myProjects.length === 0 && (
          <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg bg-background/80 backdrop-blur-sm">
            <Info className="mx-auto h-8 w-8 mb-4" />
            <h2 className="text-xl font-semibold">No Projects Found</h2>
            <p>You have not registered any projects yet. Start by registering a new project from your dashboard.</p>
          </div>
        )}
        
        {/* ✅ 4. Replaced the card grid with the new 3D Pin grid */}
        {!isLoading && myProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {myProjects.map((project) => (
              <div
                key={project.id.toString()}
                className="h-[25rem] w-full flex items-center justify-center cursor-pointer"
                onClick={() => navigate(`/project/${project.id.toString()}`)}
              >
                <PinContainer
                  title={statusInfo[project.status]?.label || "Unknown Status"}
                  // href prop is removed to use React Router's navigation
                >
                  <div className="flex basis-full flex-col p-4 tracking-tight text-slate-100/50 sm:basis-1/2 w-[20rem] h-[20rem]">
                    <h3 className="max-w-xs !pb-2 !m-0 font-bold text-base text-slate-100">
                      {project.name}
                    </h3>
                    <div className="text-base !m-0 !p-0 font-normal">
                      <span className="text-slate-500 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" /> {project.location}
                      </span>
                    </div>
                    {/* A simple placeholder visual instead of an image */}
                    <div className="flex flex-1 w-full rounded-lg mt-4 bg-gradient-to-br from-primary via-teal-primary to-ocean-light items-center justify-center">
                        <p className="text-5xl font-bold text-white/50">{project.creditsMinted.toString()}</p>
                        <p className="text-lg text-white/50 ml-2">BLC</p>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-slate-400">ID: {project.id.toString()}</span>
                       <Badge className={statusInfo[project.status]?.className || "bg-gray-400"}>
                          {statusInfo[project.status]?.label || "Unknown Status"}
                        </Badge>
                    </div>
                  </div>
                </PinContainer>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

