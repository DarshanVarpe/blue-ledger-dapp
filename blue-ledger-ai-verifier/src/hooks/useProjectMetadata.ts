// src/hooks/useProjectMetadata.ts
import { useState, useEffect } from 'react';
import axios from 'axios';

interface ProjectMetadata {
  image: string;
  description: string;
  coordinates?: { lat: number; lng: number }; // ✅ ADD THIS LINE
}

export const useProjectMetadata = (metadataHash: string | null) => {
  const [metadata, setMetadata] = useState<ProjectMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!metadataHash) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const url = `https://gateway.pinata.cloud/ipfs/${metadataHash}`;
        const response = await axios.get<ProjectMetadata>(url);
        
        // Construct the full image URL from the hash inside the metadata
        if (response.data.image) {
          response.data.image = `https://gateway.pinata.cloud/ipfs/${response.data.image}`;
        }
        setMetadata(response.data);
      } catch (error) {
        console.error("Failed to fetch project metadata:", error);
        setMetadata(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [metadataHash]);

  return { metadata, isLoading };
};