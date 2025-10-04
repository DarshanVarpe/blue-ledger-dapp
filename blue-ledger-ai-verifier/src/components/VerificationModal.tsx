import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Check, X, Image as ImageIcon, FileText, MapPin, TreePine, BarChart3, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// --- Hooks and Config ---
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contractAddress, contractAbi } from "@/contracts/contractConfig";
import { useProjectMetadata } from "@/hooks/useProjectMetadata";
import { ProjectMap } from "@/components/ProjectMap";

// --- Type Definitions ---
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

interface VerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSuccess?: () => void;
}

const mockAIAnalysis = {
  saplingCount: { detected: 4852, estimated: 5000, confidence: 97.2 },
  canopyHealth: { percentage: 84, status: "Good" },
  anomalies: [
    { location: "Sector A-3", type: "Dead vegetation", severity: "Medium" },
  ],
  carbonCapture: 1850
}

export function VerificationModal({ open, onOpenChange, project, onSuccess }: VerificationModalProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [creditsToMint, setCreditsToMint] = useState("");

  const { metadata, isLoading: isMetadataLoading } = useProjectMetadata(project ? project.metadataHash : null);
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (open && project) {
      setCreditsToMint(project.carbonSequestered.toString());
      setRejectionReason("");
    }
  }, [open, project]);

  const handleApprove = () => {
    const amount = parseInt(creditsToMint, 10);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid number for credits to mint.");
      return;
    }
    writeContract({
      address: contractAddress,
      abi: contractAbi ,
      functionName: "verifyAndMintCredits",
      args: [project!.id, BigInt(amount), BigInt(amount)],
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
      args: [project!.id, rejectionReason],
    });
  };
  
  useEffect(() => {
    if (isConfirming) toast.loading("Processing decision on-chain...", { id: `verify-${hash}` });
    if (isConfirmed) {
      toast.success("Verification Decision Confirmed!", { id: `verify-${hash}` });
      onSuccess?.();
      onOpenChange(false);
      reset();
    }
    if (error) toast.error("Transaction Failed", { id: `verify-${hash}`, description: error.message });
  }, [isConfirming, isConfirmed, error, hash, onSuccess, onOpenChange, reset]);

  if (!project) return null;
  const isProcessing = isPending || isConfirming;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* ✅ FIX: New Flexbox structure for reliable scrolling */}
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 shrink-0">
          <DialogTitle className="text-2xl font-semibold">Verify Project: {project.name}</DialogTitle>
          <DialogDescription>Review the submitted data, location, and AI analysis to make a decision.</DialogDescription>
        </DialogHeader>

        {isMetadataLoading ? (
          <div className="flex-grow flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin"/>
          </div>
        ) : (
          // ✅ FIX: This div is now the dedicated scrollable area
          <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 overflow-y-auto">
            {/* Left Column - Visual Verification */}
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5"/> Baseline Image</CardTitle></CardHeader>
                <CardContent><img src={metadata?.image} alt="Project Baseline" className="rounded-md border w-full object-cover aspect-video"/></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5"/> Project Location</CardTitle></CardHeader>
                <CardContent className="h-80 p-0">
                  {metadata?.coordinates ? (
                    <ProjectMap coords={metadata.coordinates} projectName={project.name} />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-muted rounded-b-lg">
                      <p className="text-muted-foreground">Coordinates not provided.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column - Data, AI Analysis */}
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/> Project Details</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md border">{metadata?.description}</p>
                </CardContent>
              </Card>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold pl-1">AI Verification Assistant (Work Under Progress)</h3>
                <Card><CardContent className="p-4"><div className="flex items-center gap-3 mb-3"><TreePine className="h-6 w-6 text-success" /><div className="flex-1"><h3 className="font-semibold">AI Sapling Count</h3><p className="text-sm text-muted-foreground">Automated tree detection</p></div></div><div className="text-center"><div className="text-3xl font-bold text-success mb-1">{mockAIAnalysis.saplingCount.detected.toLocaleString()}</div><div className="text-sm text-muted-foreground">/ {mockAIAnalysis.saplingCount.estimated.toLocaleString()} Estimated</div><Badge className="mt-2 bg-success/10 text-success">{mockAIAnalysis.saplingCount.confidence}% Confidence</Badge></div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="flex items-center gap-3 mb-3"><BarChart3 className="h-6 w-6 text-accent-strong" /><div className="flex-1"><h3 className="font-semibold">Canopy Health</h3><p className="text-sm text-muted-foreground">Vegetation health analysis</p></div></div><div className="space-y-2"><div className="flex items-center justify-between"><span className="text-2xl font-bold">{mockAIAnalysis.canopyHealth.percentage}%</span><Badge className="bg-success/10 text-success">{mockAIAnalysis.canopyHealth.status}</Badge></div><Progress value={mockAIAnalysis.canopyHealth.percentage} className="h-3"/></div></CardContent></Card>
              </div>
            </div>
          </div>
        )}

        {/* ✅ FIX: Decision card is now a fixed footer, outside the scrollable area */}
        <div className="shrink-0 p-6 border-t bg-background">
          <Card className="border-primary/50">
            <CardHeader><CardTitle>Admin Decision</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="credits-amount">Tonnes of Carbon / Credits to Mint</Label>
                <Input id="credits-amount" type="number" value={creditsToMint} onChange={(e) => setCreditsToMint(e.target.value)} disabled={isProcessing}/>
                <p className="text-xs text-muted-foreground mt-1">AI Recommendation: {mockAIAnalysis.carbonCapture} tonnes</p>
              </div>
              <div>
                <Label htmlFor="rejection-reason">Reason for Rejection (if applicable)</Label>
                <Input id="rejection-reason" placeholder="e.g., Data inconsistent with imagery" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} disabled={isProcessing}/>
              </div>
              <div className="flex gap-4 pt-2">
                <Button onClick={handleApprove} className="w-full bg-success text-success-foreground hover:bg-success/90" disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4"/>} Approve
                </Button>
                <Button onClick={handleReject} variant="destructive" className="w-full" disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4"/>} Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}