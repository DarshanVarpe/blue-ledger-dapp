import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Loader2, Upload, FileUp } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import axios from "axios";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contractAddress, contractAbi } from "@/contracts/contractConfig";

interface MRVSubmissionProps {
    projectId: string | undefined;
    isOwner: boolean;
    onSuccess: () => void;
}

export function MRVSubmission({ projectId, isOwner, onSuccess }: MRVSubmissionProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const { data: hash, writeContract, isPending, reset, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleUploadAndSubmit = async () => {
        if (!selectedFile) {
            toast.error("Please select a file to upload.");
            return;
        }
        setIsUploading(true);
        toast.loading("Uploading MRV data to IPFS...", { id: "mrv-upload" });
        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            const res = await axios.post("/pinata/pinning/pinFileToIPFS", formData, {
                headers: {
                    'pinata_api_key': import.meta.env.VITE_PINATA_API_KEY,
                    'pinata_secret_api_key': import.meta.env.VITE_PINATA_SECRET_API_KEY,
                    "Content-Type": "multipart/form-data",
                },
            });
            const ipfsHash = res.data.IpfsHash;
            toast.success(`File uploaded to IPFS!`, { id: "mrv-upload" });
            toast.info("Awaiting wallet confirmation to submit hash on-chain.");
            writeContract({
                address: contractAddress, abi: contractAbi, functionName: "submitMRVData", args: [BigInt(projectId || 0), ipfsHash],
            });
        } catch (error) {
            console.error("IPFS Upload Error:", error);
            toast.error("IPFS Upload Failed", { id: "mrv-upload", description: "Please check console for details." });
        } finally {
            setIsUploading(false);
        }
    };

    useEffect(() => {
        const toastId = `mrv-${hash}`;
        if (isConfirming) toast.loading("Processing on-chain submission...", { id: toastId });
        if (isConfirmed) {
            toast.success("MRV Data Submitted Successfully!", { id: toastId });
            setSelectedFile(null);
            reset();
            onSuccess();
        }
        if (error) {
            toast.error("Transaction Failed", { id: toastId, description: error.message });
        }
    }, [isConfirming, isConfirmed, hash, onSuccess, reset, error]);

    const isProcessing = isUploading || isPending || isConfirming;

    if (!isOwner) {
        return (
            <Card className="shadow-card sticky top-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Upload /> Submit MRV Data</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Permission Denied</AlertTitle><AlertDescription>Only the project owner can submit data.</AlertDescription></Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-card sticky top-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Upload /> Submit MRV Data</CardTitle>
                <CardDescription>Upload new data (e.g., drone imagery) for verification.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="file-upload">MRV Data File (Image, PDF, etc.)</Label>
                        <Input id="file-upload" type="file" onChange={handleFileChange} className="mt-1 file:text-primary file:font-semibold"/>
                        {selectedFile && <p className="text-xs text-muted-foreground mt-2">Selected: {selectedFile.name}</p>}
                    </div>
                    <Button className="w-full" onClick={handleUploadAndSubmit} disabled={!selectedFile || isProcessing}>
                        {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : <><FileUp className="mr-2 h-4 w-4" />Upload & Submit</>}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}