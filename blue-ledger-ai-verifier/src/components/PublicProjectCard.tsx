// src/components/PublicProjectCard.tsx
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectMetadata } from '@/hooks/useProjectMetadata';
import { MapPin, ArrowRight } from "lucide-react";

// Import the 3D Card components
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card'; // Make sure this path is correct

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
    <motion.div variants={cardVariants} className="h-full w-full">
      <Link to={`/registry/project/${project.id.toString()}`} className="block group h-full w-full">
        {/*
          CRITICAL CHANGE:
          - Set containerClassName on CardContainer to eliminate default py-20.
          - Ensure the CardContainer fills its parent (which is the Link/motion.div).
        */}
        <CardContainer containerClassName="h-full w-full !py-0" className="h-full w-full inter-var">
          <CardBody className="h-full w-full relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] rounded-xl p-0 border">
            <CardItem translateZ={0} className="h-full w-full">
              <Card className="shadow-lg hover:shadow-primary/20 transition-all duration-300 h-full flex flex-col border-transparent hover:border-primary p-0">
                <CardHeader className="p-4 md:p-6">
                  <CardItem translateZ={50}>
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
                  </CardItem>
                  <CardItem translateZ={40}>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{project.name}</CardTitle>
                  </CardItem>
                  <CardItem translateZ={30}>
                    <CardDescription className="flex items-center gap-2 pt-1">
                      <MapPin className="h-4 w-4" /> {project.location}
                    </CardDescription>
                  </CardItem>
                </CardHeader>

                <CardContent className="flex-grow p-4 md:p-6 pt-0" />

                <CardFooter className="flex justify-between items-center bg-muted/50 p-4 md:p-6">
                  <CardItem translateZ={30}>
                    <div>
                      <p className="text-xs text-muted-foreground">Credits Issued</p>
                      <p className="font-bold text-lg">{project.creditsMinted.toString()} BLC</p>
                    </div>
                  </CardItem>
                  <CardItem translateZ={30}>
                    <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      View Story <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardItem>
                </CardFooter>
              </Card>
            </CardItem>
          </CardBody>
        </CardContainer>
      </Link>
    </motion.div>
  );
}