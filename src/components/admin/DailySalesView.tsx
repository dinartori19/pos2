import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, DollarSign, ShoppingCart } from 'lucide-react';
import { useDailySales, useMonthlySales } from '@/hooks/useDailySales';
import DailySalesChart from './DailySalesChart';

const DailySalesView = () => {
  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  // State for selected date
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  // Get daily sales for selected date
  const { sales: dailySales, loading: dailyLoading } = useDailySales(selectedDate);
  
  // Get monthly sales for chart
  const { sales: monthlySales, loading: monthlyLoading } = useMonthlySales(
    currentMonth.year,
    currentMonth.month
  );

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
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
  };

  // Format month for display
  const formatMonth = (year: number, month: number) => {
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      } else {
        return { year: prev.year, month: prev.month - 1 };
      }
    });
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      } else {
        return { year: prev.year, month: prev.month + 1 };
      }
    });
  };

  // Navigate to previous day
  const goToPreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  // Navigate to next day
  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  // Go to today
  const goToToday = () => {
    const today = getCurrentDate();
    setSelectedDate(today);
    
    const now = new Date();
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() + 1 });
  };

  return (
    <div className="space-y-6">
      {/* Daily Sales Summary */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Omzet Harian
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={goToPreviousDay}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
              <Button variant="outline" size="sm" onClick={goToNextDay}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hari Ini
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dailyLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Memuat data penjualan...</span>
            </div>
          ) : (
            <div>
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-700">
                  {formatDate(selectedDate)}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-medium text-blue-800">Total Omzet</h4>
                    <DollarSign className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold text-blue-700">
                    {dailySales ? formatCurrency(dailySales.totalSales) : formatCurrency(0)}
                  </div>
                  {dailySales && (
                    <p className="text-sm text-blue-600 mt-2">
                      Terakhir diperbarui: {new Date(dailySales.updatedAt).toLocaleTimeString('ja-JP')}
                    </p>
                  )}
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg border border-green-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-medium text-green-800">Jumlah Transaksi</h4>
                    <ShoppingCart className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="text-3xl font-bold text-green-700">
                    {dailySales ? dailySales.transactionCount : 0}
                  </div>
                  <p className="text-sm text-green-600 mt-2">
                    {dailySales && dailySales.transactionCount > 0 
                      ? `Rata-rata: ${formatCurrency(dailySales.totalSales / dailySales.transactionCount)} per transaksi`
                      : 'Belum ada transaksi'}
                  </p>
                </div>
              </div>
              
              {!dailySales && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-yellow-700 text-sm">
                    Belum ada data penjualan untuk tanggal ini. Data akan muncul setelah ada transaksi.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Sales Chart */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Grafik Penjualan: {formatMonth(currentMonth.year, currentMonth.month)}
          </h3>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Bulan Ini
            </Button>
          </div>
        </div>
        
        <DailySalesChart 
          sales={monthlySales} 
          isLoading={monthlyLoading} 
        />
      </div>
    </div>
  );
};

export default DailySalesView;