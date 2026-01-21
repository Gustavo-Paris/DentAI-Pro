import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface ProtocolChecklistProps {
  items: string[];
  title?: string;
}

export default function ProtocolChecklist({ items, title = "Passo a Passo" }: ProtocolChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  if (!items || items.length === 0) return null;

  const toggleItem = (index: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const progress = (checkedItems.size / items.length) * 100;
  const allComplete = checkedItems.size === items.length;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300",
              allComplete ? "bg-green-500" : "bg-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {checkedItems.size}/{items.length}
        </span>
        {allComplete && (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        )}
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {items.map((item, index) => {
          const isChecked = checkedItems.has(index);
          return (
            <label
              key={index}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                isChecked
                  ? "bg-green-500/10 border border-green-500/20"
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
