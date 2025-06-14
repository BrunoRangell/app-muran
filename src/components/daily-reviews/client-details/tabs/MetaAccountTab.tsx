
import { ClientMetaAccountSettings } from "../../ClientMetaAccountSettings";

interface MetaAccountTabProps {
  clientId: string;
  clientName: string;
  metaAccountId?: string;
}

export const MetaAccountTab = ({ clientId, clientName, metaAccountId }: MetaAccountTabProps) => {
  return (
    <div className="space-y-4">
      <ClientMetaAccountSettings
        clientId={clientId}
        clientName={clientName}
        metaAccountId={metaAccountId}
      />
    </div>
  );
};
