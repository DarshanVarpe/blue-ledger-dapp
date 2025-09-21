import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Loader2, Upload, FileUp } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import axios from "axios";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contractAddress, contractAbi } from "@/contracts/contractConfig";
import { FileUpload } from "@/components/ui/file-upload"; // ✅ 1. Import the new component

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

    // ✅ 2. Update the file handler to accept an array and take the first file
    const handleFileChange = (newFiles: File[]) => {
        if (newFiles.length > 0) {
            setSelectedFile(newFiles[0]); 
        } else {
            setSelectedFile(null);
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
            const pinataUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS";

            const res = await axios.post(pinataUrl, formData, {
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
        } catch (error: any) { // Better error typing
            console.error("IPFS Upload Error:", error);
            const errorMessage = error.response?.data?.error || error.message || "An unknown error occurred.";
            toast.error("IPFS Upload Failed", { id: "mrv-upload", description: errorMessage });
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
            reset(); // Also reset on error
        }
    }, [isConfirming, isConfirmed, hash, onSuccess, reset, error]);

    const isProcessing = isUploading || isPending || isConfirming;

    if (!isOwner) {
        return (
            <Card className="shadow-card">
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
        <Card className="shadow-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Upload /> Submit New MRV Data</CardTitle>
                <CardDescription>Upload new data (e.g., drone imagery) for ongoing verification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ✅ 3. Replace the old input with the new FileUpload component */}
              <FileUpload onChange={handleFileChange} multiple={false} />
              
              <Button className="w-full" onClick={handleUploadAndSubmit} disabled={!selectedFile || isProcessing}>
                  {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : <><FileUp className="mr-2 h-4 w-4" />Upload & Submit Data</>}
              </Button>
            </CardContent>
        </Card>
    );
}