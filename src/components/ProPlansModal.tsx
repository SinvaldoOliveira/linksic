import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface PlanOption {
    name: string;
    price: string;
    period: string;
    badge?: string;
    features: string[];
    link: string;
    highlighted: boolean;
}

interface ProPlansModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProPlansModal({ isOpen, onClose }: ProPlansModalProps) {
    const plans: PlanOption[] = [
        {
            name: "Pró",
            price: "R$ 9,99",
            period: "por mês",
            badge: "Plano Anual",
            link: "https://buy.stripe.com/test_4gM7sNgMA34Zaste2557W00",
            features: [
                "Links ilimitados",
                "WhatsApp com mensagem personalizada",
                "Destaques e carrosséis personalizados",
                "Incorporação de vídeos do YouTube",
                "Análises de cliques detalhadas"
            ],
            highlighted: true
        },
        {
            name: "Plano Mensal",
            price: "R$ 14,99",
            period: "por mês",
            link: "https://buy.stripe.com/test_7sY28t9k8bBv445aPT57W01",
            features: [
                "Links ilimitados",
                "WhatsApp com mensagem personalizada",
                "Destaques e carrosséis personalizados",
                "Incorporação de vídeos do YouTube",
                "Análises de cliques detalhadas"
            ],
            highlighted: false
        }
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl bg-gradient-to-br from-[#0e0f12] to-[#121417] border-[#8A8F99]/30">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center text-white mb-4">
                        Escolha seu Plano Pró
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`relative bg-gradient-to-br from-[#121417] to-[#0e0f12] p-6 rounded-2xl border transition-all duration-300 flex flex-col ${plan.highlighted
                                    ? 'border-[#FF7A1A] shadow-lg shadow-orange-500/20'
                                    : 'border-[#8A8F99]/30'
                                }`}
                        >
                            {plan.badge && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-[#FF7A1A] to-[#FF5A00] text-white px-4 py-1 rounded-full text-sm font-medium">
                                        {plan.badge}
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-6 mt-2">
                                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                <div className="flex items-baseline justify-center gap-2">
                                    {plan.name === 'Pró' && (
                                        <span className="text-base font-medium text-[#8A8F99]">12x de</span>
                                    )}
                                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                                    <span className="text-[#8A8F99]">{plan.period}</span>
                                </div>
                            </div>

                            <ul className="space-y-3 mb-6 flex-1">
                                {plan.features.map((feature, featureIndex) => (
                                    <li key={featureIndex} className="flex items-start gap-2">
                                        <Check className="w-5 h-5 text-[#69E36E] flex-shrink-0 mt-0.5" />
                                        <span className="text-sm text-[#B0B6C1]">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                onClick={() => window.open(plan.link, '_blank')}
                                className={`w-full rounded-full py-4 text-base font-semibold transition-all ${plan.highlighted
                                        ? 'bg-gradient-to-r from-[#FF7A1A] to-[#FF5A00] hover:from-[#FF5A00] hover:to-[#FF7A1A] text-white shadow-lg shadow-orange-500/25'
                                        : 'bg-[#8A5CF6] hover:bg-[#7C3AED] text-white'
                                    }`}
                            >
                                {plan.highlighted ? 'Assinar agora' : 'Assinar mensal'}
                            </Button>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
