import { useParams } from "react-router-dom";
import { useAccount, useReadContract } from "wagmi";
import { contractAddress, contractAbi } from "@/contracts/contractConfig";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Info, FileText, MapPin, User, CheckCircle, XCircle, Clock, History, ExternalLink, Image as ImageIcon, Award } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { MRVSubmission } from "@/components/MRVSubmission";

// --- TypeScript Interfaces ---
// This type is already correct from your file.
type ProjectData = readonly [
    id: bigint,
    name: string,
    location: string,
    metadataHash: string,
    owner: `0x${string}`,
    status: number,
    lastSubmittedAt: bigint,
    carbonSequestered: bigint,
    creditsMinted: bigint,
    rejectionReason: string,
    registrationTimestamp: bigint,
    decisionTimestamp: bigint
];
interface MRVData { id: bigint; projectId: bigint; dataHash: string; timestamp: bigint; submitter: `0x${string}`; }
interface ProjectMetadata { description: string; image: string; }

// --- Helper Data ---
const statusEnum = ["PENDING", "AWAITING_VERIFICATION", "VERIFIED", "REJECTED"] as const;
const statusInfo = {
  PENDING: { label: "Pending Initial Data", icon: Clock, color: "bg-accent text-accent-foreground" },
  AWAITING_VERIFICATION: { label: "Awaiting Review", icon: Clock, color: "bg-warning text-warning-foreground" },
  VERIFIED: { label: "Verified", icon: CheckCircle, color: "bg-success text-success-foreground" },
  REJECTED: { label: "Rejected", icon: XCircle, color: "bg-destructive text-destructive-foreground" },
};


// ✅ --- NEW COMPONENT to display the final outcome ---
function VerificationOutcomeCard({ project }: { project: ProjectData }) {
  const status = project[5];
  const creditsMinted = project[8];
  const rejectionReason = project[9];
  const statusKey = status < statusEnum.length ? statusEnum[status] : "PENDING";

  // Don't render anything if the project hasn't been reviewed yet
  if (statusKey !== "VERIFIED" && statusKey !== "REJECTED") {
      return null;
  }

  return (
      <Card className="shadow-card">
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><Info /> Verification Outcome</CardTitle>
              <CardDescription>The final result from the admin review process.</CardDescription>
          </CardHeader>
          <CardContent>
              {statusKey === "VERIFIED" && (
                  <Alert className="border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-700">
                      <Award className="h-4 w-4" />
                      <AlertTitle>Project Approved!</AlertTitle>
                      <AlertDescription className="mt-2 flex items-center justify-between text-base">
                          <span>Total Carbon Credits Minted:</span>
                          <span className="font-bold text-lg">{creditsMinted.toString()} BLC</span>
                      </AlertDescription>
                  </Alert>
              )}
              {statusKey === "REJECTED" && (
                  <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>Project Rejected</AlertTitle>
                      <AlertDescription className="mt-2">
                          <p className="font-semibold mb-1">Admin's Reason:</p>
                          <p className="text-sm">{rejectionReason || "No reason provided."}</p>
                      </AlertDescription>
                  </Alert>
              )}
          </CardContent>
      </Card>
  );
}


export default function ProjectDetails() {
  const { projectId } = useParams();
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const [metadata, setMetadata] = useState<ProjectMetadata | null>(null);
  const [isMetadataLoading, setIsMetadataLoading] = useState(true);

  const { data: projectData, isLoading: isLoadingProject, isError, refetch: refetchProject } = useReadContract({
    address: contractAddress, 
    abi: contractAbi, 
    functionName: 'projects', 
    args: [BigInt(projectId || 0)],
  });
  
  const { data: mrvHistoryData, refetch: refetchMrvHistory } = useReadContract({
    address: contractAddress, 
    abi: contractAbi, 
    functionName: 'getMRVDataForProject', 
    args: [BigInt(projectId || 0)],
  });

  const project = projectData as ProjectData | undefined;
  const mrvHistory = mrvHistoryData as MRVData[] || [];
  
  useEffect(() => {
    const fetchMetadata = async () => {
      if (project && project[3]) {
        setIsMetadataLoading(true);
        try {
          const url = `https://gateway.pinata.cloud/ipfs/${project[3]}`;
          const response = await axios.get(url);
          response.data.image = `https://gateway.pinata.cloud/ipfs/${response.data.image}`;
          setMetadata(response.data);
        } catch (err) {
          console.error("Failed to fetch metadata from IPFS:", err);
          setMetadata(null);
        } finally {
          setIsMetadataLoading(false);
        }
      }
    };
    fetchMetadata();
  }, [project]);

  if (isLoadingProject || isConnecting) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (isError || !project || project[0] === 0n) {
    return <div className="p-8 text-center text-destructive">Error: Could not fetch project details.</div>;
  }
  
  // ✅ Updated to destructure all fields from the project data tuple
  const [id, name, location, metadataHash, owner, status] = project;
  const isOwner = isConnected && !!connectedAddress && !!owner && connectedAddress.toLowerCase() === owner.toLowerCase();
  const statusKey = status < statusEnum.length ? statusEnum[status] : "PENDING";
  const StatusIcon = statusInfo[statusKey].icon;

  const handleMRVSuccess = () => {
    refetchProject();
    refetchMrvHistory();
  };

  return (
    <div className="min-h-screen bg-gradient-surface p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-semibold">{name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2"><MapPin className="h-4 w-4" /> {location}</CardDescription>
                </div>
                <Badge className={cn("text-sm", statusInfo[statusKey].color)}><StatusIcon className="h-4 w-4 mr-2" /> {statusInfo[statusKey].label}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold flex items-center gap-2 mb-2"><User className="h-4 w-4" /> NGO Owner</h3>
              <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded-md">{owner}</p>
            </CardContent>
          </Card>

          {/* ✅ The new outcome card will render here when appropriate */}
          <VerificationOutcomeCard project={project} />
          
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Info /> Project Overview & Baseline</CardTitle>
              <CardDescription>Initial project details and baseline imagery stored on IPFS.</CardDescription>
            </CardHeader>
            <CardContent>
              {isMetadataLoading ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : metadata ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div> <h3 className="font-semibold flex items-center gap-2 mb-2"><FileText className="h-4 w-4" /> Description</h3> <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md border">{metadata.description}</p> </div>
                    <div> <h3 className="font-semibold flex items-center gap-2 mb-2"><FileText className="h-4 w-4" /> Metadata Hash</h3> <a href={`https://gateway.pinata.cloud/ipfs/${metadataHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline font-mono break-all hover:text-primary/80"> {metadataHash} </a> </div>
                  </div>
                  <div> <h3 className="font-semibold flex items-center gap-2 mb-2"><ImageIcon className="h-4 w-4" /> Baseline Image</h3> <img src={metadata.image} alt="Project Baseline" className="rounded-lg border object-cover w-full h-auto aspect-video" /> </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Could not load project metadata from IPFS.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><History /> MRV Submission History</CardTitle>
              <CardDescription>A complete, on-chain log of all data submitted for this project.</CardDescription>
            </CardHeader>
            <CardContent>
              {mrvHistory.length === 0 ? (
                <div className="text-center text-muted-foreground p-4">
                  <Info className="mx-auto h-6 w-6 mb-2" />
                  No MRV data has been submitted for this project yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {mrvHistory.map((mrv, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg border">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold">Submission #{mrv.id.toString()}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(Number(mrv.timestamp) * 1000).toLocaleString()}
                        </span>
                      </div>
                      <a href={`https://gateway.pinata.cloud/ipfs/${mrv.dataHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary underline font-mono break-all hover:text-primary/80">
                         {mrv.dataHash} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <MRVSubmission projectId={projectId} isOwner={isOwner} onSuccess={handleMRVSuccess} />
        </div>
      </div>
    </div>
  );
}