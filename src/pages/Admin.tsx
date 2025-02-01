import { Card } from "@/components/ui/card";
import { TeamMemberForm } from "@/components/admin/TeamMemberForm";

const Admin = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-muran-dark">Acesso Administrativo</h1>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Cadastrar Novo Integrante</h2>
        <TeamMemberForm />
      </Card>
    </div>
  );
};

export default Admin;