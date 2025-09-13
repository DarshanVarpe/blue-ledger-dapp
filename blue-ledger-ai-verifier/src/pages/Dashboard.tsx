import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/StatsCard";
import { ProjectsTable } from "@/components/ProjectsTable";
import { ProjectRegistrationModal } from "@/components/ProjectRegistrationModal";
import { Plus, TreePine, Award, Clock, BarChart3 } from "lucide-react";
import heroOcean from "@/assets/hero-ocean.jpg";
import { useReadContract, useReadContracts } from "wagmi";
import { contractAddress, contractAbi } from "@/contracts/contractConfig";

// Define the TypeScript type to match your UPDATED Project struct in Solidity
type Project = {
  id: bigint;
  name: string;
  location: string;
  metadataHash: string;
  owner: `0x${string}`;
  status: number;
  lastSubmittedAt: bigint;
  carbonSequestered: bigint;
};

// Define the contract object for Wagmi
const blueLedgerContract = {
  address: contractAddress as `0x${string}`,
  // --- THIS IS THE FIX ---
  // The `as const` assertion is now correctly added.
  abi: contractAbi ,
};

export default function Dashboard() {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  // Fetch all projects data
  const { data: allProjects, isLoading: isLoadingProjects, refetch } = useReadContract({
    ...blueLedgerContract,
    functionName: "getAllProjects",
    query: { refetchInterval: 10000 },
  });

  // Calculate all stats in one place for efficiency
  const stats = useMemo(() => {
    const projects = (allProjects as Project[]) ?? [];

    const totalProjects = projects.length;
    const pendingVerification = projects.filter(p => p.status === 1).length;

    const carbonSequestered = projects.reduce((acc, p) => {
      return acc + (p.carbonSequestered || 0n);
    }, 0n); 

    return {
      totalProjects,
      pendingVerification,
      carbonSequestered, 
    };
  }, [allProjects]);
  
  // Logic for calculating "Credits Minted"
  const verifiedProjects = useMemo(() =>
    ((allProjects as Project[]) ?? []).filter(p => p.status === 2),
  [allProjects]);

  const { data: creditsData } = useReadContracts({
    contracts: verifiedProjects.map(p => ({
      ...blueLedgerContract,
      functionName: 'balanceOf',
      args: [p.owner, p.id],
    })),
    query: { enabled: verifiedProjects.length > 0 }
  });

  const totalCreditsMinted = useMemo(() => {
    if (!creditsData) return 0n;
    return creditsData
      .filter(d => d.status === 'success')
      .reduce((acc, current) => {
        const value = current.result;
        return acc + (typeof value === "bigint" ? value : 0n);
      }, 0n);
  }, [creditsData]);

  const isLoading = isLoadingProjects;

  const handleSuccess = () => {
    refetch(); 
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div 
        className="relative h-64 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroOcean})` }}
      >
        <div className="absolute inset-0 bg-gradient-depth/70" />
        <div className="relative h-full flex items-center justify-between px-8">
          <div>
            <h1 className="text-4xl font-bold text-primary-foreground mb-2">
              Welcome back!
            </h1>
            <p className="text-lg text-primary-foreground/90">
              Track your blue carbon restoration projects and verified credits
            </p>
          </div>
          <Button
            onClick={() => setIsRegistrationOpen(true)}
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-ocean"
          >
            <Plus className="w-5 h-5 mr-2" />
            Register New Project
          </Button>
        </div>
      </div>

      <div className="p-8 -mt-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Projects"
            value={isLoading ? "..." : stats.totalProjects.toString()}
            subtitle="Registered restoration sites"
            icon={TreePine}
          />
          <StatsCard
            title="Carbon Sequestered"
            value={isLoading ? "..." : stats.carbonSequestered.toString()}
            subtitle="Verified tonnes CO₂"
            icon={BarChart3}
          />
          <StatsCard
            title="Credits Minted"
            value={isLoading ? "..." : totalCreditsMinted.toString()}
            subtitle="Verified carbon credits"
            icon={Award}
          />
          <StatsCard
            title="Pending Verification"
            value={isLoading ? "..." : stats.pendingVerification.toString()}
            subtitle="Projects awaiting review"
            icon={Clock}
          />
        </div>

        <ProjectsTable />
      </div>

      <ProjectRegistrationModal
        open={isRegistrationOpen}
        onOpenChange={setIsRegistrationOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}