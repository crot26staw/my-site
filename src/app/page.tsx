import { Cases } from "@/components/Cases/Cases";
import { Contact } from "@/components/Contact/Contact";
import { Faq } from "@/components/Faq/Faq";
import { FloatingTelegram } from "@/components/FloatingTelegram";
import { Footer } from "@/components/Footer/Footer";
import { ForWhom } from "@/components/ForWhom/ForWhom";
import { Guarantees } from "@/components/Guarantees/Guarantees";
import { Header } from "@/components/Header/Header";
import { Hero } from "@/components/Hero/Hero";
import { Pricing } from "@/components/Pricing/Pricing";
import { Process } from "@/components/Process/Process";
import { Quiz } from "@/components/Quiz/Quiz";
import { Passage } from "@/components/Room/Room";
import { SceneCanvas } from "@/components/SceneCanvas";
import { ScrollDirector } from "@/components/ScrollDirector";
import { Services } from "@/components/Services/Services";
import { Team } from "@/components/Team/Team";
import { Why } from "@/components/Why/Why";

/**
 * Каждый блок — комната в 3D-сцене. Между комнатами — Passage: участок скролла,
 * на котором камера поворачивает к двери и проходит в следующую комнату.
 * Порядок здесь должен совпадать с SEQUENCE и DOORS в src/scene/route.ts.
 *
 * Прогулка — петля: зал «Контакты» примыкает к первой комнате, и в конце
 * мы выходим через ту же дверь, в которую вошли. Футер — снаружи, в вестибюле.
 */
export default function HomePage() {
  return (
    <>
      <SceneCanvas />
      <Header />
      <main>
        <Hero />
        <Why />
        <Passage track="door2" />
        <ForWhom />
        <Passage track="door3" />
        <Services />
        <Passage track="door4" />
        <Pricing />
        <Passage track="door5" />
        <Cases />
        <Passage track="door6" />
        <Process />
        <Passage track="door7" />
        <Quiz />
        <Passage track="door8" />
        <Team />
        {/* Место под блок «Отзывы»: новая комната между «Командой» и «Гарантиями» (route.ts) */}
        <Passage track="door9" />
        <Guarantees />
        <Passage track="door10" />
        <Faq />
        <Passage track="door11" />
        <Contact />
        <Passage track="exit" long />
      </main>
      <Footer />
      <FloatingTelegram />
      <ScrollDirector />
    </>
  );
}
