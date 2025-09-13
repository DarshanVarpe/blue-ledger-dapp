import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom"; // ✅ 1. Import useNavigate
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";

// --- UI & Utils ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Check, X, Image as ImageIcon, FileText, MapPin, TreePine, BarChart3, ArrowLeft, History, Info, ExternalLink, Rocket, FileUp, Award, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";


// --- Hooks and Config ---
import { contractAddress, contractAbi } from "@/contracts/contractConfig";
import { useProjectMetadata } from "@/hooks/useProjectMetadata";
import { ProjectMap } from "@/components/ProjectMap";

// --- Type Definitions ---
type Project = readonly [ id: bigint, name: string, location: string, metadataHash: string, owner: `0x${string}`, status: number, lastSubmittedAt: bigint, carbonSequestered: bigint, creditsMinted: bigint, rejectionReason: string, registrationTimestamp: bigint, decisionTimestamp: bigint ];
type MRVData = {
  readonly id: bigint;
  readonly projectId: bigint;
  readonly dataHash: string;
  readonly timestamp: bigint;
  readonly submitter: `0x${string}`;
};
interface ProjectMetadata { description: string; image: string; coordinates?: { lat: number; lng: number } }
type TimelineEvent = { title: string; description: string; timestamp: bigint; icon: React.ElementType; hash?: string; };

const mockAIAnalysis = {
  saplingCount: { detected: 4852, estimated: 5000, confidence: 97.2 },
  canopyHealth: { percentage: 84, status: "Good" },
  anomalies: [
    { location: "Sector A-3", type: "Potential dead vegetation", severity: "Medium" },
    { location: "Sector B-7", type: "Minor erosion detected", severity: "Low" }
  ],
  carbonCapture: 1850
}

export default function VerificationPage() {
  const { projectId } = useParams();
  const navigate = useNavigate(); // ✅ 2. Initialize the hook
  const [rejectionReason, setRejectionReason] = useState("");
  const [creditsToMint, setCreditsToMint] = useState("");

  const { data: project, isLoading: isLoadingProject, refetch } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'projects',
    args: [BigInt(projectId || 0)],
  });

  const { data: mrvHistory, isLoading: isLoadingMrv } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getMRVDataForProject',
    args: [BigInt(projectId || 0)],
  });

  const { metadata, isLoading: isMetadataLoading } = useProjectMetadata(project ? project[3] : null);
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const timelineEvents = useMemo((): TimelineEvent[] => {
    if (!project) return [];
    const events: TimelineEvent[] = [];
    const safeMrvHistory = (mrvHistory as MRVData[] | undefined) || [];
    const [, name, , metadataHash, , status, , , creditsMinted, , regTimestamp, decTimestamp] = project;

    if (regTimestamp > 0) events.push({ title: "Project Registered", description: `The journey for "${name}" began.`, timestamp: regTimestamp, icon: Rocket, hash: metadataHash });
    safeMrvHistory.forEach((mrv) => events.push({ title: `MRV Data #${mrv.id.toString()} Submitted`, description: "New field data was submitted for review.", timestamp: mrv.timestamp, icon: FileUp, hash: mrv.dataHash }));
    if (status === 2) {
        events.push({ title: "Verification Complete", description: "Project data successfully verified.", timestamp: decTimestamp, icon: CheckCircle });
        events.push({ title: `${creditsMinted.toString()} Credits Minted`, description: "Carbon credits were minted on-chain.", timestamp: decTimestamp, icon: Award });
    }
    return events.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
  }, [project, mrvHistory]);

  useEffect(() => {
    if (project && project[7] !== undefined) {
      setCreditsToMint(project[7].toString());
    }
  }, [project]);
  
  const handleApprove = () => {
    const amount = parseInt(creditsToMint, 10);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid number for credits to mint.");
      return;
    }
    writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: "verifyAndMintCredits",
      args: [project![0], BigInt(amount), BigInt(amount)],
    });
  };

  const handleReject = () => {
    if (!rejectionReason) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: "rejectProject",
      args: [project![0], rejectionReason],
    });
  };

  useEffect(() => {
    if (isConfirming) toast.loading("Processing decision on-chain...", { id: `verify-${hash}` });
    if (isConfirmed) {
      toast.success("Verification Decision Confirmed!", { id: `verify-${hash}` });
      refetch();
      reset();
      
      // ✅ 3. Navigate back to the admin dashboard after a short delay
      setTimeout(() => {
        navigate('/admin');
      }, 1500); // 1.5 second delay
    }
    if (error) toast.error("Transaction Failed", { id: `verify-${hash}`, description: error.message });
  }, [isConfirming, isConfirmed, error, hash, refetch, reset, navigate]);

  if (isLoadingProject || isLoadingMrv) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!project) {
    return <div className="p-8 text-center text-destructive">Error: Project not found.</div>;
  }
  
  const isProcessing = isPending || isConfirming;

  return (
    <div className="min-h-screen bg-gradient-surface p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Link to="/admin" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">Verify Project: {project[1]}</h1>
          <p className="text-muted-foreground">Review the submitted data, location, and AI analysis to make a decision.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="flex flex-col space-y-6">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5"/> Baseline Image</CardTitle></CardHeader><CardContent>{isMetadataLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto"/> : <img src={metadata?.image} alt={project[1]} className="rounded-md border w-full object-cover aspect-video"/>}</CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/> Project Details</CardTitle></CardHeader><CardContent>{isMetadataLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto"/> : <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md border">{metadata?.description}</p>}</CardContent></Card>
            <Card className="flex-grow flex flex-col"><CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5"/> Project Location</CardTitle></CardHeader><CardContent className="flex-grow p-0">{isMetadataLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto"/> : (metadata?.coordinates ? <ProjectMap coords={metadata.coordinates} projectName={project[1]} /> : <div className="flex items-center justify-center h-full w-full bg-muted rounded-b-lg"><p className="text-muted-foreground">Coordinates not provided.</p></div>)}</CardContent></Card>
          </div>

          {/* Right Column */}
          <div className="flex flex-col space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5"/> MRV Submission History</CardTitle></CardHeader>
              <CardContent>
                {!mrvHistory || mrvHistory.length === 0 ? (
                  <div className="text-center text-muted-foreground p-4">
                    <Info className="mx-auto h-6 w-6 mb-2" />
                    No subsequent MRV data has been submitted.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {(mrvHistory as MRVData[]).map((mrv) => (
                      <div key={mrv.id.toString()} className="p-3 bg-muted/50 rounded-lg border">
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

            <div className="space-y-2">
              <h3 className="text-lg font-semibold pl-1">AI Verification Assistant</h3>
              <Card><CardContent className="p-4"><div className="flex items-center gap-3 mb-3"><TreePine className="h-6 w-6 text-success" /><div className="flex-1"><h3 className="font-semibold">AI Sapling Count</h3><p className="text-sm text-muted-foreground">Automated tree detection</p></div></div><div className="text-center"><div className="text-3xl font-bold text-success mb-1">{mockAIAnalysis.saplingCount.detected.toLocaleString()}</div><div className="text-sm text-muted-foreground">/ {mockAIAnalysis.saplingCount.estimated.toLocaleString()} Estimated</div><Badge className="mt-2 bg-success/10 text-success">{mockAIAnalysis.saplingCount.confidence}% Confidence</Badge></div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="flex items-center gap-3 mb-3"><BarChart3 className="h-6 w-6 text-accent-strong" /><div className="flex-1"><h3 className="font-semibold">Canopy Health</h3><p className="text-sm text-muted-foreground">Vegetation health analysis</p></div></div><div className="space-y-2"><div className="flex items-center justify-between"><span className="text-2xl font-bold">{mockAIAnalysis.canopyHealth.percentage}%</span><Badge className="bg-success/10 text-success">{mockAIAnalysis.canopyHealth.status}</Badge></div><Progress value={mockAIAnalysis.canopyHealth.percentage} className="h-3"/></div></CardContent></Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="h-5 w-5 text-warning" />Anomalies Detected
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockAIAnalysis.anomalies.map((anomaly, index) => (
                    <div key={index} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{anomaly.location}</p>
                        <p className="text-xs text-muted-foreground">{anomaly.type}</p>
                      </div>
                      <Badge variant="outline" className={cn(
                        anomaly.severity === "Medium" && "border-yellow-500 text-yellow-600",
                        anomaly.severity === "High" && "border-destructive text-destructive"
                      )}>
                        {anomaly.severity}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/50">
              <CardHeader><CardTitle>Admin Decision</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label htmlFor="credits-amount">Tonnes of Carbon / Credits to Mint</Label><Input id="credits-amount" type="number" value={creditsToMint} onChange={(e) => setCreditsToMint(e.target.value)} disabled={isProcessing}/><p className="text-xs text-muted-foreground mt-1">AI Recommendation: {mockAIAnalysis.carbonCapture} tonnes</p></div>
                <div><Label htmlFor="rejection-reason">Reason for Rejection (if applicable)</Label><Input id="rejection-reason" placeholder="e.g., Data inconsistent with imagery" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} disabled={isProcessing}/></div>
                <div className="flex gap-4 pt-2"><Button onClick={handleApprove} className="w-full bg-success text-success-foreground hover:bg-success/90" disabled={isProcessing}>{isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4"/>} Approve</Button><Button onClick={handleReject} variant="destructive" className="w-full" disabled={isProcessing}>{isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4"/>} Reject</Button></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}