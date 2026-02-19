import { usePageShellColorMode } from '@parisgroup-ai/pageshell/theme';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const modes = ["system", "light", "dark"] as const;

export function ThemeToggle() {
  const { colorMode, setColorMode } = usePageShellColorMode();
  const { t } = useTranslation();

  const theme = colorMode ?? "system";

  // i18n keys: components.themeToggle.system, .light, .dark, .label
  const labels: Record<string, string> = {
    system: t('components.themeToggle.system', 'Sistema'),
    light: t('components.themeToggle.light', 'Claro'),
    dark: t('components.themeToggle.dark', 'Escuro'),
  };

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

  const themeLabel = t('components.themeToggle.label', 'Tema');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={cycle}
          aria-label={`${themeLabel}: ${labels[theme]}`}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{themeLabel}: {labels[theme]}</p>
      </TooltipContent>
    </Tooltip>
  );
}
