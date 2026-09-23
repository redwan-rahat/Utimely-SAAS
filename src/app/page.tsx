
import HeroSection from "./components/home/HeroSection";
import Navbar from "./components/navbar/Navbar";


export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="pt-24">
        <HeroSection />
      </main>
    </>
  );
}