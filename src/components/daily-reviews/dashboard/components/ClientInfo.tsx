
import { Circle } from "lucide-react";

interface ClientInfoProps {
  client: {
    company_name: string;
    status: string;
  };
  accountName?: string;
}

export const ClientInfo = ({ client, accountName }: ClientInfoProps) => {
  return (
    <div className="space-y-1">
      <div className="font-semibold text-lg flex items-center gap-2">
        {client.company_name}
        {client.status === 'active' && (
          <Circle className="w-2 h-2 fill-green-500 text-green-500" />
        )}
      </div>
      {accountName && (
        <div className="text-sm text-gray-500">
          Conta: {accountName}
        </div>
      )}
    </div>
  );
};
