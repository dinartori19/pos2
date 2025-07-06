import { collection, addDoc, updateDoc, doc, runTransaction, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Product, POSTransaction } from '@/types';
import { toast } from '@/hooks/use-toast';
import { updateDailySales } from './dailySalesService';

// Process a POS transaction and update inventory
export const processPOSTransaction = async (transaction: Omit<POSTransaction, 'id'>) => {
  try {
    console.log('Processing POS transaction:', JSON.stringify(transaction, null, 2));
    let transactionId = '';
    
    // Use a transaction to ensure atomicity
    await runTransaction(db, async (firestoreTransaction) => {
      // Update product stock for each item
      for (const item of transaction.items) {
        const productRef = doc(db, 'products', item.product.id);
        const productDoc = await firestoreTransaction.get(productRef);
        
        if (!productDoc.exists()) {
          throw new Error(`Product ${item.product.name} not found`);
        }
        
        const productData = productDoc.data() as Product;
        
        // Check if there's enough stock
        if (productData.stock < item.quantity) {
          throw new Error(`Not enough stock for ${item.product.name}. Available: ${productData.stock}, Requested: ${item.quantity}`);
        }
        
        // Update stock
        firestoreTransaction.update(productRef, {
          stock: productData.stock - item.quantity,
          updated_at: new Date().toISOString()
        });
      }
    });
    
    // Create transaction record
    try {
      // Get current date in YYYY-MM-DD format for easier filtering
      const dateString = new Date().toISOString().split('T')[0];

      // Create a simplified version of items without full product objects
      const simplifiedItems = transaction.items.map(item => ({
        id: item.id,
        product_id: item.product.id, 
        name: item.product.name, 
        price: item.price, 
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        // Only store the image URL reference, not the full image data
        image_url: item.product.image_url
      }));
      
      // Get current date in YYYY-MM-DD format for easier filtering
      const dateString = new Date().toISOString().split('T')[0];

      // Create a simplified version of items without full product objects
      const simplifiedItems = transaction.items.map(item => ({
        id: item.id,
        product_id: item.product.id, 
        name: item.product.name, 
        price: item.price, 
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        // Only store the image URL reference, not the full image data
        image_url: item.product.image_url
      }));
      
      const transactionRef = await addDoc(collection(db, 'pos_transactions'), {
        items: simplifiedItems,
        totalAmount: transaction.totalAmount,
        paymentMethod: transaction.paymentMethod,
        cashReceived: transaction.cashReceived,
        change: transaction.change,
        status: transaction.status, 
        cashierId: transaction.cashierId,
        cashierName: transaction.cashierName,
        // Use Firestore Timestamp for better querying
        timestamp: Timestamp.now(),
        // Keep createdAt for backward compatibility - use the same time as timestamp
        createdAt: new Date().toISOString(),
        // Add a date string for easier filtering
        dateString: dateString
        paymentMethod: transaction.paymentMethod,
        cashReceived: transaction.cashReceived,
        change: transaction.change,
        status: transaction.status, 
        cashierId: transaction.cashierId,
        cashierName: transaction.cashierName,
        // Use Firestore Timestamp for better querying
        timestamp: Timestamp.now(),
        // Keep createdAt for backward compatibility - use the same time as timestamp
        createdAt: new Date().toISOString(),
        // Add a date string for easier filtering
        dateString: new Date().toISOString().split('T')[0]
      });
      
      transactionId = transactionRef.id;
      console.log('POS transaction saved with ID:', transactionId);
      
      // Create financial transaction record
      await addDoc(collection(db, 'financial_transactions'), {
        transactionId: transactionId,
        date: dateString, // YYYY-MM-DD format
        category: 'sales',
        type: 'income',
        amount: transaction.totalAmount, 
        description: `POS Sale by ${transaction.cashierName}`,
        items: simplifiedItems,
        totalAmount: transaction.totalAmount,
        paymentMethod: transaction.paymentMethod,
        cashReceived: transaction.cashReceived,
        change: transaction.change,
        status: transaction.status,
        cashierId: transaction.cashierId,
        cashierName: transaction.cashierName,
        // Use Firestore Timestamp for better querying
        timestamp: Timestamp.now(),
        // Keep createdAt for backward compatibility - use the same time as timestamp
        createdAt: new Date().toISOString(),
        // Add a date string for easier filtering
        dateString: dateString
        paymentMethod: transaction.paymentMethod,
        cashReceived: transaction.cashReceived,
        change: transaction.change,
        status: transaction.status,
        cashierId: transaction.cashierId,
        cashierName: transaction.cashierName,
        // Use Firestore Timestamp for better querying
        timestamp: Timestamp.now(),
        // Keep createdAt for backward compatibility - use the same time as timestamp
        createdAt: new Date().toISOString(),
        // Add a date string for easier filtering
        dateString: dateString
      });
      
      console.log('Financial transaction record created');
      
      // Update daily sales record
      await updateDailySales(dateString, transaction.totalAmount);
      
    } catch (error) {
      console.error('Error saving transaction records:', error);
      toast({
        title: "Error",
        description: "Transaction was processed but records may be incomplete",
        variant: "destructive"
      });
    }
    
    return transactionId;
  } catch (error) {
    console.error('Error processing POS transaction:', error);
    throw error;
  }
};

// Get financial summary for dashboard
export const getFinancialSummary = async (startDate: Date, endDate: Date) => {
  try {
    // Implement financial summary logic
    // This would fetch transactions between dates and calculate totals
    return {
      totalSales: 0,
      totalExpenses: 0,
      netProfit: 0,
      transactionCount: 0
    };
  } catch (error) {
    console.error('Error getting financial summary:', error);
    throw error;
  }
};