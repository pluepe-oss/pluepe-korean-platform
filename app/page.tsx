import HeroSection from './_components/HeroSection'
import TargetSection from './_components/TargetSection'
import CoursesSection from './_components/CoursesSection'
import TrainingSection from './_components/TrainingSection'
import TicketSection from './_components/TicketSection'
import CtaSection from './_components/CtaSection'

export default async function HomePage() {
  return (
    <main>
      <HeroSection />
      <TargetSection />
      <CoursesSection />
      <TrainingSection />
      <TicketSection />
      <CtaSection />
    </main>
  )
}
