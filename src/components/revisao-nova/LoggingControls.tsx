
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
    <div className="bg-[#ebebf0] p-4 rounded-md mb-4 border border-[#321e32]/20">
      <h3 className="text-sm font-medium mb-2 text-[#321e32]">Configurações de logs</h3>
      
      <Tabs defaultValue="global" className="w-full">
        <TabsList className="mb-2 bg-white">
          <TabsTrigger value="global" className="data-[state=active]:bg-[#ff6e00] data-[state=active]:text-white">
            Global
          </TabsTrigger>
          <TabsTrigger value="modules" className="data-[state=active]:bg-[#ff6e00] data-[state=active]:text-white">
            Por módulo
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="global">
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant={logLevel === "debug" ? "default" : "outline"}
              onClick={() => handleSetLogLevel("debug")}
              className={logLevel === "debug" ? "bg-[#ff6e00] hover:bg-[#ff8c33]" : "border-[#321e32] text-[#321e32]"}
            >
              Debug
            </Button>
            <Button 
              size="sm" 
              variant={logLevel === "info" ? "default" : "outline"}
              onClick={() => handleSetLogLevel("info")}
              className={logLevel === "info" ? "bg-[#ff6e00] hover:bg-[#ff8c33]" : "border-[#321e32] text-[#321e32]"}
            >
              Info
            </Button>
            <Button 
              size="sm" 
              variant={logLevel === "warn" ? "default" : "outline"}
              onClick={() => handleSetLogLevel("warn")}
              className={logLevel === "warn" ? "bg-[#ff6e00] hover:bg-[#ff8c33]" : "border-[#321e32] text-[#321e32]"}
            >
              Warn
            </Button>
            <Button 
              size="sm" 
              variant={logLevel === "error" ? "default" : "outline"}
              onClick={() => handleSetLogLevel("error")}
              className={logLevel === "error" ? "bg-[#ff6e00] hover:bg-[#ff8c33]" : "border-[#321e32] text-[#321e32]"}
            >
              Error
            </Button>
            <Button 
              size="sm" 
              variant={logLevel === "none" ? "default" : "outline"}
              onClick={() => handleSetLogLevel("none")}
              className={logLevel === "none" ? "bg-[#ff6e00] hover:bg-[#ff8c33]" : "border-[#321e32] text-[#321e32]"}
            >
              Nenhum
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="modules">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => configureModule("edge-function", true)}
              className="border-[#321e32] text-[#321e32] hover:bg-[#ff6e00] hover:text-white"
            >
              Ativar Edge Function
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => configureModule("edge-function", false)}
              className="border-[#321e32] text-[#321e32] hover:bg-[#321e32] hover:text-white"
            >
              Desativar Edge Function
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => configureModule("meta-ads-analysis", true)}
              className="border-[#321e32] text-[#321e32] hover:bg-[#ff6e00] hover:text-white"
            >
              Ativar Meta Ads
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => configureModule("meta-ads-analysis", false)}
              className="border-[#321e32] text-[#321e32] hover:bg-[#321e32] hover:text-white"
            >
              Desativar Meta Ads
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => configureModule("budget-calculation", true)}
              className="border-[#321e32] text-[#321e32] hover:bg-[#ff6e00] hover:text-white"
            >
              Ativar Orçamentos
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => configureModule("budget-calculation", false)}
              className="border-[#321e32] text-[#321e32] hover:bg-[#321e32] hover:text-white"
            >
              Desativar Orçamentos
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => configureModule("api-error", true)}
              className="border-[#321e32] text-[#321e32] hover:bg-[#ff6e00] hover:text-white"
            >
              Ativar Erros API
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => configureModule("api-error", false)}
              className="border-[#321e32] text-[#321e32] hover:bg-[#321e32] hover:text-white"
            >
              Desativar Erros API
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-4 text-xs text-[#321e32]/70">
        <p>Por padrão, apenas erros são mostrados no console em produção.</p>
        <p>Use estes controles para ativar logs adicionais quando precisar diagnosticar problemas.</p>
      </div>
    </div>
  );
}
