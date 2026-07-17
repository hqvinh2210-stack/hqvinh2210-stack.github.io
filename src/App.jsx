import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import CaseStudy from "./pages/CaseStudy.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/case-study/:slug" element={<CaseStudy />} />
      </Routes>
    </>
  );
}
