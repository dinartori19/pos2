import { collection, doc, getDoc, setDoc, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

// Interface for daily sales data
export interface DailySales {
  date: string; // YYYY-MM-DD format
  totalSales: number;
  transactionCount: number;
  updatedAt: string;
  timestamp?: any; // Firestore Timestamp
}

/**
 * Update daily sales record when a new transaction is processed
 * @param date Date string in YYYY-MM-DD format
 * @param amount Transaction amount
 */
export const updateDailySales = async (date: string, amount: number): Promise<void> => {
  try {
    console.log(`Updating daily sales for ${date} with amount ${amount}`);
    const dailySalesRef = doc(db, 'daily_sales', date);
    
    // Check if record exists
    const docSnapshot = await getDoc(dailySalesRef);
    
    if (docSnapshot.exists()) {
      // Update existing record
      const existingData = docSnapshot.data() as DailySales; 
      await setDoc(dailySalesRef, {
        date,
        totalSales: existingData.totalSales + amount,
        transactionCount: existingData.transactionCount + 1,
        updatedAt: new Date().toISOString(),
        timestamp: Timestamp.now()
      });
      console.log(`Updated existing daily sales record for ${date}`);
    } else {
      // Create new record
      await setDoc(dailySalesRef, {
        date,
        totalSales: amount,
        transactionCount: 1,
        updatedAt: new Date().toISOString(),
        timestamp: Timestamp.now()
      });
      console.log(`Created new daily sales record for ${date}`);
    }
  } catch (error) {
    console.error('Error updating daily sales:', error);
    throw error;
  }
};

/**
 * Get daily sales for a specific date
 * @param date Date string in YYYY-MM-DD format
 */
export const getDailySales = async (date: string): Promise<DailySales | null> => {
  try {
    const dailySalesRef = doc(db, 'daily_sales', date);
    const docSnapshot = await getDoc(dailySalesRef);
    
    if (docSnapshot.exists()) {
      return docSnapshot.data() as DailySales;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting daily sales:', error);
    throw error;
  }
};

/**
 * Get daily sales for a month
 * @param year Year (e.g., 2025)
 * @param month Month (1-12)
 */
export const getMonthlySales = async (year: number, month: number): Promise<DailySales[]> => {
  try {
    // Format month with leading zero if needed
    const monthStr = month.toString().padStart(2, '0');
    
    // Create date prefix for the month (YYYY-MM)
    const datePrefix = `${year}-${monthStr}`;
    
    // Create date objects for start and end of month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month
    
    // Convert to Firestore Timestamp objects
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    // Query daily sales for the month using timestamp if available
    const dailySalesRef = collection(db, 'daily_sales');
    
    // Try to use timestamp for better performance
    let q;
    try {
      q = query(
        dailySalesRef,
        where('timestamp', '>=', startTimestamp),
        where('timestamp', '<=', endTimestamp),
        orderBy('timestamp')
      );
    } catch (err) {
      // Fallback to string-based date if timestamp query fails
      console.log('Falling back to string-based date query');
      q = query(
        dailySalesRef,
        where('date', '>=', `${datePrefix}-01`),
        where('date', '<=', `${datePrefix}-31`),
        orderBy('date')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    const salesData: DailySales[] = [];
    querySnapshot.forEach((doc) => {
      salesData.push(doc.data() as DailySales);
    });
    
    return salesData;
  } catch (error) {
    console.error('Error getting monthly sales:', error);
    throw error;
  }
};

/**
 * Get recent daily sales
 * @param limit Number of days to retrieve
 */
export const getRecentDailySales = async (limitCount: number = 7): Promise<DailySales[]> => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - limitCount);
    
    // Convert to Firestore Timestamp objects
    const startTimestamp = Timestamp.fromDate(sevenDaysAgo);
    const endTimestamp = Timestamp.fromDate(now);
    
    const dailySalesRef = collection(db, 'daily_sales');
    
    // Try to use timestamp for better performance
    let q;
    try {
      q = query(
        dailySalesRef,
        where('timestamp', '>=', startTimestamp),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    } catch (err) {
      // Fallback to string-based date if timestamp query fails
      console.log('Falling back to string-based date query for recent sales');
      q = query(
        dailySalesRef,
        orderBy('date', 'desc'),
        limit(limitCount)
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    const salesData: DailySales[] = [];
    querySnapshot.forEach((doc) => {
      salesData.push(doc.data() as DailySales);
    });
    
    // Sort by date ascending
    return salesData.sort((a, b) => {
      // If we have timestamps, use those for sorting
      if (a.timestamp && b.timestamp) {
        return a.timestamp.seconds - b.timestamp.seconds;
      }
      // Otherwise fall back to string comparison
      return a.date.localeCompare(b.date);
    });
  } catch (error) {
    console.error('Error getting recent daily sales:', error);
    throw error;
  }
};