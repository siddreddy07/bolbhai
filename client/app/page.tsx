import { AnchorScroll } from "@/components/site/anchor-scroll"
import { Footer } from "@/components/site/footer"
import { Hero } from "@/components/site/hero"
import { Navbar } from "@/components/site/navbar"
import { Reveal } from "@/components/site/reveal"
import { Cta, Faq, How, Jobs, Languages } from "@/components/site/sections"

export default function Page() {
  return (
    <>
      <Navbar />
      <Reveal />
      <AnchorScroll />
      <main id="main">
        <Hero />
        <Languages />
        <Jobs />
        <How />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </>
  )
}
