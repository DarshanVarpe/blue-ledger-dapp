import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";
import { formatUnits, parseUnits, maxUint256 } from 'viem';

// Contract configurations
import { marketplaceAddress, marketplaceAbi } from "@/contracts/marketplaceConfig";
import { paymentTokenAddress, paymentTokenAbi } from "@/contracts/paymentTokenConfig";

// UI Components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Badge } from "./ui/badge";

interface PurchaseCreditsProps {
  projectId: bigint;
  onSuccess: () => void; // This prop is now the key to triggering the confetti
}

type Listing = readonly [id: bigint, projectId: bigint, seller: `0x${string}`, quantity: bigint, pricePerUnit: bigint, active: boolean];

export function PurchaseCredits({ projectId, onSuccess }: PurchaseCreditsProps) {
  const { address: connectedAddress } = useAccount();
  const [quantity, setQuantity] = useState("1");
  const [totalPrice, setTotalPrice] = useState<bigint>(0n);
  // ✅ Confetti state is removed from this component

  const { data: listingId } = useReadContract({
    address: marketplaceAddress,
    abi: marketplaceAbi,
    functionName: 'activeListingIdForProject',
    args: [projectId],
  });

  const { data: listingData, refetch: refetchListing } = useReadContract({
    address: marketplaceAddress,
    abi: marketplaceAbi,
    functionName: 'listings',
    args: listingId ? [listingId] : undefined,
    query: { enabled: !!listingId && listingId > 0n },
  });
  const listing = listingData as Listing | undefined;

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: paymentTokenAddress,
    abi: paymentTokenAbi,
    functionName: 'allowance',
    args: connectedAddress ? [connectedAddress, marketplaceAddress] : undefined,
    query: { enabled: !!connectedAddress },
  });

  const { data: approveHash, writeContract: approveTokens, isPending: isApproveWalletPending, reset: resetApprove } = useWriteContract();
  const { isLoading: isConfirmingApprove, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  const { data: buyHash, writeContract: buyCredits, isPending: isBuyWalletPending, reset: resetBuy } = useWriteContract();
  const { isLoading: isConfirmingBuy, isSuccess: isBuySuccess } = useWaitForTransactionReceipt({ hash: buyHash });
  
  useEffect(() => {
    if (isApproveSuccess) {
      toast.success("USDC Approved Successfully!");
      refetchAllowance();
      resetApprove();
    }
  }, [isApproveSuccess, refetchAllowance, resetApprove]);

  useEffect(() => {
    if (isBuySuccess) {
      toast.success("Purchase Successful! Credits are in your wallet.");
      // ✅ The component now just calls the onSuccess prop.
      // The parent page will handle the confetti effect.
      onSuccess(); 
      refetchListing();
      refetchAllowance();
      setQuantity("1");
      resetBuy();
    }
  }, [isBuySuccess, refetchListing, refetchAllowance, resetBuy, onSuccess]);

  useEffect(() => {
    if (listing) {
      const q = BigInt(quantity || 0);
      const pricePer = listing[4];
      setTotalPrice(q * pricePer);
    }
  }, [quantity, listing]);

  const handleApprove = () => {
    toast.info("Awaiting approval in wallet to spend USDC...");
    approveTokens({
      address: paymentTokenAddress,
      abi: paymentTokenAbi,
      functionName: 'approve',
      args: [marketplaceAddress, maxUint256],
    });
  };

  const handleBuy = () => {
    if (!listing) return;
    toast.info("Processing purchase transaction...");
    buyCredits({
      address: marketplaceAddress,
      abi: marketplaceAbi,
      functionName: 'buyCredits',
      args: [listing[0], BigInt(quantity || "0")],
    });
  };
  
  const isProcessing = isApproveWalletPending || isConfirmingApprove || isBuyWalletPending || isConfirmingBuy;
  const needsApproval = allowance !== undefined && totalPrice > 0n && totalPrice > (allowance as bigint);
  const availableQuantity = listing ? Number(listing[3]) : 0;

  if (!listingId || listingId === 0n || !listing || !listing[5] || listing[3] === 0n) {
    return <Card><CardContent className="p-4 text-center text-sm text-muted-foreground">This project has no credits available for sale.</CardContent></Card>;
  }

  return (
    // ✅ The relative div and ConfettiProvider are removed from here.
    <Card className="border-accent-strong">
      <CardHeader>
        <CardTitle>Purchase Carbon Credits</CardTitle>
        <CardDescription>Buy verified BLC credits from this project.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center bg-muted p-3 rounded-lg">
          <span className="font-medium">Price / Credit</span>
          <Badge variant="secondary" className="text-lg">${formatUnits(listing[4], 6)} USDC</Badge>
        </div>
        <div>
            <label className="text-sm font-medium">Quantity (Available: {availableQuantity.toString()})</label>
            <Input type="number" min="1" max={availableQuantity.toString()} value={quantity} onChange={e => setQuantity(e.target.value)} disabled={isProcessing} />
        </div>
        <div className="flex justify-between items-center text-lg font-bold p-3">
          <span>Total Price</span>
          <span>${formatUnits(totalPrice, 6)} USDC</span>
        </div>
        
        {!connectedAddress ? (
            <Button className="w-full" disabled>Connect Wallet to Buy</Button>
        ) : needsApproval ? (
            <Button className="w-full" onClick={handleApprove} disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Approve USDC (One-Time)
            </Button>
        ) : (
            <Button className="w-full bg-success hover:bg-success/90" onClick={handleBuy} disabled={isProcessing || BigInt(quantity || 0) <= 0n}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buy Now
            </Button>
        )}
      </CardContent>
    </Card>
  );
}

