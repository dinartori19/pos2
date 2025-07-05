import AdminLayout from '@/components/admin/AdminLayout';
import CashierManagement from '@/components/admin/CashierManagement';

const CashierManagementPage = () => {
  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Kasir</h1>
          <p className="text-gray-600">Kelola daftar kasir untuk sistem POS</p>
        </div>
        
        <CashierManagement />
      </div>
    </AdminLayout>
  );
};

export default CashierManagementPage;