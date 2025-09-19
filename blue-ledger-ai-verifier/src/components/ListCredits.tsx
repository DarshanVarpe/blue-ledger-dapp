import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";
import { encodeAbiParameters, parseUnits } from 'viem'; 

// Import all contract configurations
import { contractAddress as registryAddress, contractAbi as registryAbi } from "@/contracts/contractConfig";
import { marketplaceAddress, marketplaceAbi } from "@/contracts/marketplaceConfig"; // ✅ Added marketplaceAbi

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Info } from "lucide-react";

// This should be your consistent Project type definition
type Project = readonly [ 
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

interface ListCreditsProps {
  project: Project;
  onSuccess: () => void; // Made onSuccess mandatory for better state management
}

export function ListCredits({ project, onSuccess }: ListCreditsProps) {
  const { address: connectedAddress } = useAccount();
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState(""); // Price in human-readable format (e.g., "15.50")

  // --- Read Contract: Check Marketplace Approval ---
  const { 
    data: isApproved, 
    isLoading: isLoadingApproval, // This might not be strictly needed for a button, but good for holistic understanding
    refetch: refetchApproval 
  } = useReadContract({
    address: registryAddress,
    abi: registryAbi,
    functionName: 'isApprovedForAll',
    args: connectedAddress && marketplaceAddress ? [connectedAddress, marketplaceAddress] : undefined,
    query: {
      enabled: !!connectedAddress && !!marketplaceAddress,
      staleTime: 0, 
      gcTime: 0,
    }
  });

  // --- Read Contract: Check Active Listing for this Project ---
  // ✅ NEW: Read the active listing ID
  const { 
    data: activeListingId, 
    isLoading: isLoadingActiveListing,
    refetch: refetchActiveListing 
  } = useReadContract({
    address: marketplaceAddress,
    abi: marketplaceAbi, // ✅ Using marketplaceAbi
    functionName: 'activeListingIdForProject',
    args: [project[0]], // Pass the project ID
    query: {
        enabled: !!connectedAddress && project[0] > 0n, // Enable if connected and project ID is valid
        staleTime: 0,
        gcTime: 0,
    }
  });
  
  // Convert to boolean for easier checks
  const isListed = !!activeListingId && (activeListingId as bigint) > 0n;


  // --- Write Contract: Approve Marketplace (setApprovalForAll) ---
  const { 
    data: approveHash, 
    writeContract: writeApprove, 
    isPending: isApproveWalletPending, 
    error: approveWriteError,
    reset: resetApproveWrite
  } = useWriteContract();

  // Wait for Approval transaction receipt status
  const { 
    isLoading: isConfirmingApprove, 
    isSuccess: isApproveConfirmed, 
    isError: isApproveConfirmError,
    error: approveConfirmError, // ✅ Added for specific receipt errors
  } = useWaitForTransactionReceipt({ 
    hash: approveHash,
    query: { enabled: !!approveHash },
  });

  // ✅ FIX: useEffect to react to approval confirmation
  useEffect(() => {
    if (isApproveConfirmed) {
      toast.success("Marketplace approval confirmed!");
      refetchApproval(); // Re-check approval status immediately
      onSuccess(); // Trigger parent refetch
      resetApproveWrite(); // Clear write contract state
    }
    if (isApproveConfirmError) {
      toast.error(`Approval transaction failed: ${approveConfirmError?.message || "Unknown error"}`);
      resetApproveWrite();
    }
  }, [isApproveConfirmed, isApproveConfirmError, approveConfirmError, refetchApproval, onSuccess, resetApproveWrite]);


  // --- Write Contract: List Credits (safeTransferFrom to marketplace) ---
  const { 
    data: listHash, 
    writeContract: writeList, 
    isPending: isListWalletPending, 
    error: listWriteError,
    reset: resetListWrite
  } = useWriteContract();

  // Wait for Listing transaction receipt status
  const { 
    isLoading: isConfirmingList, 
    isSuccess: isListConfirmed, 
    isError: isListConfirmError,
    error: listConfirmError, // ✅ Added for specific receipt errors
  } = useWaitForTransactionReceipt({ 
    hash: listHash,
    query: { enabled: !!listHash },
  });

  // ✅ FIX: useEffect to react to listing confirmation
  useEffect(() => {
    if (isListConfirmed) {
      toast.success("Credits listed successfully on the marketplace!");
      setQuantity(""); // Clear input fields
      setPrice("");
      refetchApproval(); // Potentially useful if approval status changes or to re-evaluate UI
      refetchActiveListing(); // ✅ NEW: Refetch active listing status
      onSuccess(); // Trigger parent refetch
      resetListWrite(); // Clear write contract state
    }
    if (isListConfirmError) {
      toast.error(`Listing transaction failed: ${listConfirmError?.message || "Unknown error"}`);
      resetListWrite();
    }
  }, [isListConfirmed, isListConfirmError, listConfirmError, refetchApproval, refetchActiveListing, onSuccess, resetListWrite]);

    // --- Write Contract: Unlist Credits from marketplace ---
    // ✅ NEW: Hooks for unlisting
    const { 
        data: unlistHash, 
        writeContract: writeUnlist, 
        isPending: isUnlistWalletPending, 
        error: unlistWriteError,
        reset: resetUnlistWrite
    } = useWriteContract();

    // Wait for Unlisting transaction receipt status
    const { 
        isLoading: isConfirmingUnlist, 
        isSuccess: isUnlistConfirmed, 
        isError: isUnlistConfirmError,
        error: unlistConfirmError, // ✅ Added for specific receipt errors
    } = useWaitForTransactionReceipt({ 
        hash: unlistHash,
        query: { enabled: !!unlistHash },
    });

    // ✅ NEW: useEffect to react to unlisting confirmation
    useEffect(() => {
        if (isUnlistConfirmed) {
            toast.success("Credits successfully unlisted from marketplace!");
            refetchActiveListing(); // ✅ NEW: Refetch active listing status
            onSuccess(); // Trigger parent refetch
            resetUnlistWrite(); // Clear write contract state
        }
        if (isUnlistConfirmError) {
            toast.error(`Unlisting transaction failed: ${unlistConfirmError?.message || "Unknown error"}`);
            resetUnlistWrite();
        }
    }, [isUnlistConfirmed, isUnlistConfirmError, unlistConfirmError, refetchActiveListing, onSuccess, resetUnlistWrite]);


  // --- Error Handling (Wallet rejection/simulation errors from useWriteContract) ---
  useEffect(() => {
    if (approveWriteError) {
      toast.error(`Approval failed: ${approveWriteError.message}`);
      resetApproveWrite();
    }
  }, [approveWriteError, resetApproveWrite]);

  useEffect(() => {
    if (listWriteError) {
      toast.error(`Listing failed: ${listWriteError.message}`);
      resetListWrite();
    }
  }, [listWriteError, resetListWrite]);

  // ✅ NEW: Error handling for unlist
  useEffect(() => {
    if (unlistWriteError) {
      toast.error(`Unlisting failed: ${unlistWriteError.message}`);
      resetUnlistWrite();
    }
  }, [unlistWriteError, resetUnlistWrite]);


  // --- Handlers ---
  const handleApprove = () => {
    if (!connectedAddress) {
      toast.error("Please connect your wallet.");
      return;
    }
    toast.info("Awaiting marketplace approval in wallet...");
    writeApprove({
      address: registryAddress,
      abi: registryAbi,
      functionName: 'setApprovalForAll',
      args: [marketplaceAddress, true],
    });
  };

  const handleList = () => {
    if (!connectedAddress) {
      toast.error("Please connect your wallet.");
      return;
    }

    const parsedQuantity = parseFloat(quantity);
    const parsedPrice = parseFloat(price);

    if (isNaN(parsedQuantity) || parsedQuantity <= 0 || isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error("Please enter valid quantity and price.");
      return;
    }
    if (BigInt(parsedQuantity) > project[8]) { // project[8] is creditsMinted
      toast.error(`You only have ${project[8].toString()} credits available.`);
      return;
    }
    if (!isApproved) {
        toast.error("Please approve the marketplace first before listing credits.");
        return;
    }

    toast.info("Awaiting listing transaction in wallet...");
    
    // We assume the payment token (USDC) has 6 decimals for price, adjust if needed
    const priceInSmallestUnit = parseUnits(price, 6); // Convert human-readable price to smallest unit

    // The data parameter for ERC1155 safeTransferFrom is arbitrary data.
    // Our marketplace contract expects the pricePerUnit to be encoded here.
    const data = encodeAbiParameters(
      [{ type: 'uint256' }],
      [priceInSmallestUnit]
    );

    writeList({
      address: registryAddress,
      abi: registryAbi,
      functionName: 'safeTransferFrom',
      // args: [from, to, id, amount, data]
      args: [connectedAddress, marketplaceAddress, project[0], BigInt(parsedQuantity), data], // project[0] is projectId
    });
  };

  // ✅ NEW: Unlist Handler
  const handleUnlist = () => {
    if (!connectedAddress) {
        toast.error("Please connect your wallet.");
        return;
    }
    if (!isListed) {
        toast.error("No active listing found to unlist.");
        return;
    }
    if (!(activeListingId as bigint > 0n)) { // Ensure activeListingId is a valid bigint
        toast.error("Invalid listing ID.");
        return;
    }

    toast.info("Awaiting unlist transaction in wallet...");
    writeUnlist({
        address: marketplaceAddress, // ✅ Use marketplace address
        abi: marketplaceAbi,         // ✅ Use marketplace ABI
        functionName: 'unlistCredits',
        args: [activeListingId as bigint], // Pass the active listing ID
    });
  };
  
  // Combine all pending/loading states
  const isProcessing = 
    isApproveWalletPending || isConfirmingApprove || 
    isListWalletPending || isConfirmingList ||
    isUnlistWalletPending || isConfirmingUnlist || // ✅ NEW: Include unlist processing
    isLoadingApproval || isLoadingActiveListing; // Also consider loading for initial checks

  const hasSufficientCredits = parseFloat(quantity) > 0 && BigInt(parseFloat(quantity)) <= project[8];
  const isValidPrice = parseFloat(price) > 0;
  const canList = connectedAddress && hasSufficientCredits && isValidPrice && isApproved;


  // --- Conditional Rendering based on Listing Status ---
  if (isListed) {
    return (
      <Card className="border-accent-strong">
        <CardHeader>
          <CardTitle>Manage Marketplace Listing</CardTitle>
          <CardDescription>This project's credits are currently for sale.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">To change the price or quantity, you must first unlist the current credits. This will return them to your wallet.</p>
          <Button variant="destructive" className="w-full" onClick={handleUnlist} disabled={isProcessing}>
            {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Unlisting...</> : <>Unlist Credits</>}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-accent-strong">
      <CardHeader>
        <CardTitle>List Credits on Marketplace</CardTitle>
        <CardDescription>Make your verified credits available for purchase.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
            <label className="text-sm font-medium">Credits to List (Available: {project[8].toString()})</label>
            <Input 
                type="number" 
                placeholder="e.g., 100" 
                value={quantity} 
                onChange={e => setQuantity(e.target.value)} 
                min="1"
                max={project[8].toString()} // Limit input to available credits
                disabled={isProcessing}
            />
        </div>
        <div>
            <label className="text-sm font-medium">Price per Credit (in USDC)</label>
            <Input 
                type="number" 
                placeholder="e.g., 15.50" 
                value={price} 
                onChange={e => setPrice(e.target.value)} 
                min="0.01" // Minimum price
                step="0.01" // Allow decimal input
                disabled={isProcessing}
            />
        </div>

        {!connectedAddress ? (
            <Button className="w-full" disabled>Connect Wallet to List Credits</Button>
        ) : !isApproved ? (
            <Button className="w-full" onClick={handleApprove} disabled={isProcessing}>
                {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Approving...</> : <>Step 1: Approve Marketplace</>}
            </Button>
        ) : (
            <Button 
              className="w-full bg-success hover:bg-success/90" 
              onClick={handleList} 
              disabled={isProcessing || !canList}
            >
                {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Listing...</> : <>Step 2: List Credits</>}
            </Button>
        )}
        {!connectedAddress && (
             <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4"/>Please connect your wallet to list carbon credits.
            </p>
        )}
        {connectedAddress && !isApproved && (
             <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4"/>Approving the marketplace allows it to transfer BLC tokens from your wallet when a sale occurs. This is a one-time approval per token.
            </p>
        )}
        {connectedAddress && isApproved && (!hasSufficientCredits || !isValidPrice) && (
             <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4"/>Please enter a valid quantity and price to list credits.
            </p>
        )}
      </CardContent>
    </Card>
  );
}