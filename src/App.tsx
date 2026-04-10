import './App.css';
import CustomCursor from './components/CustomCursor';
import PixelGrid from './components/PixelGrid';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import ProductsHighlight from './components/ProductsHighlight';
import Services from './components/Services';
import About from './components/About';
import Process from './components/Process';
import Contact from './components/Contact';
import Footer from './components/Footer';

function App() {
  return (
    <>
      <CustomCursor />
      <PixelGrid />
      <div className="app">
        <Navbar />
        <Hero />
        <Marquee />
        <ProductsHighlight />
        <Services />
        <About />
        <Process />
        <Contact />
        <Footer />
      </div>
    </>
  );
}

export default App;
