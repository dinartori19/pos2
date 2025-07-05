import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { User, UserPlus } from 'lucide-react';
import { collection, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { toast } from '@/hooks/use-toast';

// Cashier interface
export interface Cashier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CashierSelectorProps {
  selectedCashier: Cashier | null;
  onSelectCashier: (cashier: Cashier) => void;
}

const CashierSelector = ({ selectedCashier, onSelectCashier }: CashierSelectorProps) => {
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch active cashiers
  useEffect(() => {
    const cashiersRef = collection(db, 'cashiers');
    const q = query(
      cashiersRef,
      where('isActive', '==', true),
      orderBy('name')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cashierData: Cashier[] = [];
      snapshot.forEach((doc) => {
        cashierData.push({
          id: doc.id,
          ...doc.data()
        } as Cashier);
      });
      
      setCashiers(cashierData);
      setLoading(false);
      
      // Auto-select first cashier if none selected
      if (!selectedCashier && cashierData.length > 0) {
        onSelectCashier(cashierData[0]);
      }
    }, (error) => {
      console.error('Error fetching cashiers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch cashiers data",
        variant: "destructive"
      });
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [selectedCashier, onSelectCashier]);

  // Handle cashier selection
  const handleSelectCashier = (cashierId: string) => {
    const cashier = cashiers.find(c => c.id === cashierId);
    if (cashier) {
      onSelectCashier(cashier);
      setIsDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <User className="w-4 h-4" />
        <span>Loading cashiers...</span>
      </div>
    );
  }

  if (cashiers.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-yellow-600">
        <UserPlus className="w-4 h-4" />
        <span>No cashiers available</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-2">
        <User className="w-4 h-4 text-primary" />
        <span className="font-medium">Kasir:</span>
      </div>
      
      <Select
        value={selectedCashier?.id}
        onValueChange={handleSelectCashier}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Pilih kasir" />
        </SelectTrigger>
        <SelectContent>
          {cashiers.map((cashier) => (
            <SelectItem key={cashier.id} value={cashier.id}>
              {cashier.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsDialogOpen(true)}
        className="text-xs"
      >
        Ganti
      </Button>
      
      {/* Cashier Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Kasir</DialogTitle>
            <DialogDescription>
              Pilih kasir yang akan bertanggung jawab untuk transaksi saat ini
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            {cashiers.map((cashier) => (
              <Button
                key={cashier.id}
                variant={selectedCashier?.id === cashier.id ? "default" : "outline"}
                className="justify-start h-auto py-3"
                onClick={() => handleSelectCashier(cashier.id)}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{cashier.name}</span>
                  {cashier.email && (
                    <span className="text-xs text-gray-500">{cashier.email}</span>
                  )}
                </div>
              </Button>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashierSelector;