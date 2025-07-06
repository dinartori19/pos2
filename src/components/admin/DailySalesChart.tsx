import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Calendar, RefreshCw } from 'lucide-react';
import { DailySales } from '@/services/dailySalesService';

interface DailySalesChartProps {
  sales: DailySales[];
  isLoading: boolean;
  onRefresh?: () => void;
}

const DailySalesChart = ({ sales, isLoading, onRefresh }: DailySalesChartProps) => {
  const [chartData, setChartData] = useState<any[]>([]);

  // Format currency as Yen
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { 
      month: 'numeric', 
      day: 'numeric' 
    });
  };

  // Prepare chart data
  useEffect(() => {
    if (sales.length > 0) {
      const data = sales.map(sale => ({
        date: formatDate(sale.date),
        sales: sale.totalSales,
        transactions: sale.transactionCount,
        fullDate: sale.date // Keep full date for tooltips
      }));
      setChartData(data);
    } else {
      setChartData([]);
    }
  }, [sales]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="font-medium text-sm">{data.fullDate}</p>
          <p className="text-sm text-blue-600">
            {formatCurrency(data.sales)}
          </p>
          <p className="text-xs text-gray-600">
            {data.transactions} transaksi
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          <CardTitle>Omzet Harian</CardTitle>
        </div>
        {onRefresh && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `¥${value.toLocaleString()}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sales" name="Omzet" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">Belum ada data penjualan</p>
              <p className="text-sm">Data akan muncul setelah ada transaksi</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailySalesChart;