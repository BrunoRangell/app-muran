import { Card } from "@/components/ui/card";
import { TeamMemberForm } from "@/components/admin/TeamMemberForm";
import { ClientForm } from "@/components/admin/ClientForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Admin = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-muran-dark">Acesso Administrativo</h1>
      </div>

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList>
          <TabsTrigger value="team">Integrantes</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="team">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Cadastrar Novo Integrante</h2>
            <TeamMemberForm />
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Cadastrar Novo Cliente</h2>
            <ClientForm />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;