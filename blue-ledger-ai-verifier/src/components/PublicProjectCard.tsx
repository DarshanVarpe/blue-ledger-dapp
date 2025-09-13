// src/components/PublicProjectCard.tsx
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectMetadata } from '@/hooks/useProjectMetadata';
import { MapPin, ArrowRight } from "lucide-react";

type Project = {
  id: bigint;
  name: string;
  location: string;
  metadataHash: string;
  creditsMinted: bigint;
};

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function PublicProjectCard({ project }: { project: Project }) {
  const { metadata, isLoading } = useProjectMetadata(project.metadataHash);

  return (
    <motion.div variants={cardVariants}>
      <Link to={`/registry/project/${project.id.toString()}`} className="block group h-full">
        {/* ✅ FIX 1: Make the card a vertical flex container */}
        <Card className="shadow-lg hover:shadow-primary/20 transition-all duration-300 h-full flex flex-col border-transparent hover:border-primary">
          <CardHeader>
            <div className="aspect-video w-full overflow-hidden rounded-lg mb-4">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <img 
                  src={metadata?.image || '/placeholder.png'}
                  alt={project.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
            </div>
            <CardTitle className="text-xl group-hover:text-primary transition-colors">{project.name}</CardTitle>
            <CardDescription className="flex items-center gap-2 pt-1">
              <MapPin className="h-4 w-4" /> {project.location}
            </CardDescription>
          </CardHeader>
          
          {/* ✅ FIX 2: Allow this content area to grow and push the footer down */}
          <CardContent className="flex-grow" />
          
          <CardFooter className="flex justify-between items-center bg-muted/50 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Credits Issued</p>
              <p className="font-bold text-lg">{project.creditsMinted.toString()} BLC</p>
            </div>
            <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              View Story <ArrowRight className="h-4 w-4" />
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}