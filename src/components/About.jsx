import React from 'react'
import { motion } from 'framer-motion'
import adrianImage from '../photos/Adrian_Wellington.jpeg'

export default function About() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="flex justify-center md:justify-start">
          <img 
            src={adrianImage} 
            alt="Adrian Wellington" 
            className="w-64 h-64 object-cover rounded-2xl shadow-lg" 
            style={{ objectPosition: 'center top' }}
          />
        </div>
        <div>
          <motion.h2 initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="font-serif text-3xl">Adrian Wellington — CFE, ACPP, Chevening Scholar</motion.h2>
          <motion.p initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="mt-4 text-muted text-lg text-slate-700">“I built BT2 to make travel secure, simple, and personal — with the same precision I brought to investigations.”</motion.p>

          <div className="mt-6 flex gap-3 flex-wrap">
            <Badge label="Chevening" />
            <Badge label="10+ Years Experience" />
            <Badge label="4.9★ Reviews" />
            <Badge label="Fast Response" />
          </div>
        </div>
      </div>
    </section>
  )
}

function Badge({ label }) {
  return (
    <div className="px-3 py-2 bg-white border rounded-full shadow-sm text-sm flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-gold/80 flex items-center justify-center text-navy text-xs">★</div>
      <span className="text-slate-700">{label}</span>
    </div>
  )
}
