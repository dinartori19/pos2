import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAffiliate } from '@/hooks/useAffiliate';
import { TrendingUp, Users, ShoppingCart, DollarSign, Clock } from 'lucide-react';

const AffiliateStats = () => {
  const { affiliate, loading } = useAffiliate();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!affiliate) {
    return null;
  }

  const stats = [
    {
      title: 'Total Klik',
      value: affiliate.totalClicks,
      icon: TrendingUp,
      color: 'bg-blue-500',
      description: 'Jumlah klik pada link affiliate'
    },
    {
      title: 'Total Referral',
      value: affiliate.totalReferrals,
      icon: Users,
      color: 'bg-green-500',
      description: 'Jumlah pengguna yang mendaftar'
    },
    {
      title: 'Komisi Pending',
      value: `¥${affiliate.pendingCommission.toLocaleString()}`,
      icon: Clock,
      color: 'bg-yellow-500',
      description: 'Komisi yang belum dibayarkan'
    },
    {
      title: 'Total Komisi',
      value: `¥${affiliate.totalCommission.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-red-500',
      description: 'Total komisi yang didapatkan'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.color}`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AffiliateStats;