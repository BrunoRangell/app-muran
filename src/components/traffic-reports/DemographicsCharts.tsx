import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { formatCurrency, formatNumber } from "@/utils/chartUtils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface DemographicData {
  label: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  cpa: number;
}

interface Demographics {
  byAge: DemographicData[];
  byGender: DemographicData[];
  byLocation: DemographicData[];
}

interface DemographicsChartsProps {
  demographics: Demographics;
  platform: 'meta' | 'google' | 'both';
}

const COLORS = {
  age: ['#ff6e00', '#ff8f3d', '#ffab66', '#ffc78f', '#ffe3b8'],
  gender: ['#4285f4', '#ea4335', '#9e9e9e']
};

export function DemographicsCharts({ demographics, platform }: DemographicsChartsProps) {
  const { byAge, byGender, byLocation } = demographics;

  // Prepare data for charts
  const ageChartData = byAge.slice(0, 5).map(d => ({
    age: d.label,
    conversoes: d.conversions,
    investimento: d.spend
  }));

  const genderChartData = byGender.map(d => ({
    name: d.label === 'male' ? 'Masculino' : d.label === 'female' ? 'Feminino' : 'Não especificado',
    value: d.conversions,
    percentage: 0
  }));

  // Calculate percentages
  const totalGenderConversions = genderChartData.reduce((sum, item) => sum + item.value, 0);
  genderChartData.forEach(item => {
    item.percentage = totalGenderConversions > 0 ? (item.value / totalGenderConversions) * 100 : 0;
  });

  return (
    <div className="space-y-6">
      {/* Age Distribution */}
      <Card className="glass-card card-shadow hover:card-shadow-hover transition-all duration-300">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg muran-gradient">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Distribuição por Idade</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Top 5 faixas etárias por conversões</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="age" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  background: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem'
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'investimento') return [formatCurrency(value), 'Investimento'];
                  return [formatNumber(value), 'Conversões'];
                }}
              />
              <Bar dataKey="conversoes" fill="hsl(var(--muran-primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <Card className="glass-card card-shadow hover:card-shadow-hover transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg muran-gradient">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Distribuição por Gênero</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Conversões por gênero</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={genderChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.gender[index % COLORS.gender.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatNumber(value), 'Conversões']}
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-2">
              {genderChartData.map((item, index) => {
                const genderData = byGender.find(d => {
                  if (item.name === 'Masculino') return d.label === 'male';
                  if (item.name === 'Feminino') return d.label === 'female';
                  return true;
                });
                
                return (
                  <div key={index} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS.gender[index] }}
                      />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{formatNumber(item.value)} conversões</div>
                      {genderData && (
                        <div className="text-xs text-muted-foreground">
                          CPA: {formatCurrency(genderData.cpa)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Locations */}
        <Card className="glass-card card-shadow hover:card-shadow-hover transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg muran-gradient">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Top 10 Localizações</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Regiões por conversões</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Local</TableHead>
                    <TableHead className="text-right">Conv.</TableHead>
                    <TableHead className="text-right">CPA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byLocation.slice(0, 10).map((location, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          {location.label}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(location.conversions)}
                      </TableCell>
                      <TableCell className="text-right text-muran-primary font-medium">
                        {formatCurrency(location.cpa)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
