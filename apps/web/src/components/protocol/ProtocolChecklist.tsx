import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface ProtocolChecklistProps {
  items: string[];
  title?: string;
  checkedIndices?: number[];
  onProgressChange?: (indices: number[]) => void;
}

export default function ProtocolChecklist({ 
  items, 
  checkedIndices = [],
  onProgressChange
}: ProtocolChecklistProps) {
  if (!items || items.length === 0) return null;

  const checkedSet = new Set(checkedIndices);

  const toggleItem = (index: number) => {
    const newSet = new Set(checkedSet);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    const newIndices = Array.from(newSet).sort((a, b) => a - b);
    onProgressChange?.(newIndices);
  };

  const progress = (checkedSet.size / items.length) * 100;
  const allComplete = checkedSet.size === items.length;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300",
              allComplete ? "bg-success" : "bg-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {checkedSet.size}/{items.length}
        </span>
        {allComplete && (
          <CheckCircle2 className="w-5 h-5 text-success" />
        )}
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {items.map((item, index) => {
          const isChecked = checkedSet.has(index);
          return (
            <label
              key={index}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                isChecked
                  ? "bg-success/10 border border-success/20"
                  : "bg-muted/30 hover:bg-muted/50 border border-transparent"
              )}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => toggleItem(index)}
                className="mt-0.5"
              />
              <span
                className={cn(
                  "text-sm flex-1",
                  isChecked && "line-through text-muted-foreground"
                )}
              >
                {item}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
