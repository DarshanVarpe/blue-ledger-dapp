// src/pages/TradingPlatform.tsx

import { ShoppingCart, Wrench } from "lucide-react";

export default function TradingPlatform() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center p-8">
      <div className="p-6 bg-gradient-ocean rounded-full mb-6">
        <ShoppingCart className="h-12 w-12 text-primary-foreground" />
      </div>
      <h1 className="text-4xl font-bold text-foreground">Carbon Credit Marketplace</h1>
      <p className="text-2xl text-muted-foreground mt-2">Coming Soon</p>
      <div className="mt-8 max-w-2xl mx-auto">
        <p className="text-muted-foreground">
          Our decentralized trading platform will provide a transparent and secure marketplace
          for buying and selling verified Blue Ledger Carbon (BLC) credits. Project owners will
          be able to list their tokenized credits, and buyers can purchase them with confidence,
          knowing each credit is backed by a fully audited, on-chain project record.
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-12">
        <Wrench className="h-4 w-4" />
        <span>This feature is currently under development.</span>
      </div>
    </div>
  );
}