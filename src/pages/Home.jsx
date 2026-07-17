import Nav from "../components/Nav.jsx";
import Hero from "../components/Hero.jsx";
import About from "../components/About.jsx";
import Projects from "../components/Projects.jsx";
import DashboardShowcase from "../components/DashboardShowcase.jsx";
import Experience from "../components/Experience.jsx";
import Testimonials from "../components/Testimonials.jsx";
import Contact from "../components/Contact.jsx";
import Footer from "../components/Footer.jsx";

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-white">
      <Nav />
      <main>
        <Hero />
        <About />
        <Projects />
        <DashboardShowcase />
        <Experience />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
