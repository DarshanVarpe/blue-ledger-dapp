// src/pages/ProjectsPage.tsx

import { useAccount, useReadContract } from "wagmi";
import { Link } from "react-router-dom";
import { contractAddress, contractAbi } from "@/contracts/contractConfig";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Info, ArrowRight, MapPin } from "lucide-react";

// Import the 3D Card components
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card'; // Make sure this path is correct

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
          {myProjects.map((project) => (
            <Link key={project.id.toString()} to={`/project/${project.id.toString()}`} className="block group h-full w-full">
              {/* Wrap each project card with CardContainer and CardBody */}
              <CardContainer containerClassName="h-full w-full !py-0" className="h-full w-full inter-var">
                <CardBody className="h-full w-full relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] rounded-xl p-0 border">
                  {/* The Shadcn Card itself becomes a CardItem */}
                  <CardItem translateZ={0} className="h-full w-full">
                    <Card className="shadow-lg hover:shadow-primary/20 transition-all duration-300 h-full flex flex-col border-transparent hover:border-primary p-0">
                      <CardHeader className="p-4 md:p-6 pb-2"> {/* Added back padding, adjusted bottom padding */}
                        <CardItem translateZ={40}> {/* Apply translateZ to the title */}
                          <CardTitle className="text-xl group-hover:text-primary transition-colors">{project.name}</CardTitle>
                        </CardItem>
                        <CardItem translateZ={30}> {/* Apply translateZ to the description */}
                          <CardDescription className="flex items-center gap-2 pt-1">
                            <MapPin className="h-4 w-4" /> {project.location}
                          </CardDescription>
                        </CardItem>
                      </CardHeader>

                      <CardContent className="flex-grow p-4 md:p-6 pt-0"> {/* Added padding back, removed top padding */}
                        <CardItem translateZ={30}> {/* Apply translateZ to the badge */}
                          <Badge className={statusInfo[project.status]?.className || "bg-gray-400"}>
                            {statusInfo[project.status]?.label || "Unknown Status"}
                          </Badge>
                        </CardItem>
                      </CardContent>

                      <CardFooter className="p-4 md:p-6 pt-0"> {/* Added padding back, removed top padding */}
                        <CardItem translateZ={30} className="w-full"> {/* Apply translateZ to the button */}
                          <Button asChild className="w-full">
                            <Link to={`/project/${project.id.toString()}`}>
                              View Details <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </CardItem>
                      </CardFooter>
                    </Card>
                  </CardItem>
                </CardBody>
              </CardContainer>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}