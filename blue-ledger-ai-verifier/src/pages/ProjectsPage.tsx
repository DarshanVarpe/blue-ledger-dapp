// src/pages/ProjectsPage.tsx

import { useAccount, useReadContract } from "wagmi";
import { Link } from "react-router-dom";
import { contractAddress, contractAbi } from "@/contracts/contractConfig";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Info, ArrowRight, MapPin } from "lucide-react";

// ✅ FIX: Changed Project type to match the object structure returned by wagmi/viem
// It's an object with named properties, not a readonly tuple for filtering.
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
  
  const { data: allProjects, isLoading } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getAllProjects',
    query: { enabled: isConnected },
  });

  // Filter projects to show only those owned by the connected user
  // ✅ FIX: Type assertion `as Project[]` ensures TypeScript treats it correctly
  // And we access properties by name (p.owner) instead of tuple index (p[4])
  const myProjects = (allProjects as Project[] || []).filter(
    (p: Project) => p.owner.toLowerCase() === connectedAddress?.toLowerCase()
  );

  return (
    <div className="p-4 md:p-8">
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
        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
          <Info className="mx-auto h-8 w-8 mb-4" />
          <h2 className="text-xl font-semibold">No Projects Found</h2>
          <p>You have not registered any projects yet. Start by registering a new project from your dashboard.</p>
        </div>
      )}
      
      {!isLoading && myProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myProjects.map((project) => ( // Removed `as Project[]` here as `myProjects` is already typed correctly
            <Card key={project.id.toString()} className="flex flex-col">
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 pt-1">
                  <MapPin className="h-4 w-4" /> {project.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <Badge className={statusInfo[project.status]?.className || "bg-gray-400"}>
                  {statusInfo[project.status]?.label || "Unknown Status"}
                </Badge>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link to={`/project/${project.id.toString()}`}>
                    View Details <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}