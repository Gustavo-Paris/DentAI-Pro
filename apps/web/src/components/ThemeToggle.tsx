import { usePageShellColorMode } from '@parisgroup-ai/pageshell/theme';
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const modes = ["system", "light", "dark"] as const;
const labels: Record<string, string> = {
  system: "Sistema",
  light: "Claro",
  dark: "Escuro",
};

export function ThemeToggle() {
  const { colorMode, setColorMode } = usePageShellColorMode();

  const theme = colorMode ?? "system";

  const cycle = () => {
    const idx = modes.indexOf(theme as (typeof modes)[number]);
    setColorMode(modes[(idx + 1) % modes.length]);
  };

  const icon =
    theme === "dark" ? (
      <Moon className="w-4 h-4" />
    ) : theme === "light" ? (
      <Sun className="w-4 h-4" />
    ) : (
      <Monitor className="w-4 h-4" />
    );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={cycle}
          aria-label={`Tema: ${labels[theme]}`}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Tema: {labels[theme]}</p>
      </TooltipContent>
    </Tooltip>
  );
}
