"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Building2,
  Receipt,
  DollarSign,
  Clock,
  Link2,
  UserCheck,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchDashboardStats, type DashboardStats } from "@/lib/admin-data";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${color ?? "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your rental management platform.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Failed to load dashboard data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your rental management platform.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          description="Registered profiles"
          color="text-blue-600"
        />
        <StatCard
          title="Properties"
          value={stats.totalProperties}
          icon={Building2}
          description="Listed properties"
          color="text-green-600"
        />
        <StatCard
          title="Total Bills"
          value={stats.totalBills}
          icon={Receipt}
          description={`${stats.pendingBills} pending`}
          color="text-orange-600"
        />
        <StatCard
          title="Total Revenue"
          value={`NPR ${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          description="From paid bills"
          color="text-emerald-600"
        />
        <StatCard
          title="Pending Bills"
          value={stats.pendingBills}
          icon={Clock}
          description="Awaiting payment"
          color="text-yellow-600"
        />
        <StatCard
          title="Active Connections"
          value={stats.activeConnections}
          icon={Link2}
          description="Between users"
          color="text-purple-600"
        />
        <StatCard
          title="Tenants"
          value={stats.totalTenants}
          icon={UserCheck}
          description="Property tenants"
          color="text-cyan-600"
        />
        <StatCard
          title="Documents"
          value={stats.totalDocuments}
          icon={FileText}
          description="Uploaded files"
          color="text-pink-600"
        />
      </div>
    </div>
  );
}
