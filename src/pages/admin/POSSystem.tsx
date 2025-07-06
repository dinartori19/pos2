import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { useProducts } from '@/hooks/useProducts';
import { collection, getDocs, query, where } from 'firebase/firestore';
import RealtimeClock from '@/components/admin/RealtimeClock';
import CashierSelector from '@/components/admin/CashierSelector';
import { db } from '@/config/firebase';
import { toast } from '@/hooks/use-toast';
import { processPOSTransaction } from '@/services/posService';
import AdminLayout from '@/components/admin/AdminLayout';
import { Product } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { usePOSTransactions } from '@/hooks/usePOSTransactions';
import DailySalesView from '@/components/admin/DailySalesView';

// UI Components 
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  ShoppingCart, 
  Plus,
  Minus, 
  Trash2, 
  CreditCard, 
  Calendar,
  CheckCircle, 
  RefreshCw,
  Receipt,
  Printer,
  AlertOctagon,
  Download,
  DollarSign
} from 'lucide-react';
import { XCircle } from 'lucide-react';

// Cart item interface
interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  price: number;
  totalPrice: number;
}

// Cashier interface
interface Cashier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const POSSystem = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: products = [], isLoading: productsLoading, isError: productsError } = useProducts();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState<number | ''>('');
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isTransactionComplete, setIsTransactionComplete] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false); 
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState<Cashier | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  
  // Get transactions for the selected date
  const { transactions, loading: transactionsLoading, error: transactionsError } = usePOSTransactions(selectedDate);

  // Get unique categories from products
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  // Filter products based on search term and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + item.totalPrice, 0);
  
  // Calculate change amount
  const changeAmount = typeof cashReceived === 'number' ? Math.max(0, cashReceived - cartTotal) : 0;

  // Load cashiers on component mount
  useEffect(() => {
    const loadCashiers = async () => {
      try {
        const cashiersRef = collection(db, 'cashiers');
        const q = query(cashiersRef, where('isActive', '==', true));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const firstCashier = {
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data()
          } as Cashier;
          
          setSelectedCashier(firstCashier);
        }
      } catch (error) {
        console.error('Error loading cashiers:', error);
      }
    };
    
    loadCashiers();
  }, []);

  // Add product to cart
  const addToCart = (product: Product) => {
    // Check if product is already in cart
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingItemIndex !== -1) {
      // Update quantity of existing item
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      updatedCart[existingItemIndex].totalPrice = updatedCart[existingItemIndex].quantity * updatedCart[existingItemIndex].price;
      setCart(updatedCart);
    } else {
      // Add new item to cart
      setCart([...cart, {
        id: product.id,
        product,
        quantity: 1,
        price: product.price,
        totalPrice: product.price
      }]);
    }
  };

  // Update cart item quantity
  const updateQuantity = (id: string, change: number) => {
    const item = cart.find(item => item.id === id);
    if (item) {
      const newQuantity = Math.max(0, item.quantity + change);
      if (newQuantity === 0) {
        removeFromCart(id);
      } else {
        const updatedCart = cart.map(item => {
          if (item.id === id) {
            return {
              ...item,
              quantity: newQuantity,
              totalPrice: newQuantity * item.price
            };
          }
          return item;
        });
        
        setCart(updatedCart);
      }
    }
  };

  // Remove item from cart
  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Handle checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Keranjang Kosong",
        description: "Tambahkan produk ke keranjang terlebih dahulu",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedCashier) {
      toast({
        title: "Kasir Belum Dipilih",
        description: "Pilih kasir terlebih dahulu untuk melanjutkan transaksi",
        variant: "destructive"
      });
      return;
    }
    
    setIsCheckoutDialogOpen(true);
  };

  // Process payment
  const processPayment = async () => {
    if (cart.length === 0) return;
    
    if (paymentMethod === 'cash' && (typeof cashReceived !== 'number' || cashReceived < cartTotal)) {
      toast({
        title: "Jumlah Uang Tidak Cukup",
        description: "Jumlah uang yang diterima harus lebih besar atau sama dengan total belanja",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedCashier) {
      toast({
        title: "Kasir Belum Dipilih",
        description: "Pilih kasir terlebih dahulu untuk melanjutkan transaksi",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessingPayment(true);
    
    try {
      // Prepare transaction object
      const transaction = {
        items: cart.map(item => ({
          id: item.id,
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            category: item.product.category,
            image_url: item.product.image_url
          },
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.totalPrice
        })),
        totalAmount: cartTotal,
        paymentMethod,
        cashReceived: paymentMethod === 'cash' ? cashReceived : undefined,
        change: paymentMethod === 'cash' ? changeAmount : undefined,
        status: 'completed',
        createdAt: new Date().toISOString(),
        cashierId: selectedCashier.id,
        cashierName: selectedCashier.name
      };
      
      // Process transaction, update inventory and financial records
      const transactionId = await processPOSTransaction(transaction);
      
      // Set current transaction for receipt
      setCurrentTransaction({
        ...transaction,
        id: transactionId
      });
      
      // Show success message
      toast({
        title: "Transaksi Berhasil",
        description: "Pembayaran telah diproses, stok produk diperbarui, dan transaksi disimpan.",
      });
      
      // Reset state
      setIsTransactionComplete(true);
      
      // Automatically show receipt after transaction is complete
      setTimeout(() => {
        setIsReceiptDialogOpen(true);
      }, 500);
      
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Transaksi Gagal",
        description: "Terjadi kesalahan saat memproses pembayaran",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Complete transaction and reset
  const completeTransaction = () => {
    setIsCheckoutDialogOpen(false);
    setIsTransactionComplete(false);
    setCart([]);
    setCashReceived('');
    setPaymentMethod('cash');
  };

  // Show receipt
  const showReceipt = (transaction: any) => {
    setCurrentTransaction(transaction);
    setIsReceiptDialogOpen(true);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle manual refresh of transactions
  const handleRefreshTransactions = () => {
    setIsRefreshing(true);
    // Force re-render by changing the date slightly and then back
    const currentDate = selectedDate;
    setSelectedDate('refresh-trigger');
    setTimeout(() => {
      setSelectedDate(currentDate);
      setIsRefreshing(false);
    }, 500);
  };

  // Download receipt as PDF
  const downloadReceiptPDF = async () => {
    if (!receiptRef.current) return;
    console.log('Generating PDF...');
    
    try {
      // Load the libraries with error handling
      let html2canvas, jsPDF;
      try {
        html2canvas = (await import('html2canvas')).default;
        jsPDF = (await import('jspdf')).default;
      } catch (importError) {
        console.error('Error importing PDF libraries:', importError);
        toast({
          title: "Error",
          description: "Gagal memuat library PDF. Coba refresh halaman.",
          variant: "destructive"
        });
        return;
      }
      
      // Create a clone of the receipt element with simplified styling for PDF
      const receiptClone = receiptRef.current.cloneNode(true) as HTMLElement;
      document.body.appendChild(receiptClone);
      receiptClone.style.position = 'absolute';
      receiptClone.style.left = '-9999px';
      receiptClone.style.fontFamily = 'Courier, monospace';
      receiptClone.style.width = '300px';
      receiptClone.style.padding = '10px';
      receiptClone.style.backgroundColor = 'white';
      
      // Create canvas with error handling
      let canvas;
      try {
        canvas = await html2canvas(receiptRef.current, {
          scale: 2, // Higher resolution
          allowTaint: true,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: 300,
          height: receiptRef.current.offsetHeight
        });
      } catch (canvasError) {
        console.error('Error creating canvas:', canvasError);
        document.body.removeChild(receiptClone);
        toast({
          title: "Error",
          description: "Gagal membuat gambar struk. Coba lagi.",
          variant: "destructive"
        });
        return;
      }
      
      // Remove the clone after canvas creation
      document.body.removeChild(receiptClone);
      
      try {
        // Create PDF (80mm width typical for receipts)
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        // Calculate dimensions to fit receipt in PDF
        const imgWidth = 80; // 80mm width
        const pageWidth = pdf.internal.pageSize.getWidth();
        
        // Calculate height while maintaining aspect ratio
        const ratio = canvas.height / canvas.width;
        const imgHeight = imgWidth * ratio;
        
        // Center horizontally
        const x = (pageWidth - imgWidth) / 2;
        
        // Add image to PDF with calculated dimensions
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', x, 10, imgWidth, imgHeight);
        
        // Save PDF
        pdf.save(`struk-${currentTransaction?.id.slice(0, 8)}.pdf`);
        
        toast({
          title: "Berhasil",
          description: "Struk berhasil diunduh sebagai PDF",
        });
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError);
        toast({
          title: "Error",
          description: "Gagal membuat file PDF. Coba lagi.",
          variant: "destructive"
        });
        return;
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Gagal mengunduh struk sebagai PDF. Coba refresh halaman.",
        variant: "destructive"
      });
    }
  };

  // Print receipt with error handling
  const printReceipt = async () => {
    if (!receiptRef.current) {
      toast({
        title: "Error",
        description: "Konten struk tidak ditemukan",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Printing receipt...');
    
    try {
      const printContent = receiptRef.current.innerHTML;
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Error",
          description: "Tidak dapat membuka jendela cetak. Pastikan popup tidak diblokir.",
          variant: "destructive"
        });
        return;
      }
      
      // Add print-specific styles
      printWindow.document.write(`
        <html>
          <head>
            <title>Struk Pembayaran</title>
            <style>
              body { 
                font-family: 'Courier New', monospace;
                width: 80mm; /* Standard thermal receipt width */
                margin: 0 auto;
                padding: 5mm;
                font-size: 12px;
              }
              .receipt-header {
                text-align: center;
                margin-bottom: 10px;
              }
              .receipt-header h3 {
                font-size: 16px;
                margin: 0;
              }
              .receipt-header p {
                margin: 2px 0;
                font-size: 12px;
              }
              .divider {
                border-top: 1px dashed #000;
                margin: 10px 0;
              }
              .item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
              }
              .item-details {
                flex: 1;
              }
              .item-price {
                text-align: right;
                font-weight: bold;
              }
              .total-section {
                margin-top: 10px;
                font-weight: bold;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 10px;
              }
              @media print {
                body {
                  width: 100%;
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      
      // Print after a short delay to ensure content is loaded
      setTimeout(() => {
        console.log('Executing print command...');
        printWindow.print();
        // Don't close the window immediately to allow printing to complete
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }, 250);
      
      toast({
        title: "Print Berhasil",
        description: "Struk berhasil dicetak",
      });
    } catch (error) {
      console.error('Error printing receipt:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mencetak struk",
        variant: "destructive"
      });
    }
  };

  // Render error state
  if (productsError) {
    return (
      <AdminLayout>
        <div className="p-8 flex flex-col items-center justify-center">
          <AlertOctagon className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Products</h2>
          <p className="text-gray-600 mb-4">Terjadi kesalahan saat memuat data produk.</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Halaman
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">POS Kasir</h1>
            <p className="text-gray-600">Point of Sale untuk transaksi langsung</p>
          </div>
          <div className="flex items-center space-x-4">
            <RealtimeClock showIcon={true} showDate={true} showSeconds={true} />
            {selectedCashier && (
              <CashierSelector 
                selectedCashier={selectedCashier}
                onSelectCashier={setSelectedCashier}
              />
            )}
          </div>
        </div>

        <Tabs defaultValue="pos" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="pos" className="flex items-center">
              <ShoppingCart className="w-4 h-4 mr-2" />
              POS Kasir
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center">
              <Receipt className="w-4 h-4 mr-2" />
              Riwayat Transaksi
            </TabsTrigger>
          </TabsList>

          {/* POS Tab */}
          <TabsContent value="pos">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product Selection */}
              <div className="lg:col-span-2">
                <Card className="mb-6">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <CardTitle>Pilih Produk</CardTitle>
                      <div className="flex space-x-2">
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            placeholder="Cari produk..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category === 'all' ? 'Semua Kategori' : category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {productsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="text-center py-12">
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Produk Tidak Ditemukan
                        </h3>
                        <p className="text-gray-500">
                          Coba gunakan kata kunci lain atau pilih kategori yang berbeda
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {filteredProducts.map((product) => (
                          <motion.div
                            key={product.id}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => addToCart(product)}
                            className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <div className="p-2 text-center">
                              <div className="w-full h-24 bg-gray-100 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                                {product.image_url ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ShoppingCart className="w-8 h-8 text-gray-400" />
                                )}
                              </div>
                              <h3 className="font-medium text-sm text-gray-900 line-clamp-2 h-10">
                                {product.name}
                              </h3>
                              <p className="text-primary font-bold mt-1">
                                {formatCurrency(product.price)}
                              </p>
                              <Badge variant="outline" className="mt-1 text-xs">
                                Stok: {product.stock}
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Cart */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center">
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Keranjang
                      </CardTitle>
                      <Badge variant="outline">
                        {cart.length} item
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="max-h-[calc(100vh-350px)] overflow-y-auto">
                    {cart.length === 0 ? (
                      <div className="text-center py-8">
                        <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Keranjang Kosong
                        </h3>
                        <p className="text-gray-500">
                          Tambahkan produk ke keranjang untuk memulai transaksi
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cart.map((item) => (
                          <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{item.product.name}</h4>
                              <p className="text-sm text-gray-500">{formatCurrency(item.price)} x {item.quantity}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.id, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-right font-medium w-20">
                              {formatCurrency(item.totalPrice)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-col">
                    <div className="w-full py-4 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">{formatCurrency(cartTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-600">Total</span>
                        <span className="text-xl font-bold text-primary">{formatCurrency(cartTotal)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          onClick={clearCart}
                          disabled={cart.length === 0}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Bersihkan
                        </Button>
                        <Button
                          onClick={handleCheckout}
                          disabled={cart.length === 0}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Bayar
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <CardTitle>Riwayat Transaksi</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <Input
                        type="date"
                        max={new Date().toISOString().split('T')[0]} // Prevent selecting future dates
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-40"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRefreshTransactions}
                      disabled={isRefreshing}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mr-3"></div>
                    <span>Memuat data transaksi...</span>
                  </div>
                ) : transactionsError ? (
                  <div className="text-center py-12">
                    <AlertOctagon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Error Loading Transactions
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {transactionsError.message || "Terjadi kesalahan saat memuat data transaksi"}
                    </p>
                    <Button onClick={() => window.location.reload()}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Belum Ada Transaksi
                    </h3>
                    <p className="text-gray-500">
                      Belum ada transaksi POS pada tanggal ini
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID Transaksi
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Waktu
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kasir
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Metode Pembayaran
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {transaction.id.slice(0, 8)}...
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate(transaction.createdAt)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {transaction.cashierName}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              <Badge variant="outline">
                                {transaction.paymentMethod === 'cash' ? 'Tunai' : 
                                 transaction.paymentMethod === 'card' ? 'Kartu' : 
                                 transaction.paymentMethod === 'qris' ? 'QRIS' : 
                                 transaction.paymentMethod}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                              {formatCurrency(transaction.totalAmount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => showReceipt(transaction)}
                                className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                              >
                                <Receipt className="w-4 h-4 mr-2" />
                                Struk
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Daily Sales Tab */}
          <TabsContent value="daily-sales">
            <DailySalesView />
          </TabsContent>
        </Tabs>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>
              Pilih metode pembayaran dan selesaikan transaksi
            </DialogDescription>
          </DialogHeader>
          
          {!isTransactionComplete ? (
            <>
              <div className="grid gap-4 py-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Belanja:</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(cartTotal)}</span>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <label className="text-sm font-medium">Metode Pembayaran</label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih metode pembayaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Tunai</SelectItem>
                      <SelectItem value="card">Kartu</SelectItem>
                      <SelectItem value="qris">QRIS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {paymentMethod === 'cash' && (
                  <div className="grid grid-cols-1 gap-2">
                    <label className="text-sm font-medium">Jumlah Uang Diterima</label>
                    <Input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                    />
                    
                    {typeof cashReceived === 'number' && cashReceived >= cartTotal && (
                      <div className="bg-green-50 p-3 rounded-md mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-green-700 font-medium">Kembalian:</span>
                          <span className="text-green-700 font-bold">{formatCurrency(changeAmount)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {paymentMethod === 'qris' && (
                  <div className="flex flex-col items-center justify-center py-4">
                    <QRCode />
                    <p className="text-sm text-gray-500 mt-2">Scan QR code untuk pembayaran</p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCheckoutDialogOpen(false)}>
                  Batal
                </Button>
                <Button 
                  onClick={processPayment} 
                  disabled={isProcessingPayment || (paymentMethod === 'cash' && (typeof cashReceived !== 'number' || cashReceived < cartTotal))}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Selesaikan Pembayaran
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Transaksi Berhasil!</h3>
                <p className="text-gray-600 text-center mb-4">
                  Pembayaran telah diproses dan transaksi telah disimpan
                </p>
                
                {paymentMethod === 'cash' && (
                  <div className="bg-green-50 p-4 rounded-md w-full mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-green-700">Total:</span>
                      <span className="text-green-700 font-bold">{formatCurrency(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-green-700">Diterima:</span>
                      <span className="text-green-700 font-bold">{formatCurrency(cashReceived as number)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-green-200">
                      <span className="text-green-700 font-medium">Kembalian:</span>
                      <span className="text-green-700 font-bold">{formatCurrency(changeAmount)}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  className="sm:flex-1"
                  onClick={completeTransaction}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Tutup
                </Button>
                <Button 
                  className="sm:flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setIsReceiptDialogOpen(true);
                    setIsCheckoutDialogOpen(false);
                  }}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Lihat Struk
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog 
        open={isReceiptDialogOpen} 
        onOpenChange={(open) => {
          console.log('Receipt dialog state changing to:', open);
          setIsReceiptDialogOpen(open);
          if (!open && isTransactionComplete) {
            completeTransaction();
          }
        }}
      >
        <DialogContent className="sm:max-w-md print:shadow-none print:border-none">
          <DialogHeader>
            <DialogTitle>Struk Pembayaran</DialogTitle>
          </DialogHeader>

          {currentTransaction && (
            <div className="py-4" id="receipt-content" ref={receiptRef}>
              <div className="font-mono" style={{ width: '100%', maxWidth: '300px', margin: '0 auto' }}>
                <div className="text-center mb-4 receipt-header">
                  <div className="w-16 h-16 mx-auto mb-2">
                    <img 
                      src="/logo.jpg"
                      alt="Injapan Food Logo" 
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <h3 className="font-bold text-lg">INJAPAN FOOD</h3>
                  <p className="text-sm">POS KASIR (JULI 2025)</p>
                  <div className="border-t border-b border-dashed my-2 py-1 receipt-divider">
                    <p className="text-xs">
                      {formatDate(currentTransaction.createdAt)}
                    </p>
                    <p className="text-xs">
                      Kasir: {currentTransaction.cashierName}
                    </p>
                  </div>
                </div>
                
                <div className="text-sm mb-4">
                  <div className="flex justify-between font-bold border-b border-dashed pb-1 mb-2 receipt-header-row">
                    <span>Produk</span>
                    <div className="flex space-x-2">
                      <span>Qty</span>
                      <span>Harga</span>
                      <span>Subtotal</span>
                    </div>
                  </div>
                  
                  {currentTransaction.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-xs mb-2 receipt-item">
                      <div className="max-w-[120px] truncate receipt-item-name">
                        {item.product.name}
                      </div>
                      <div className="flex space-x-2 receipt-item-details">
                        <span className="w-6 text-center receipt-item-qty">{item.quantity}</span>
                        <span className="w-16 text-right receipt-item-price">{formatCurrency(item.price)}</span>
                        <span className="w-16 text-right font-medium receipt-item-total">{formatCurrency(item.totalPrice)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-dashed pt-2 mb-2 receipt-summary">
                  <div className="flex justify-between text-sm receipt-total">
                    <span className="font-bold">Total</span>
                    <span className="font-bold">{formatCurrency(currentTransaction.totalAmount)}</span>
                  </div>
                  
                  {currentTransaction.paymentMethod === 'cash' && (
                    <>
                      <div className="flex justify-between text-sm receipt-payment">
                        <span>Tunai</span>
                        <span>{formatCurrency(currentTransaction.cashReceived)}</span>
                      </div>
                      <div className="flex justify-between text-sm receipt-change">
                        <span>Kembali</span>
                        <span>{formatCurrency(currentTransaction.change)}</span>
                      </div>
                    </>
                  )}
                  
                  <div className="flex justify-between text-xs mt-1 receipt-method">
                    <span>Metode:</span>
                    <span>
                      {currentTransaction.paymentMethod === 'cash' ? 'Tunai' : 
                       currentTransaction.paymentMethod === 'card' ? 'Kartu' : 
                       currentTransaction.paymentMethod === 'qris' ? 'QRIS' : 
                       currentTransaction.paymentMethod}
                    </span>
                  </div>
                </div>
                
                <div className="text-center text-xs mt-4 receipt-footer">
                  <p className="font-medium">Terima kasih!</p>
                  <p className="text-[10px] mt-1">ID: {currentTransaction.id.slice(0, 8)}</p>
                </div>
              </div>
            </div>
          )}
          
          {!currentTransaction && (
            <div className="py-8 text-center">
              <AlertOctagon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Data Transaksi Tidak Tersedia
              </h3>
              <p className="text-gray-500">
                Tidak dapat menampilkan struk karena data transaksi tidak lengkap
              </p>
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsReceiptDialogOpen(false);
                if (isTransactionComplete) {
                  completeTransaction();
                }
              }}
              className="sm:flex-1"
            >
              Tutup
            </Button>
            <Button 
              onClick={downloadReceiptPDF}
              disabled={!currentTransaction}
              variant="outline"
              className="sm:flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button 
              onClick={printReceipt}
              disabled={!currentTransaction}
              className="sm:flex-1 bg-green-600 hover:bg-green-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Struk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

// Simple QR Code component for demo
const QRCode = () => (
  <div className="w-40 h-40 mx-auto bg-white p-2 rounded-lg border">
    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
      <div className="grid grid-cols-5 grid-rows-5 gap-1 w-4/5 h-4/5">
        {/* QR Code corners */}
        <div className="col-span-1 row-span-1 bg-white rounded-tl-lg"></div>
        <div className="col-span-1 row-span-1 bg-white"></div>
        <div className="col-span-1 row-span-1 bg-white"></div>
        <div className="col-span-1 row-span-1 bg-white"></div>
        <div className="col-span-1 row-span-1 bg-white rounded-tr-lg"></div>
        
        <div className="col-span-1 row-span-1 bg-white"></div>
        <div className="col-span-1 row-span-1 bg-black rounded-lg"></div>
        <div className="col-span-1 row-span-1 bg-white"></div>
        <div className="col-span-1 row-span-1 bg-black rounded-lg"></div>
        <div className="col-span-1 row-span-1 bg-white"></div>
        
        <div className="col-span-1 row-span-1 bg-white"></div>
        <div className="col-span-1 row-span-1 bg-white"></div>
        <div className="col-span-1 row-span-1 bg-black rounded-lg"></div>
        <div className="col-span-1 row-span-1 bg-white"></div>
        <div className="col-span-1 row-span-1 bg-white"></div>
        
        <div className="col-span-1 row-span-1 bg-white"></div>
        <div className="col-span-1 row-span-1 bg-black rounded-lg"></div>
        <div className="col-span-1 row-span-1 bg-white"></div>
        <div className="col-span-1 row-span-1 bg-black rounded-lg"></div>
        <div className="col-span-1 row-span-1 bg-white"></div>
        
        <div className="col-span-1 row-span-1 bg-white rounded-bl-lg"></div>
        <div className="col-span-1 row-span-1 bg-white"></div>
        <div className="col-span-1 row-span-1 bg-white"></div>
        <div className="col-span-1 row-span-1 bg-white"></div>
        <div className="col-span-1 row-span-1 bg-white rounded-br-lg"></div>
      </div>
    </div>
  </div>
);

export default POSSystem;