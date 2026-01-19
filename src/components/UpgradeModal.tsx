import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Rocket, Star, Zap } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkoutUrl: string; // URL de checkout do Stripe
}

export function UpgradeModal({ isOpen, onClose, checkoutUrl }: UpgradeModalProps) {
  const handleUpgradeClick = () => {
    window.open(checkoutUrl, '_blank');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-primary/20">
        <DialogHeader className="text-center items-center">
          <div className="bg-primary/10 p-3 rounded-full mb-4">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold">Dê um UP na sua página!</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Desbloqueie todo o potencial da sua página com o Plano Pró.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 px-2">
          <ul className="space-y-4">
            <li className="flex items-start">
              <div className="bg-green-500/10 p-1 rounded-full mr-3 mt-1">
                <Star className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <span className="font-semibold">Links Ilimitados</span>
                <p className="text-sm text-muted-foreground">Adicione quantos links, vídeos e banners você quiser.</p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="bg-green-500/10 p-1 rounded-full mr-3 mt-1">
                <Zap className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <span className="font-semibold">Mais Opções de Customização</span>
                <p className="text-sm text-muted-foreground">Em breve: temas exclusivos e fontes personalizadas.</p>
              </div>
            </li>
          </ul>
        </div>

        <DialogFooter>
          <Button
            onClick={handleUpgradeClick}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6"
          >
            Fazer Upgrade para o Pró
            <Rocket className="ml-2 h-5 w-5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
