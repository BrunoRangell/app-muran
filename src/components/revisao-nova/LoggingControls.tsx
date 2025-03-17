
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { configureLogging, configureModuleLogging } from "@/lib/logger";
import { useState } from "react";

export function LoggingControls() {
  const [logLevel, setLogLevel] = useState<string>("info");
  
  const handleSetLogLevel = (level: string) => {
    setLogLevel(level);
    
    switch (level) {
      case "debug":
        configureLogging({ enabled: true, minLevel: "debug" });
        break;
      case "info":
        configureLogging({ enabled: true, minLevel: "info" });
        break;
      case "warn":
        configureLogging({ enabled: true, minLevel: "warn" });
        break;
      case "error":
        configureLogging({ enabled: true, minLevel: "error" });
        break;
      case "none":
        configureLogging({ enabled: false });
        break;
    }
  };
  
  const configureModule = (module: string, enabled: boolean) => {
    configureModuleLogging(module, { enabled });
  };
  
  return (
    <div className="bg-gray-50 p-3 rounded-md mb-4 border border-gray-200">
      <h3 className="text-sm font-medium mb-2">Controle de logs</h3>
      
      <Tabs defaultValue="global" className="w-full">
        <TabsList className="mb-2">
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="modules">Por módulo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="global">
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant={logLevel === "debug" ? "default" : "outline"}
              onClick={() => handleSetLogLevel("debug")}
            >
              Debug
            </Button>
            <Button 
              size="sm" 
              variant={logLevel === "info" ? "default" : "outline"}
              onClick={() => handleSetLogLevel("info")}
            >
              Info
            </Button>
            <Button 
              size="sm" 
              variant={logLevel === "warn" ? "default" : "outline"}
              onClick={() => handleSetLogLevel("warn")}
            >
              Warn
            </Button>
            <Button 
              size="sm" 
              variant={logLevel === "error" ? "default" : "outline"}
              onClick={() => handleSetLogLevel("error")}
            >
              Error
            </Button>
            <Button 
              size="sm" 
              variant={logLevel === "none" ? "default" : "outline"}
              onClick={() => handleSetLogLevel("none")}
            >
              Nenhum
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="modules">
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" onClick={() => configureModule("edge-function", true)}>
              Ativar Edge Function
            </Button>
            <Button size="sm" variant="outline" onClick={() => configureModule("edge-function", false)}>
              Desativar Edge Function
            </Button>
            
            <Button size="sm" variant="outline" onClick={() => configureModule("meta-ads-analysis", true)}>
              Ativar Meta Ads
            </Button>
            <Button size="sm" variant="outline" onClick={() => configureModule("meta-ads-analysis", false)}>
              Desativar Meta Ads
            </Button>
            
            <Button size="sm" variant="outline" onClick={() => configureModule("budget-calculation", true)}>
              Ativar Orçamentos
            </Button>
            <Button size="sm" variant="outline" onClick={() => configureModule("budget-calculation", false)}>
              Desativar Orçamentos
            </Button>
            
            <Button size="sm" variant="outline" onClick={() => configureModule("api-error", true)}>
              Ativar Erros API
            </Button>
            <Button size="sm" variant="outline" onClick={() => configureModule("api-error", false)}>
              Desativar Erros API
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
