
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BADGE_ICONS } from "../constants/badgeIcons";

interface IconSelectorProps {
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
}

export function IconSelector({ selectedIcon, onSelectIcon }: IconSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Obter categorias únicas
  const categories = Array.from(new Set(BADGE_ICONS.map(icon => icon.category)));
  
  // Filtrar ícones baseado na pesquisa
  const filterIcons = (icons: typeof BADGE_ICONS) => {
    if (!searchTerm) return icons;
    return icons.filter(icon => 
      icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      icon.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">Ícone do Emblema</label>
      
      <Input
        type="search"
        placeholder="Pesquisar emoji..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />

      {searchTerm ? (
        <ScrollArea className="h-[300px]">
          <div className="grid grid-cols-6 gap-2 pr-4">
            {filterIcons(BADGE_ICONS).map(({ icon, name, label }) => (
              <IconButton
                key={name}
                icon={icon}
                name={name}
                label={label}
                isSelected={selectedIcon === name}
                onSelect={onSelectIcon}
              />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <Tabs defaultValue={categories[0]} className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto">
            {categories.map((category) => (
              <TabsTrigger 
                key={category} 
                value={category}
                className="flex-1"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <ScrollArea className="h-[300px]">
                <div className="grid grid-cols-6 gap-2 pr-4">
                  {BADGE_ICONS
                    .filter(icon => icon.category === category)
                    .map(({ icon, name, label }) => (
                      <IconButton
                        key={name}
                        icon={icon}
                        name={name}
                        label={label}
                        isSelected={selectedIcon === name}
                        onSelect={onSelectIcon}
                      />
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}

interface IconButtonProps {
  icon: string;
  name: string;
  label: string;
  isSelected: boolean;
  onSelect: (name: string) => void;
}

function IconButton({ icon, name, label, isSelected, onSelect }: IconButtonProps) {
  return (
    <Button
      type="button"
      variant={isSelected ? "default" : "outline"}
      className={`w-full aspect-square flex-col gap-1 group transition-all duration-300 ${
        isSelected 
          ? 'bg-muran-primary hover:bg-muran-primary/90' 
          : 'hover:bg-muran-primary/10 hover:border-muran-primary'
      }`}
      onClick={() => onSelect(name)}
      title={label}
    >
      <span 
        className={`text-2xl transition-all duration-300 ${
          isSelected 
            ? '' 
            : 'group-hover:scale-110'
        }`} 
        role="img" 
        aria-label={label}
      >
        {icon}
      </span>
    </Button>
  );
}

