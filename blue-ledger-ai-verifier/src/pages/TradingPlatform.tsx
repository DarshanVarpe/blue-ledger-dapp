// blue-ledger-ai-verifier/src/pages/TradingPlatform.tsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, MapPin, Waves, Leaf, Users, DollarSign, Loader2, Info } from 'lucide-react';
import { useReadContract, usePublicClient } from 'wagmi'; // usePublicClient to access client for direct calls
import { Link } from 'react-router-dom';
import { formatUnits } from 'viem';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AnimatedBackground } from '@/components/AnimatedBackground'; 
import { CometCard } from "@/components/ui/CometCard"; 
import { LoaderThree } from '@/components/ui/loader';
import { MacbookScroll } from "@/components/ui/macbook-scroll"; // ✅ 1. Import the new component
import insightsScreenshot from "@/assets/insights-screenshot.png"; 
import {CardTitle, CardDescription } from '@/components/ui/card';
import {Lock, Globe, Zap } from 'lucide-react';



// Your contract configurations
import { contractAddress as registryAddress, contractAbi as registryAbi } from "@/contracts/contractConfig";
import { marketplaceAddress, marketplaceAbi } from "@/contracts/marketplaceConfig";

// Assets imports - ensure these images are in src/assets/
import mangroveHero from '@/assets/mangrove-hero.jpg';
import genericProjectImage from '@/assets/generic-project.jpg'; // Generic fallback image

// Add specific placeholder images if desired, e.g., for different ecosystems if metadata doesn't provide
// import seagrassPlaceholder from '@/assets/seagrass-project.jpg';
// import saltMarshPlaceholder from '@/assets/salt-marsh-project.jpg';


// Type Definitions from your contracts
interface ProjectFromRegistry  {
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
}

// Listing type from your Marketplace contract
type ListingFromMarketplace = readonly [
  id: bigint, 
  projectId: bigint, 
  seller: `0x${string}`, 
  quantity: bigint, 
  pricePerUnit: bigint, 
  active: boolean
];

// Combined and enriched type for our marketplace page
interface ProjectForSale {
  id: bigint;
  name: string;
  location: string;
  imageURL: string; // From IPFS metadata, or a placeholder
  availableQuantity: bigint; // from listing
  pricePerCredit: bigint; // from listing
  ecosystem: 'Mangrove' | 'Seagrass' | 'Salt Marsh' | 'Other'; // From IPFS metadata, or default
  // Add other useful fields from metadata if needed, e.g., description
}

interface FilterState {
  locationSearch: string; // Changed from 'location' to 'locationSearch' for input field
  ecosystemSearch: string; // Changed from 'ecosystem' to 'ecosystemSearch' for input field
  sortBy: string;
}

// --- Helper functions for Ecosystem Badges ---
const getEcosystemIcon = (ecosystem: string) => {
  switch (ecosystem) {
    case 'Mangrove': return <Leaf className="h-4 w-4" />;
    case 'Seagrass': return <Waves className="h-4 w-4" />;
    case 'Salt Marsh': return <Users className="h-4 w-4" />; // Using 'Users' as a generic icon for Salt Marsh
    default: return <Leaf className="h-4 w-4" />;
  }
};

const getEcosystemColorClass = (ecosystem: string) => {
  switch (ecosystem) {
    case 'Mangrove': return 'bg-sage-green text-white';
    case 'Seagrass': return 'bg-teal-primary text-white';
    case 'Salt Marsh': return 'bg-ocean-primary text-white';
    default: return 'bg-muted-foreground text-white';
  }
};

// --- Re-usable Project Card Component ---
const ProjectCard = ({ project, index }: { project: ProjectForSale, index: number }) => {
  
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6 }
        }
      }}
      initial="hidden"
      animate="visible"
      whileHover={{
        scale: 1.02,
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)", // More pronounced shadow
        y: -5, // Slight lift
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      className="h-full" // Ensure card takes full height for grid alignment
    >
      <Card className="overflow-hidden shadow-card transition-all duration-300 bg-white h-full flex flex-col">
        <div className="relative">
          <img
            src={project.imageURL || genericProjectImage}
            alt={project.name}
            className="w-full h-48 object-cover"
          />
          <Badge className="absolute top-3 right-3 bg-success text-success-foreground">
            For Sale
          </Badge>
          <Badge
            className={`absolute top-3 left-3 ${getEcosystemColorClass(project.ecosystem)} flex items-center gap-1`}
          >
            {getEcosystemIcon(project.ecosystem)}
            {project.ecosystem}
          </Badge>
        </div>

        <CardHeader className="pb-3 flex-grow">
          <h3 className="text-xl font-semibold text-ocean-primary line-clamp-2 min-h-[56px]">
            {project.name}
          </h3>
          <div className="flex items-center text-muted-foreground text-sm">
            <MapPin className="h-4 w-4 mr-1" />
            {project.location}
          </div>
        </CardHeader>

        <CardContent className="py-2">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Price per Credit</span>
              <span className="text-lg font-bold text-ocean-primary">
                ${formatUnits(project.pricePerCredit, 6)} / tonne
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Available Quantity</span>
              <span className="font-semibold text-ocean-primary">
                {project.availableQuantity.toLocaleString()} tonnes
              </span>
            </div>
          </div>
        </CardContent>

         <CardFooter className="pt-3">
  <motion.div
    // Wrapper for Framer Motion effects on the button
    whileTap={{ scale: 0.95 }} // Shrink slightly on click
    transition={{ type: "spring", stiffness: 400, damping: 17 }} // Springy effect
    className="w-full" // Ensure it takes full width
  >
    <Button
      asChild
      className="w-full bg-gradient-teal hover:opacity-90 text-white font-semibold"
    >
      <Link to={`/registry/project/${project.id.toString()}`} >
        View Details & Purchase
      </Link>
    </Button>
  </motion.div>
</CardFooter>
      </Card>
    </motion.div>
  );
};

// --- Main TradingPlatform Component ---
export default function TradingPlatform() {
  const [filters, setFilters] = useState<FilterState>({
  locationSearch: '', // Initialize as empty string for input
  ecosystemSearch: '', // Initialize as empty string for input
  sortBy: 'newest'
});
  const [projectsForSale, setProjectsForSale] = useState<ProjectForSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const publicClient = usePublicClient(); // Get the public client for direct contract calls

  // --- Fetch all projects from the main registry ---
  const { 
    data: allProjectsRaw, 
    isLoading: isLoadingAllProjects, 
    error: allProjectsError 
  } = useReadContract({
    address: registryAddress,
    abi: registryAbi,
    functionName: 'getAllProjects',
    query: {
      staleTime: 10_000, // Refetch every 10 seconds to keep marketplace fresh
    }
  });

  // --- Helper functions for fetching contract data ---
  // Using publicClient for direct calls within useEffect for dynamic fetches
  const fetchListingIdForProject = useCallback(async (projectId: bigint): Promise<bigint | undefined> => {
    if (!publicClient) return undefined;
    try {
      const response = await publicClient.readContract({
        address: marketplaceAddress,
        abi: marketplaceAbi,
        functionName: 'activeListingIdForProject',
        args: [projectId],
      });
      return response as bigint;
    } catch (e) {
      console.error(`Failed to fetch listing ID for project ${projectId}:`, e);
      return undefined;
    }
  }, [publicClient]);

  const fetchListingDetails = useCallback(async (listingId: bigint): Promise<ListingFromMarketplace | undefined> => {
    if (!publicClient) return undefined;
    try {
      const response = await publicClient.readContract({
        address: marketplaceAddress,
        abi: marketplaceAbi,
        functionName: 'listings',
        args: [listingId],
      });
      return response as ListingFromMarketplace;
    } catch (e) {
      console.error(`Failed to fetch listing details for listing ${listingId}:`, e);
      return undefined;
    }
  }, [publicClient]);

  // --- IPFS Metadata Fetcher ---
// --- IPFS Metadata Fetcher ---
const fetchMetadata = async (metadataHash: string) => {
  if (!metadataHash) return null;

  try {
    const cleanedMetadataHash = metadataHash.replace('ipfs://', '');
    const metadataIpfsUrl = `https://ipfs.io/ipfs/${cleanedMetadataHash}`;

    const response = await fetch(metadataIpfsUrl);
    if (!response.ok) {
        // Log the problematic URL for debugging
        console.error(`HTTP error! status: ${response.status} for metadata URL: ${metadataIpfsUrl}`);
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const metadata = await response.json();

    if (metadata && typeof metadata === 'object' && metadata.image) {
      let imageUrl = metadata.image;

      // Ensure imageUrl is a string
      if (typeof imageUrl !== 'string') {
        console.warn(`Metadata image field is not a string for hash: ${metadataHash}`, imageUrl);
        return { ...metadata, image: genericProjectImage }; // Fallback
      }

      // If image is just a bare CID, prepend gateway
      if (imageUrl.startsWith('Qm') || imageUrl.startsWith('b')) { // 'b' for base32 CIDs
        imageUrl = `https://ipfs.io/ipfs/${imageUrl}`;
      } 
      // If it's ipfs://, convert to gateway URL
      else if (imageUrl.startsWith('ipfs://')) {
        imageUrl = `https://ipfs.io/ipfs/${imageUrl.replace('ipfs://', '')}`;
      }
      // If it's a relative path (e.g., './image.jpg'), combine with base metadata CID
      // This assumes the metadataHash points to a directory containing both metadata.json and the image
      else if (imageUrl.startsWith('./') && cleanedMetadataHash.length > 0) {
        imageUrl = `${metadataIpfsUrl}/${imageUrl.substring(2)}`;
      }
      // Otherwise, assume it's already a full HTTP/HTTPS URL or a local asset that will be handled by the client.

      return { ...metadata, image: imageUrl }; // Return metadata with resolved image URL
    }
    return metadata; // No image field or other issue, return raw metadata
  } catch (e: any) {
    console.error(`Failed to fetch or process metadata for hash ${metadataHash}:`, e.message || e);
    return null;
  }
};

  // --- Effect hook to fetch and process marketplace data ---
  useEffect(() => {
    const fetchMarketplaceData = async () => {
      setIsLoading(true);
      setError(null);

      if (allProjectsError) {
        setError(`Failed to load projects from registry: ${allProjectsError.message}`);
        setIsLoading(false);
        return;
      }
      if (!allProjectsRaw) {
        setIsLoading(false); // No projects yet or still loading
        return;
      }

      const projectsFromRegistry = allProjectsRaw as ProjectFromRegistry[];
      const listedProjects: ProjectForSale[] = [];

      for (const project of projectsFromRegistry) {
        const projectId = project.id;
        const projectMetadataHash = project.metadataHash;

        try {
          const listingId = await fetchListingIdForProject(projectId);

          if (listingId && listingId > 0n) {
            const listingDetails = await fetchListingDetails(listingId);

            if (listingDetails && listingDetails[5]) { // listingDetails[5] is 'active' status
              const metadata = await fetchMetadata(projectMetadataHash);

              listedProjects.push({
                id: projectId,
                name: project.name,
                location: project.location,
                imageURL: metadata?.image || genericProjectImage, // From metadata or fallback
                availableQuantity: listingDetails[3],
                pricePerCredit: listingDetails[4],
                ecosystem: metadata?.ecosystem || 'Other', // From metadata or fallback
              });
            }
          }
        } catch (err: any) {
          console.error(`Error processing project ${projectId}:`, err);
          // If a single project fails, we don't want to stop the whole page
          // Consider adding a subtle error indicator for individual cards if necessary
        }
      }
      setProjectsForSale(listedProjects);
      setIsLoading(false);
    };

    if (!isLoadingAllProjects && publicClient) { // Only fetch if registry projects are loaded and client is ready
      fetchMarketplaceData();
    }
  }, [allProjectsRaw, isLoadingAllProjects, allProjectsError, fetchListingIdForProject, fetchListingDetails, publicClient]);

  // --- Filtering and Sorting Logic ---
  const filteredAndSortedProjects = useMemo(() => {
    let currentProjects = [...projectsForSale];

    if (filters.locationSearch.trim() !== '') {
      const searchTerm = filters.locationSearch.toLowerCase();
      currentProjects = currentProjects.filter(project => 
        project.location.toLowerCase().includes(searchTerm)
      );
    }
    if (filters.ecosystemSearch.trim() !== '') {
      const searchTerm = filters.ecosystemSearch.toLowerCase();
      currentProjects = currentProjects.filter(project => 
        project.ecosystem.toLowerCase().includes(searchTerm)
      );
    }

    switch (filters.sortBy) {
      case 'price-low':
        currentProjects.sort((a, b) => Number(a.pricePerCredit - b.pricePerCredit));
        break;
      case 'price-high':
        currentProjects.sort((a, b) => Number(b.pricePerCredit - a.pricePerCredit));
        break;
      case 'quantity-high':
        currentProjects.sort((a, b) => Number(b.availableQuantity - a.availableQuantity));
        break;
      case 'newest':
      default:
        currentProjects.sort((a, b) => Number(b.id - a.id)); // Sort by ID descending for newest
        break;
    }
    return currentProjects;
  }, [filters, projectsForSale]);

  // --- Dynamic Stats Calculation ---
  const dynamicStats = useMemo(() => {
    const totalTonnes = projectsForSale.reduce((sum, project) => sum + project.availableQuantity, 0n);
    const totalValue = projectsForSale.reduce((sum, project) => sum + (project.pricePerCredit * project.availableQuantity), 0n);
    
    // Placeholder for total retired tonnes - this would need another contract call or external data
    const totalTonnesRetired = '847,532'; // Static for now, replace with dynamic data later

    const avgPriceBigInt = totalTonnes > 0n ? totalValue / totalTonnes : 0n;
    const averagePrice = `$${formatUnits(avgPriceBigInt, 6)}`;

    return {
      totalTonnesListed: totalTonnes.toLocaleString(),
      totalTonnesRetired: totalTonnesRetired,
      verifiedProjects: projectsForSale.length.toString(),
      averagePrice: averagePrice
    };
  }, [projectsForSale]);



// ... inside your TradingPlatform component function ...

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div
        className="relative bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${mangroveHero})` }}
      >
        <div className="absolute inset-0 bg-gradient-ocean opacity-80"></div>
        <div className="relative z-10 py-16">
          <div className="container mx-auto px-4">
            {/* Simplified Hero Text Animation */}
            <motion.div
              className="text-center text-white mb-12"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.2, delayChildren: 0.1 }
                }
              }}
            >
              <motion.h1
                className="text-4xl md:text-6xl font-bold mb-4"
                variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
              >
                Blue Carbon Marketplace
              </motion.h1>
              <motion.p
                className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto"
                variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
              >
                Discover and invest in verified blue carbon credit projects protecting our ocean ecosystems.
              </motion.p>
            </motion.div>

            {/* Stats Section with CometCard Effect */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" // Changed to 3 columns for better spacing
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
              }}
              initial="hidden"
              animate="visible"
            >
              {/* ✅ Mapped over stats and wrapped each Card with CometCard */}
              {[
                { icon: TrendingUp, value: dynamicStats.totalTonnesListed, label: "Tonnes Listed" },
                { icon: Leaf, value: dynamicStats.verifiedProjects, label: "Verified Projects" },
                { icon: DollarSign, value: dynamicStats.averagePrice, label: "Average / Tonne" }
              ].map((stat, i) => (
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} key={i}>
                  <CometCard className="transform-3d w-full">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white shadow-elevated w-full">
                      <CardContent className="p-6 text-center">
                        <stat.icon className="h-8 w-8 mx-auto mb-2 text-accent" />
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-sm opacity-80">{stat.label}</div>
                      </CardContent>
                    </Card>
                  </CometCard>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          className="bg-white rounded-xl shadow-card p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-2xl font-semibold mb-6 text-ocean-primary">Filter & Sort Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="location-search" className="block text-sm font-medium mb-2 text-ocean-primary">Location Search</label>
              <Input
                id="location-search"
                type="text"
                placeholder="e.g., Sundarbans, Florida"
                value={filters.locationSearch}
                onChange={(e) => setFilters(prev => ({ ...prev, locationSearch: e.target.value }))}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="ecosystem-search" className="block text-sm font-medium mb-2 text-ocean-primary">Ecosystem Search</label>
              <Input
                id="ecosystem-search"
                type="text"
                placeholder="e.g., Mangrove, Seagrass"
                value={filters.ecosystemSearch}
                onChange={(e) => setFilters(prev => ({ ...prev, ecosystemSearch: e.target.value }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-ocean-primary">Sort By</label>
              <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Newest Listed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest Listed</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="quantity-high">Largest Quantity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Projects Grid */}
        {isLoading ? (
          // ✅ THIS IS THE SECTION TO UPDATE
          <div className="flex justify-center items-center h-64 flex-col text-center py-12 text-ocean-primary">
            <LoaderThree /> {/* Replaced Loader2 with LoaderThree */}
            <p className="mt-4 text-lg">Loading carbon credit projects...</p> {/* Adjusted margin-top */}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600 bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center">
            <Info className="h-12 w-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Error Loading Marketplace</h3>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-muted-foreground mt-2">Please try refreshing the page or check your network connection.</p>
          </div>
        ) : filteredAndSortedProjects.length === 0 ? (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Waves className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold text-ocean-primary mb-2">No Projects Found</h3>
            <p className="text-muted-foreground">Try adjusting your filters to see more projects.</p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
            }}
            initial="hidden"
            animate="visible"
          >
            {filteredAndSortedProjects.map((project, index) => (
              <ProjectCard key={project.id.toString()} project={project} index={index} />
            ))}
          </motion.div>
        )}
      </div>
      <div className="w-full dark:bg-black bg-white dark:bg-grid-white/[0.2] bg-grid-black/[0.2] relative">
        <MacbookScroll
          title={
            <div className="text-center">
              <h2 className="text-3xl md:text-5xl font-bold">
                Fully Transparent & On-Chain
              </h2>
              <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
                Every project, every credit, and every transaction is recorded on the blockchain,
                providing an immutable ledger of climate action.
              </p>
            </div>
          }
          badge={
            <Badge className="h-10 w-10 bg-primary/80 backdrop-blur-sm border-primary-foreground/20 text-primary-foreground">
              <Leaf className="h-6 w-6" />
            </Badge>
          }
          src={insightsScreenshot}
          showGradient={true}
        />
      </div>

      {/* ✅ FIX: Empty space div to provide "scroll runway" for the animation to finish */}
      <div className="h-[50vh] w-full" />
    </div>
  );
}