
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Tag, X } from "lucide-react";
import { CostFilters } from "@/types/cost";
import { supabase } from "@/lib/supabase";

interface TagFilterProps {
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

interface TagOption {
  name: string;
  count: number;
}

export function TagFilter({ filters, onFiltersChange }: TagFilterProps) {
  const [open, setOpen] = useState(false);
  const [tagOptions, setTagOptions] = useState<TagOption[]>([]);

  useEffect(() => {
    async function loadTags() {
      const { data, error } = await supabase
        .from("cost_tags")
        .select(`
          name,
          costs_tags (
            cost_id
          )
        `);

      if (error) {
        console.error("Erro ao carregar tags:", error);
        return;
      }

      // Transforma os dados para contar as ocorrências de cada tag
      const tags = (data || []).map(tag => ({
        name: tag.name,
        count: Array.isArray(tag.costs_tags) ? tag.costs_tags.length : 0
      }))
      .sort((a, b) => b.count - a.count);

      setTagOptions(tags);
    }

    loadTags();
  }, []);

  const toggleTag = (tagName: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tagName)
      ? currentTags.filter(t => t !== tagName)
      : [...currentTags, tagName];
    
    onFiltersChange({
      ...filters,
      tags: newTags.length > 0 ? newTags : undefined
    });
  };

  const removeTag = (tagName: string) => {
    const newTags = (filters.tags || []).filter(t => t !== tagName);
    onFiltersChange({
      ...filters,
      tags: newTags.length > 0 ? newTags : undefined
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-10 border-dashed"
          >
            <Tag className="mr-2 h-4 w-4" />
            Filtrar por Tags
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar tag..." />
            <CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>
            <CommandGroup>
              {tagOptions.map((tag) => (
                <CommandItem
                  key={tag.name}
                  value={tag.name}
                  onSelect={() => toggleTag(tag.name)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{tag.name}</span>
                    <span className="text-sm text-gray-500">{tag.count}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {filters.tags?.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="flex items-center gap-1"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="hover:bg-gray-200 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
