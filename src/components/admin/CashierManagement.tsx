import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Users, UserPlus, Edit, Trash2, Search, RefreshCw } from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';

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

const CashierManagement = () => {
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState<Cashier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    isActive: true
  });

  // Fetch cashiers with real-time updates
  useEffect(() => {
    const cashiersRef = collection(db, 'cashiers');
    const q = query(cashiersRef, orderBy('createdAt', 'desc'));
    
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
  }, []);

  // Filter cashiers based on search term
  const filteredCashiers = cashiers.filter(cashier => 
    cashier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cashier.email && cashier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cashier.phone && cashier.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle form input change
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Open add dialog
  const openAddDialog = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      isActive: true
    });
    setIsAddDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (cashier: Cashier) => {
    setSelectedCashier(cashier);
    setFormData({
      name: cashier.name,
      email: cashier.email || '',
      phone: cashier.phone || '',
      isActive: cashier.isActive
    });
    setIsEditDialogOpen(true);
  };

  // Add new cashier
  const handleAddCashier = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Nama kasir wajib diisi",
        variant: "destructive"
      });
      return;
    }

    try {
      const timestamp = new Date().toISOString();
      const cashiersRef = collection(db, 'cashiers');
      
      await addDoc(cashiersRef, {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        isActive: formData.isActive,
        createdAt: timestamp,
        updatedAt: timestamp
      });
      
      toast({
        title: "Success",
        description: "Kasir berhasil ditambahkan",
      });
      
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding cashier:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan kasir",
        variant: "destructive"
      });
    }
  };

  // Update cashier
  const handleUpdateCashier = async () => {
    if (!selectedCashier) return;
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Nama kasir wajib diisi",
        variant: "destructive"
      });
      return;
    }

    try {
      const cashierRef = doc(db, 'cashiers', selectedCashier.id);
      
      await updateDoc(cashierRef, {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        isActive: formData.isActive,
        updatedAt: new Date().toISOString()
      });
      
      toast({
        title: "Success",
        description: "Kasir berhasil diperbarui",
      });
      
      setIsEditDialogOpen(false);
      setSelectedCashier(null);
    } catch (error) {
      console.error('Error updating cashier:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui kasir",
        variant: "destructive"
      });
    }
  };

  // Delete cashier
  const handleDeleteCashier = async (id: string) => {
    try {
      const cashierRef = doc(db, 'cashiers', id);
      await deleteDoc(cashierRef);
      
      toast({
        title: "Success",
        description: "Kasir berhasil dihapus",
      });
    } catch (error) {
      console.error('Error deleting cashier:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus kasir",
        variant: "destructive"
      });
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              <span>Manajemen Kasir</span>
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari kasir..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={openAddDialog}>
                <UserPlus className="w-4 h-4 mr-2" />
                Tambah Kasir
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Memuat data kasir...</span>
            </div>
          ) : cashiers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Belum ada kasir</h3>
              <p className="text-gray-500 text-sm mb-4">
                Tambahkan kasir untuk mengelola transaksi POS
              </p>
              <Button onClick={openAddDialog} variant="outline" size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Tambah Kasir Baru
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCashiers.map((cashier) => (
                    <TableRow key={cashier.id}>
                      <TableCell className="font-medium">{cashier.name}</TableCell>
                      <TableCell>{cashier.email || '-'}</TableCell>
                      <TableCell>{cashier.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={cashier.isActive ? 'default' : 'secondary'}>
                          {cashier.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(cashier.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(cashier)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Kasir</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus kasir "{cashier.name}"?
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCashier(cashier.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Cashier Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kasir Baru</DialogTitle>
            <DialogDescription>
              Tambahkan kasir baru untuk mengelola transaksi POS
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Kasir *</label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Masukkan nama kasir"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Email (Opsional)</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Masukkan email kasir"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Telepon (Opsional)</label>
              <Input
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Masukkan nomor telepon kasir"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Kasir Aktif
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddCashier}>
              Tambah Kasir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Cashier Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kasir</DialogTitle>
            <DialogDescription>
              Perbarui informasi kasir
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Kasir *</label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Masukkan nama kasir"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Email (Opsional)</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Masukkan email kasir"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Telepon (Opsional)</label>
              <Input
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Masukkan nomor telepon kasir"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActiveEdit"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="isActiveEdit" className="text-sm font-medium">
                Kasir Aktif
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateCashier}>
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashierManagement;