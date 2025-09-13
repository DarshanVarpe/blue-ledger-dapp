import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Calendar, FileText, Shield, Award } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimelineEvent {
  id: number
  title: string
  description: string
  date: string
  type: "registration" | "data_submission" | "verification" | "credits_minted"
  hash: string
}

interface TimelineProps {
  events: TimelineEvent[]
}

const eventStyles = {
  registration: {
    icon: FileText,
    color: "bg-accent text-accent-foreground",
    lineColor: "border-accent"
  },
  data_submission: {
    icon: Calendar,
    color: "bg-primary text-primary-foreground", 
    lineColor: "border-primary"
  },
  verification: {
    icon: Shield,
    color: "bg-warning text-warning-foreground",
    lineColor: "border-warning"
  },
  credits_minted: {
    icon: Award,
    color: "bg-success text-success-foreground",
    lineColor: "border-success"
  }
}

export function Timeline({ events }: TimelineProps) {
  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const style = eventStyles[event.type]
        const Icon = style.icon
        const isLast = index === events.length - 1

        return (
          <div key={event.id} className="relative">
            {/* Timeline Line */}
            {!isLast && (
              <div 
                className={cn(
                  "absolute left-6 top-12 w-0.5 h-16 border-l-2 border-dashed",
                  style.lineColor
                )}
              />
            )}
            
            {/* Event Card */}
            <Card className="ml-12 p-4 shadow-card hover:shadow-gentle transition-shadow">
              {/* Event Icon */}
              <div className={cn(
                "absolute -left-6 top-4 w-12 h-12 rounded-full flex items-center justify-center",
                style.color
              )}>
                <Icon className="h-5 w-5" />
              </div>
              
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {event.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {event.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-4">
                    {new Date(event.date).toLocaleDateString()}
                  </Badge>
                </div>
                
                {/* IPFS Hash */}
                <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      IPFS Hash (Immutable Record)
                    </p>
                    <code className="text-sm font-mono text-foreground break-all">
                      {event.hash}
                    </code>
                  </div>
                  <Button variant="ghost" size="sm" className="ml-3 flex-shrink-0">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )
      })}
    </div>
  )
}