import { WizardProvider } from '@/lib/wizard-context'
import WizardStepper from '@/components/WizardStepper'

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <WizardProvider>
      <WizardStepper />
      {children}
    </WizardProvider>
  )
}
