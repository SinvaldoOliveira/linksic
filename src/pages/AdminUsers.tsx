import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllUsers, updateUserStatus } from '@/contexts/AuthContext';
import { User } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Eye, Lock, Unlock, Users, ExternalLink } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();

  const loadUsers = () => {
    setUsers(getAllUsers());
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    updateUserStatus(user.id, newStatus);
    loadUsers();
    toast({ 
      title: 'Status Atualizado', 
      description: `Usuário ${newStatus === 'active' ? 'desbloqueado' : 'bloqueado'} com sucesso` 
    });
    if (selectedUser?.id === user.id) {
      setSelectedUser({ ...user, status: newStatus });
    }
  };

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gerenciar Usuários</h2>
          <p className="text-muted-foreground">Visualize e gerencie todos os usuários do sistema.</p>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Nenhum usuário cadastrado</p>
                <p className="text-sm mt-1">Os usuários aparecerão aqui após o cadastro</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="font-semibold text-primary text-sm">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                            {user.status === 'active' ? 'Ativo' : 'Bloqueado'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleToggleStatus(user)}
                            >
                              {user.status === 'active' ? (
                                <Lock className="h-4 w-4 text-destructive" />
                              ) : (
                                <Unlock className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
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

        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes do Usuário</DialogTitle>
              <DialogDescription>Informações completas do usuário selecionado</DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">ID</span>
                    <span className="text-sm font-mono">{selectedUser.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={selectedUser.status === 'active' ? 'default' : 'destructive'}>
                      {selectedUser.status === 'active' ? 'Ativo' : 'Bloqueado'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Cadastro</span>
                    <span className="text-sm">{new Date(selectedUser.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Página</span>
                    <a 
                      href={`/u/${selectedUser.pageSlug}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary flex items-center gap-1 hover:underline"
                    >
                      /u/{selectedUser.pageSlug}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant={selectedUser.status === 'active' ? 'destructive' : 'default'}
                    className="flex-1"
                    onClick={() => handleToggleStatus(selectedUser)}
                  >
                    {selectedUser.status === 'active' ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Bloquear Usuário
                      </>
                    ) : (
                      <>
                        <Unlock className="h-4 w-4 mr-2" />
                        Desbloquear Usuário
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
