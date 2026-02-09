import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, BookOpen, Play, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function HelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-20 right-4 z-40 lg:bottom-6 lg:right-6 h-12 w-12 rounded-full shadow-lg bg-background/95 backdrop-blur-sm border-border hover:border-primary/50 hover:shadow-xl transition-all duration-200"
          aria-label="Ajuda"
        >
          <HelpCircle className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-56 p-2">
        <nav className="space-y-1">
          <Link
            to="/new-case?sample=true"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-accent transition-colors"
          >
            <Play className="w-4 h-4 text-primary" />
            Ver caso exemplo
          </Link>
          <Link
            to="/#how-it-works"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-accent transition-colors"
          >
            <BookOpen className="w-4 h-4 text-primary" />
            Como funciona
          </Link>
          <a
            href="mailto:suporte@auria.com.br?subject=Relato de problema"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-accent transition-colors"
          >
            <Bug className="w-4 h-4 text-muted-foreground" />
            Relatar problema
          </a>
        </nav>
      </PopoverContent>
    </Popover>
  );
}
