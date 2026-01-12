import React from 'react'
import { motion } from 'framer-motion'
import mainImage from '../photos/main.jpg'

export default function Hero({ onPrimaryClick = () => {} }) {
  return (
    <section className="relative h-screen flex items-center" aria-label="Hero">
      <div className="absolute inset-0 overflow-hidden">
        <img src={mainImage} alt="Hero" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(11,29,58,0.45)] to-[rgba(11,29,58,0.15)]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="font-serif text-4xl md:text-6xl leading-tight">
          Seamless Travel, Tailored for You.
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mt-4 text-lg md:text-xl text-white/90">
          Flights, visas, hotels & getaways — all handled by Jamaica’s trusted travel expert.
        </motion.p>

        <motion.div whileHover={{ y: -6 }} className="mt-8 flex items-center justify-center">
          <button onClick={onPrimaryClick} className="bg-teal hover:bg-teal-dark text-navy font-semibold px-6 py-3 rounded-full shadow-lg">Start Your Booking</button>
        </motion.div>
      </div>
    </section>
  )
}
