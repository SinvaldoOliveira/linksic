import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

// Global variable to persist the prompt across component remounts
let savedDeferredPrompt: any = null;

export function InstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        console.log('[PWA] InstallPrompt Mounted');

        // Check for iOS
        const isIOSCheck = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSCheck);

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            console.log('[PWA] beforeinstallprompt event captured');
            savedDeferredPrompt = e;
            setShowPrompt(true);
        };

        const handleAppInstalled = () => {
            console.log('[PWA] App successfully installed');
            savedDeferredPrompt = null;
            setShowPrompt(false);
        };

        // If we already have a saved prompt, show it immediately
        if (savedDeferredPrompt) {
            console.log('[PWA] Using previously saved prompt');
            setShowPrompt(true);
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        // Initial check for standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('[PWA] Detected standalone mode (already installed)');
            setShowPrompt(false);
        }

        return () => {
            console.log('[PWA] InstallPrompt Unmounting');
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        console.log('[PWA] Install button clicked');
        if (!savedDeferredPrompt) {
            console.log('[PWA] No prompt available to show');
            return;
        }

        try {
            savedDeferredPrompt.prompt();
            const { outcome } = await savedDeferredPrompt.userChoice;
            console.log(`[PWA] User response to installation: ${outcome}`);

            if (outcome === 'accepted') {
                savedDeferredPrompt = null;
                setShowPrompt(false);
            }
        } catch (err) {
            console.error('[PWA] Error during installation prompt:', err);
        }
    };

    if (isIOS) return null; // iOS requires manual "Add to Home Screen"
    if (!showPrompt) return null;

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleInstallClick}
            className={cn("gap-2 border-primary/20 hover:border-primary/50 text-primary animate-in fade-in slide-in-from-top-2")}
        >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Instalar App</span>
        </Button>
    );
}
