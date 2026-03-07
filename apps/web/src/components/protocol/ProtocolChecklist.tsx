import { cn } from "@/lib/utils";

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
      <div className="glass-panel rounded-xl p-4 flex items-center gap-3">
        <div className="flex-1 h-2 bg-primary/20 rounded-full overflow-hidden">
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
      </div>

      {/* Checklist items */}
      <div className="glass-panel rounded-xl divide-y divide-border/50 overflow-hidden">
        {items.map((item, index) => {
          const isChecked = checkedSet.has(index);
          return (
            <button
              key={`step-${index}`}
              onClick={() => toggleItem(index)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                  isChecked ? "bg-success border-success" : "border-border"
                )}
              >
                {isChecked && (
                  <svg className="w-3 h-3 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={cn("text-sm", isChecked && "line-through text-muted-foreground")}>
                {item}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
