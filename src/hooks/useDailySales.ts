import { useState, useEffect } from 'react';
import { getDailySales, getMonthlySales, getRecentDailySales, DailySales } from '@/services/dailySalesService';

/**
 * Hook to get daily sales for a specific date
 * @param date Date string in YYYY-MM-DD format
 */
export const useDailySales = (date: string) => {
  const [sales, setSales] = useState<DailySales | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        const data = await getDailySales(date);
        setSales(data);
      } catch (err) {
        console.error('Error fetching daily sales:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch daily sales'));
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [date]);

  return { sales, loading, error };
};

/**
 * Hook to get daily sales for a month
 * @param year Year (e.g., 2025)
 * @param month Month (1-12)
 */
export const useMonthlySales = (year: number, month: number) => {
  const [sales, setSales] = useState<DailySales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        const data = await getMonthlySales(year, month);
        setSales(data);
      } catch (err) {
        console.error('Error fetching monthly sales:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch monthly sales'));
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [year, month]);

  return { sales, loading, error };
};

/**
 * Hook to get recent daily sales
 * @param limit Number of days to retrieve
 */
export const useRecentDailySales = (limit: number = 7) => {
  const [sales, setSales] = useState<DailySales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        const data = await getRecentDailySales(limit);
        setSales(data);
      } catch (err) {
        console.error('Error fetching recent daily sales:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch recent daily sales'));
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [limit]);

  return { sales, loading, error };
};