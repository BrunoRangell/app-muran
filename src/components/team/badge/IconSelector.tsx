
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BADGE_ICONS } from "../constants/badgeIcons";
import { BADGE_CATEGORIES } from "./icon-selector/categories";
import { SearchResults } from "./icon-selector/SearchResults";
import { CategoryTab } from "./icon-selector/CategoryTab";

interface IconSelectorProps {
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
}

export function IconSelector({ selectedIcon, onSelectIcon }: IconSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filterIcons = () => {
    if (!searchTerm) return [];
    return BADGE_ICONS.filter(icon => 
      icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      icon.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredIcons = filterIcons();

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
        <SearchResults 
          icons={filteredIcons}
          selectedIcon={selectedIcon}
          onSelectIcon={onSelectIcon}
        />
      ) : (
        <Tabs defaultValue={BADGE_CATEGORIES[0]} className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto">
            {BADGE_CATEGORIES.map((category) => (
              <TabsTrigger 
                key={category} 
                value={category}
                className="flex-1"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {BADGE_CATEGORIES.map((category) => (
            <CategoryTab
              key={category}
              category={category}
              icons={BADGE_ICONS}
              selectedIcon={selectedIcon}
              onSelectIcon={onSelectIcon}
            />
          ))}
        </Tabs>
      )}
    </div>
  );
}
