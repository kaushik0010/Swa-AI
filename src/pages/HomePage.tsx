import { Features } from "@/components/home/Features";
import { Hero } from "@/components/home/Hero";
import { PrebuiltPersonas } from "@/components/home/PrebuiltPersonas";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <PrebuiltPersonas />
        <Features />
      </main>
      <Footer />
    </>
  );
}