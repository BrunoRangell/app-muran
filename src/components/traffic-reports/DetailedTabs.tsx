import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CampaignDetail, FunnelData } from "@/types/traffic-report";
import { ConversionFunnel } from "./ConversionFunnel";

interface DetailedTabsProps {
  metaCampaigns: CampaignDetail[];
  googleCampaigns: CampaignDetail[];
  metaFunnel: FunnelData;
  googleFunnel: FunnelData;
}

export const DetailedTabs = ({
  metaCampaigns,
  googleCampaigns,
  metaFunnel,
  googleFunnel,
}: DetailedTabsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <Card className="p-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="meta">Meta Ads</TabsTrigger>
          <TabsTrigger value="google">Google Ads</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-muran-dark">Funil Meta Ads</h3>
              <ConversionFunnel data={metaFunnel} platform="meta" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-muran-dark">Funil Google Ads</h3>
              <ConversionFunnel data={googleFunnel} platform="google" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Investimento Meta</p>
              <p className="text-2xl font-bold text-muran-primary">
                {formatCurrency(metaCampaigns.reduce((sum, c) => sum + c.investment, 0))}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Leads Meta</p>
              <p className="text-2xl font-bold text-muran-primary">
                {metaCampaigns.reduce((sum, c) => sum + c.conversions, 0)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Investimento Google</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(googleCampaigns.reduce((sum, c) => sum + c.investment, 0))}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Leads Google</p>
              <p className="text-2xl font-bold text-blue-600">
                {googleCampaigns.reduce((sum, c) => sum + c.conversions, 0)}
              </p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="meta" className="mt-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-muran-dark">Campanhas Meta Ads</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-muted">Campanha</TableHead>
                    <TableHead className="sticky top-0 bg-muted text-right">Investimento</TableHead>
                    <TableHead className="sticky top-0 bg-muted text-right">Alcance</TableHead>
                    <TableHead className="sticky top-0 bg-muted text-right">Freq.</TableHead>
                    <TableHead className="sticky top-0 bg-muted text-right">CPM</TableHead>
                    <TableHead className="sticky top-0 bg-muted text-right">Cliques</TableHead>
                    <TableHead className="sticky top-0 bg-muted text-right">CTR</TableHead>
                    <TableHead className="sticky top-0 bg-muted text-right">CPC</TableHead>
                    <TableHead className="sticky top-0 bg-muted text-right">Leads</TableHead>
                    <TableHead className="sticky top-0 bg-muted text-right">Custo/Lead</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metaCampaigns.map((campaign, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(campaign.investment)}</TableCell>
                      <TableCell className="text-right">{formatNumber(campaign.reach)}</TableCell>
                      <TableCell className="text-right">{formatNumber(campaign.frequency || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(campaign.cpm || 0)}</TableCell>
                      <TableCell className="text-right">{formatNumber(campaign.clicks)}</TableCell>
                      <TableCell className="text-right">{formatPercent(campaign.ctr)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(campaign.cpc)}</TableCell>
                      <TableCell className="text-right font-semibold">{campaign.conversions}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(campaign.costPerConversion)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <ConversionFunnel data={metaFunnel} platform="meta" />
        </TabsContent>

        <TabsContent value="google" className="mt-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-muran-dark">Campanhas Google Ads</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-muted">Campanha</TableHead>
                    <TableHead className="sticky top-0 bg-muted text-right">Investimento</TableHead>
                    <TableHead className="sticky top-0 bg-muted text-right">Impressões</TableHead>
                    <TableHead className="sticky top-0 bg-muted text-right">Cliques</TableHead>
                    <TableHead className="sticky top-0 bg-muted text-right">CTR</TableHead>
                    <TableHead className="sticky top-0 bg-muted text-right">CPC</TableHead>
                    <TableHead className="sticky top-0 bg-muted text-right">Conversões</TableHead>
                    <TableHead className="sticky top-0 bg-muted text-right">Custo/Conversão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {googleCampaigns.map((campaign, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(campaign.investment)}</TableCell>
                      <TableCell className="text-right">{formatNumber(campaign.impressions || 0)}</TableCell>
                      <TableCell className="text-right">{formatNumber(campaign.clicks)}</TableCell>
                      <TableCell className="text-right">{formatPercent(campaign.ctr)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(campaign.cpc)}</TableCell>
                      <TableCell className="text-right font-semibold">{campaign.conversions}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(campaign.costPerConversion)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <ConversionFunnel data={googleFunnel} platform="google" />
        </TabsContent>
      </Tabs>
    </Card>
  );
};
