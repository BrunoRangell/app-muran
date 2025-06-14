
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Client, mapSupabaseToClient } from "@/types/client";
import { ClientsList } from "@/components/clients/ClientsList";
import { ClientsDialog } from "@/components/clients/components/ClientsDialog";
import { ClientsHeader } from "@/components/clients/components/ClientsHeader";
import { LoadingState } from "@/components/clients/components/LoadingState";
import { ErrorState } from "@/components/clients/components/ErrorState";

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    data: rawClients = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("company_name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Converter dados do Supabase para o tipo Client
  const clients: Client[] = rawClients.map(mapSupabaseToClient);

  const filteredClients = clients.filter((client) =>
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <ClientsHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onNewClient={() => setIsDialogOpen(true)}
        totalClients={clients.length}
        filteredClients={filteredClients.length}
      />

      <ClientsList clients={filteredClients} />

      <ClientsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {
          refetch();
          setIsDialogOpen(false);
        }}
      />
    </div>
  );
}
