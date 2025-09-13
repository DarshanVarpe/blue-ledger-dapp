import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, MapPin, Loader2, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import axios from "axios";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contractAddress, contractAbi } from "@/contracts/contractConfig";

interface ProjectRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type RegistrationStep = "details" | "upload";

export function ProjectRegistrationModal({ open, onOpenChange, onSuccess }: ProjectRegistrationModalProps) {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>("details");
  // ✅ ADDED: lat and lng to the form state
  const [formData, setFormData] = useState({ name: "", description: "", location: "", lat: "", lng: "" });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { address: userAddress, isConnected, isConnecting } = useAccount();

  const { data: isNgo, isLoading: isLoadingNgoStatus } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'isNgo',
    args: [userAddress!],
    query: { enabled: isConnected && !!userAddress },
  });

  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  
  const handleSubmit = async () => {
    if (!isStepValid()) {
      toast.error("Please complete all required fields and upload a file.");
      return;
    }
    setIsUploading(true);
    const toastId = `reg-${Date.now()}`;
    toast.loading("Step 1/3: Uploading baseline image...", { id: toastId });
    try {
      const imageFormData = new FormData();
      imageFormData.append("file", uploadedFiles[0]);
      // This endpoint seems custom. Ensure your backend/proxy handles it.
      // A direct Pinata call is shown in other components.
      const imageRes = await axios.post("/pinata/pinning/pinFileToIPFS", imageFormData, {
        headers: { 'pinata_api_key': import.meta.env.VITE_PINATA_API_KEY, 'pinata_secret_api_key': import.meta.env.VITE_PINATA_SECRET_API_KEY, "Content-Type": "multipart/form-data" },
      });
      const imageIpfsHash = imageRes.data.IpfsHash;
      toast.loading("Step 2/3: Uploading metadata...", { id: toastId });

      // ✅ ADDED: coordinates to the metadata object
      const metadata = { 
        name: formData.name, 
        description: formData.description, 
        image: imageIpfsHash,
        coordinates: {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng)
        }
      };
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
      const metadataFile = new File([metadataBlob], "metadata.json");
      const metadataFormData = new FormData();
      metadataFormData.append("file", metadataFile);
      const metadataRes = await axios.post("/pinata/pinning/pinFileToIPFS", metadataFormData, {
        headers: { 'pinata_api_key': import.meta.env.VITE_PINATA_API_KEY, 'pinata_secret_api_key': import.meta.env.VITE_PINATA_SECRET_API_KEY, "Content-Type": "multipart/form-data" },
      });
      const metadataIpfsHash = metadataRes.data.IpfsHash;
      toast.loading("Step 3/3: Awaiting wallet confirmation...", { id: toastId });
      
      writeContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: "registerProject",
        args: [formData.name, formData.location, metadataIpfsHash],
      });
    } catch (err) {
      console.error("Project Registration Error:", err);
      toast.error("Project Registration Failed", { id: toastId, description: "Please check console for details." });
      setIsUploading(false);
    }
  };
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    const toastId = `reg-${hash}`;
    if (isConfirming) toast.loading("Processing on-chain transaction...", { id: toastId });
    if (isConfirmed) {
      toast.success("Project Registered Successfully!", { id: toastId });
      onSuccess?.(); 
      // ✅ ADDED: Reset lat and lng fields
      setFormData({ name: "", description: "", location: "", lat: "", lng: "" });
      setUploadedFiles([]);
      setCurrentStep("details");
      onOpenChange(false);
      reset();
      setIsUploading(false);
    }
    if (error) {
       toast.error("Transaction Failed", { id: toastId, description: error.message });
       setIsUploading(false);
    }
  }, [isConfirming, isConfirmed, error, onOpenChange, onSuccess, hash, reset]);

  const handleNext = () => currentStep === "details" && setCurrentStep("upload");
  const handleBack = () => currentStep === "upload" && setCurrentStep("details");
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    toast.success(`${files.length} file(s) selected.`);
  };

  const isStepValid = () => {
    // ✅ ADDED: Check for lat and lng in validation
    if (currentStep === "details") return formData.name && formData.description && formData.location && formData.lat && formData.lng;
    if (currentStep === "upload") return uploadedFiles.length > 0;
    return false;
  };
  const isProcessing = isUploading || isPending || isConfirming;

  const renderContent = () => {
    if (isLoadingNgoStatus || isConnecting) {
      return <div className="flex justify-center items-center h-48"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }
    if (!isNgo && isConnected) {
      return ( <Alert variant="destructive" className="mt-4"> <AlertCircle className="h-4 w-4" /><AlertTitle>Authorization Required</AlertTitle> <AlertDescription>Your wallet is not an authorized NGO. Please contact the NCCR admin.</AlertDescription> </Alert> );
    }
    return (
      <>
        <div className="flex items-center gap-4 my-6">
          <div className={cn("flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium", currentStep === "details" ? "bg-primary text-primary-foreground" : "bg-success text-success-foreground")}>1</div>
          <div className="text-sm font-medium">Project Details</div>
          <div className="flex-1 h-px bg-border" />
          <div className={cn("flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium", currentStep === "upload" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>2</div>
          <div className="text-sm font-medium">Initial Data</div>
        </div>
        {currentStep === "details" && ( <div className="space-y-6"> <Card><CardContent className="space-y-4 pt-6"> <div><Label htmlFor="project-name">Project Name *</Label><Input id="project-name" placeholder="e.g., Sundarbans Mangrove Restoration" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="mt-2" /></div> <div><Label htmlFor="project-description">Description *</Label><Textarea id="project-description" placeholder="Describe your project goals..." value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} className="mt-2 min-h-[100px]" /></div> <div><Label htmlFor="project-location">Location *</Label><div className="relative mt-2"><MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="project-location" placeholder="e.g., West Bengal, India" value={formData.location} onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))} className="pl-10" /></div></div>
        {/* ✅ ADDED: Latitude and Longitude input fields */}
        <div className="grid grid-cols-2 gap-4">
            <div>
                <Label htmlFor="project-lat">Latitude *</Label>
                <Input id="project-lat" type="number" placeholder="e.g., 21.9497" value={formData.lat} onChange={(e) => setFormData(p => ({ ...p, lat: e.target.value }))} className="mt-2" />
            </div>
            <div>
                <Label htmlFor="project-lng">Longitude *</Label>
                <Input id="project-lng" type="number" placeholder="e.g., 89.1833" value={formData.lng} onChange={(e) => setFormData(p => ({ ...p, lng: e.target.value }))} className="mt-2" />
            </div>
        </div>
        </CardContent></Card> </div> )}
        {currentStep === "upload" && ( <div className="space-y-6"> <Card><CardHeader><CardTitle>Upload Initial Data</CardTitle><CardDescription>Provide documents and imagery for project verification.</CardDescription></CardHeader> <CardContent> <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors"> <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">Drop files here or click to upload</h3><p className="text-sm text-muted-foreground mb-4">Upload PDFs, drone imagery, etc.</p> <input type="file" multiple onChange={handleFileUpload} className="hidden" id="file-upload" /> <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>Choose Files</Button> </div> {uploadedFiles.length > 0 && ( <div className="mt-4 space-y-2"><h4 className="font-medium">Uploaded Files ({uploadedFiles.length})</h4> <div className="space-y-2 max-h-32 overflow-y-auto pr-2"> {uploadedFiles.map((file, index) => (<div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg"><span className="text-sm font-medium truncate">{file.name}</span><span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span></div>))} </div> </div> )} </CardContent> </Card> </div> )}
        <div className="flex items-center justify-between pt-6 border-t mt-4">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === "details" || isProcessing}><ChevronLeft className="w-4 h-4 mr-2" />Back</Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            {currentStep === "details" ? ( <Button onClick={handleNext} disabled={!isStepValid()} >Next Step<ChevronRight className="w-4 h-4 ml-2" /></Button> ) : ( <Button onClick={handleSubmit} disabled={!isStepValid() || isProcessing} className="bg-success text-success-foreground hover:bg-success/90"> {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : "Submit Project"} </Button> )}
          </div>
        </div>
      </>
    );
  };
  return ( <Dialog open={open} onOpenChange={onOpenChange}> <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle className="text-2xl font-semibold">Register New Project</DialogTitle><DialogDescription>Submit your blue carbon restoration project for on-chain verification.</DialogDescription></DialogHeader> {renderContent()} </DialogContent> </Dialog> );
}