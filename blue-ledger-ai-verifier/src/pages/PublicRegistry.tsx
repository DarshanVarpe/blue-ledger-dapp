// src/pages/PublicRegistry.tsx
import { useReadContract } from 'wagmi';
import { motion } from 'framer-motion';
import { contractAddress, contractAbi } from '@/contracts/contractConfig';
import { PublicProjectCard } from '@/components/PublicProjectCard'; // Import our new card
import { Globe, Loader2 } from 'lucide-react';

// Make sure your Project type here matches the one in the card
type Project = {
  id: bigint;
  name: string;
  location: string;
  metadataHash: string;
  creditsMinted: bigint;
  // ... any other fields you need from the struct
};

// This container variant will make the cards animate in one by one
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // This creates the staggered effect
    },
  },
};

export function PublicRegistry() {
  const { data: allProjects, isLoading } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getAllProjects',
  });

  // Filter for only VERIFIED projects (status === 2)
  const verifiedProjects = (allProjects as any[] || []).filter(p => p.status === 2);

  return (
    <div className="min-h-screen bg-gradient-surface p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Globe className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">Public Carbon Project Registry</h1>
          <p className="text-lg text-muted-foreground mt-4">
            A transparent, on-chain record of all verified restoration projects.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {verifiedProjects.map(project => (
              <PublicProjectCard key={project.id.toString()} project={project} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}