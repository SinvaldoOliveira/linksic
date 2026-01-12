import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Settings } from 'lucide-react';

export default function SuperAdmin() {
  return (
    <DashboardLayout type="super">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight">Super Admin</h2>
        </div>
        <p className="text-muted-foreground">Área exclusiva do super administrador.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Controles do Sistema</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Configure e gerencie recursos avançados do sistema.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
