import { useAccount, useReadContract, usePublicClient } from "wagmi";
import { contractAddress, contractAbi } from "@/contracts/contractConfig";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Info, Download } from "lucide-react";
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ProjectReportPDF } from '@/components/ProjectReportPDF';
import axios from "axios";
import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { DirectionAwareHover } from "@/components/ui/direction-aware-hover";
import genericProjectImage from '@/assets/generic-project.jpg';
import { Globe as CobeGlobe, GLOBE_CONFIG } from "@/components/ui/Globe";

// This interface now includes coordinates for the map
interface ReportProjectData {
  id: bigint;
  name: string;
  location: string;
  metadataHash: string;
  owner: `0x${string}`;
  status: number;
  creditsMinted: bigint;
  registrationTimestamp: bigint;
  imageUrl?: string;
  coordinates?: { lat: number; lng: number };
}

export default function ReportsPage() {
  const { address: connectedAddress, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [reportData, setReportData] = useState<any>(null);
  const [generatingId, setGeneratingId] = useState<bigint | null>(null);
  const [myProjects, setMyProjects] = useState<ReportProjectData[]>([]);

  const { data: allProjects, isLoading } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getAllProjects',
    query: { enabled: isConnected },
  });

  useEffect(() => {
    const fetchMetadataForProjects = async () => {
      if (!allProjects) return;
      
      const userProjects = (allProjects as unknown as ReportProjectData[]).filter(
        p => p.owner.toLowerCase() === connectedAddress?.toLowerCase()
      );
      
      const projectsWithDetails = await Promise.all(
        userProjects.map(async (project) => {
          try {
            const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${project.metadataHash}`);
            const metadata = response.data;
            let imageUrl = metadata.image || genericProjectImage;
            if (imageUrl.startsWith('ipfs://')) {
              imageUrl = `https://gateway.pinata.cloud/ipfs/${imageUrl.replace('ipfs://', '')}`;
            } else if (imageUrl.startsWith('Qm')) {
              imageUrl = `https://gateway.pinata.cloud/ipfs/${imageUrl}`;
            }
            return { ...project, imageUrl, coordinates: metadata.coordinates };
          } catch (e) {
            console.error(`Failed to fetch metadata for project ${project.id}:`, e);
            return { ...project, imageUrl: genericProjectImage, coordinates: undefined };
          }
        })
      );
      setMyProjects(projectsWithDetails);
    };

    if (allProjects && connectedAddress) {
        fetchMetadataForProjects();
    }
  }, [allProjects, connectedAddress]);

  const globeMarkers = useMemo(() => {
    return myProjects
      .filter(p => p.coordinates)
      .map(project => ({
        location: [project.coordinates!.lat, project.coordinates!.lng] as [number, number],
        size: 0.05,
      }));
  }, [myProjects]);

  const globeConfig = {
    ...GLOBE_CONFIG,
    markerColor: [34 / 255, 197 / 255, 94 / 255] as [number, number, number],
    glowColor: [0.5, 0.5, 0.5] as [number, number, number],
    markers: globeMarkers,
  };

  const prepareReportData = async (project: ReportProjectData) => {
    if (!publicClient) {
      toast.error("Network client not ready. Please try again or refresh the page.");
      return;
    }
    const toastId = `report-${project.id}`;
    setGeneratingId(project.id);
    toast.info("Generating report... Please wait.", { id: toastId });
    setReportData(null);

    try {
      const mrvHistory = await publicClient.readContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'getMRVDataForProject',
        args: [project.id],
      });

      const metadataResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${project.metadataHash}`);
      const metadata = { ...metadataResponse.data, image: project.imageUrl };

      setReportData({ project, mrvHistory, metadata });
      toast.success("Report is ready for download!", { id: toastId });
    } catch (e: any) {
      toast.error("Failed to generate report.", { id: toastId, description: e.message });
      console.error("Report generation failed:", e);
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Project Reports</h1>
        <p className="text-muted-foreground">Generate and download comprehensive PDF reports for your projects.</p>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && myProjects.length === 0 && (
        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
          <Info className="mx-auto h-8 w-8 mb-4" />
          <h2 className="text-xl font-semibold">No Projects Found</h2>
          <p>You have not registered any projects yet.</p>
        </div>
      )}
      
      {!isLoading && myProjects.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {myProjects.map((project) => (
              <Card key={project.id.toString()} className="flex flex-col justify-between p-0 overflow-hidden">
                <DirectionAwareHover imageUrl={project.imageUrl || genericProjectImage} className="w-full aspect-video">
                  <div className="flex flex-col">
                      <h3 className="font-bold text-xl">{project.name}</h3>
                      <p className="font-normal text-sm">{project.location}</p>
                  </div>
                </DirectionAwareHover>
                <CardContent className="pt-4 flex-grow">
                   <p className="text-sm text-muted-foreground">Project ID: {project.id.toString()}</p>
                </CardContent>
                <CardFooter>
                  {reportData && reportData.project.id === project.id ? (
                   <PDFDownloadLink
                     document={<ProjectReportPDF {...reportData} />}
                     fileName={`BlueLedger_Report_${project.name.replace(/\s+/g, '_')}.pdf`}
                   >
                     {({ loading }) => (
                       <Button className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                         {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                         Download Now
                       </Button>
                     )}
                   </PDFDownloadLink>
                 ) : (
                   <Button 
                     className="w-full" 
                     onClick={() => prepareReportData(project)}
                     disabled={generatingId !== null}
                   >
                     {generatingId === project.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                     Generate Report
                   </Button>
                 )}
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-20 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Global Operations 
              </h2>
              <p className="text-base md:text-lg font-normal text-muted-foreground mt-4 mb-8 max-w-2xl mx-auto">
                  🌱 Restoring Blue Carbon Ecosystems Worldwide
              </p>
          </div>
          <div className="relative flex h-[600px] w-full items-center justify-center overflow-hidden rounded-lg bg-slate-900 border shadow-lg dark:bg-black">
              <CobeGlobe config={globeConfig} />
              <div className="absolute w-full bottom-0 inset-x-0 h-40 bg-gradient-to-t from-slate-900 to-transparent z-40 dark:from-black" />
          </div>
        </>
      )}
    </div>
  );
}

