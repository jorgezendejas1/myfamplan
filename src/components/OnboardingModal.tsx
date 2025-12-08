import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Calendar, 
  Clock, 
  Keyboard, 
  MessageCircle, 
  Download, 
  Palette,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    icon: <Calendar className="w-12 h-12 text-primary" />,
    title: '¡Bienvenido a tu Calendario!',
    description: 'Una aplicación completa para organizar tu tiempo, inspirada en Google Calendar.',
    features: [
      'Vistas de Mes, Semana, Día y Agenda',
      'Eventos con recurrencia',
      'Múltiples calendarios con colores',
    ],
  },
  {
    icon: <Clock className="w-12 h-12 text-primary" />,
    title: 'Gestiona tus Eventos',
    description: 'Crea y organiza eventos fácilmente con todas las opciones que necesitas.',
    features: [
      'Tipos: Evento, Tarea, Recordatorio, Cumpleaños',
      'Recurrencia diaria, semanal, mensual, anual',
      'Añade ubicación y descripción',
    ],
  },
  {
    icon: <Keyboard className="w-12 h-12 text-primary" />,
    title: 'Atajos de Teclado',
    description: 'Navega rápidamente usando solo el teclado.',
    features: [
      'J/K - Navegar períodos',
      'T - Ir a hoy',
      'C - Crear evento',
      '1-4 - Cambiar vista',
      '? - Ver todos los atajos',
    ],
  },
  {
    icon: <MessageCircle className="w-12 h-12 text-primary" />,
    title: 'Asistente Inteligente',
    description: 'Un chatbot integrado te ayuda a gestionar tu calendario.',
    features: [
      'Crea eventos con lenguaje natural',
      'Consulta tu disponibilidad',
      'Recibe sugerencias inteligentes',
    ],
  },
  {
    icon: <Download className="w-12 h-12 text-primary" />,
    title: 'Importa y Exporta',
    description: 'Mantén tus datos sincronizados y respaldados.',
    features: [
      'Exporta en formato ICS estándar',
      'Importa desde Google Calendar, Outlook, etc.',
      'Tus datos se guardan localmente',
    ],
  },
  {
    icon: <Palette className="w-12 h-12 text-primary" />,
    title: 'Personalización',
    description: 'Adapta la aplicación a tus preferencias.',
    features: [
      'Tema claro, oscuro o automático',
      'Formato 12h o 24h',
      'Semana empieza en Domingo o Lunes',
    ],
  },
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              {step.icon}
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            {step.title}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-center text-muted-foreground mb-6">
            {step.description}
          </p>

          <ul className="space-y-3">
            {step.features.map((feature, index) => (
              <li 
                key={index}
                className="flex items-center gap-3 text-sm animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 py-4">
          {ONBOARDING_STEPS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-200',
                index === currentStep
                  ? 'w-6 bg-primary'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
              aria-label={`Ir al paso ${index + 1}`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          <div>
            {!isFirstStep && (
              <Button variant="ghost" onClick={handlePrev}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSkip}>
              Omitir
            </Button>
            <Button onClick={handleNext}>
              {isLastStep ? (
                '¡Empezar!'
              ) : (
                <>
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
