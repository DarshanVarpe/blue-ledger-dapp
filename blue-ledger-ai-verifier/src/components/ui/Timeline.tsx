// src/components/ui/Timeline.tsx

import { CheckCircle, FileUp, Award, Rocket } from "lucide-react";

// Define the types of events that can be displayed
type TimelineEvent = {
  id: number;
  title: string;
  description: string;
  date: string;
  type: 'registration' | 'data_submission' | 'verification' | 'credits_minted';
  hash: string;
};

const eventIcons = {
  registration: <Rocket className="h-5 w-5" />,
  data_submission: <FileUp className="h-5 w-5" />,
  verification: <CheckCircle className="h-5 w-5" />,
  credits_minted: <Award className="h-5 w-5" />,
};

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-0 top-0 h-full w-0.5 bg-border" />
      
      <div className="space-y-8">
        {events.map((event) => (
          <div key={event.id} className="relative">
            <div className="absolute -left-[35px] top-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-seafoam">
              <div className="text-accent-strong">{eventIcons[event.type]}</div>
            </div>
            <div className="ml-4">
              <p className="font-semibold text-foreground">{event.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
              <p className="text-xs text-muted-foreground mt-2">{event.date}</p>
              <a 
                href={`https://amoy.polygonscan.com/tx/${event.hash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary/80 hover:underline font-mono mt-1"
              >
                View TX
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}