import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function VisaSelectionModal({ open, onClose, onSelectPassport, onSelectUSAVisa, onSelectCanadaVisa, onSelectUKVisa }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          
          <motion.div 
            className="relative w-full max-w-2xl bg-white rounded-xl p-6 md:p-8 z-50"
            initial={{ scale: 0.95, y: 20 }} 
            animate={{ scale: 1, y: 0 }} 
            exit={{ scale: 0.95, y: 20 }}
          >
            <button 
              className="absolute right-4 top-4 text-slate-600 hover:text-slate-800 text-2xl" 
              onClick={onClose}
            >
              ×
            </button>

            <div className="mb-6">
              <h2 className="text-3xl font-bold text-navy mb-2">Visa & Passport Services</h2>
              <p className="text-slate-600">Select the service you need</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => {
                  onSelectPassport()
                  onClose()
                }}
                className="p-6 border-2 border-slate-200 rounded-lg hover:border-teal hover:bg-teal/5 transition-all text-left group"
              >
                <div className="text-4xl mb-3">🛂</div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-teal">Passport Application</h3>
                <p className="text-sm text-slate-600">Apply for a new passport or renewal</p>
              </button>

              <button
                onClick={() => {
                  onSelectUSAVisa()
                  onClose()
                }}
                className="p-6 border-2 border-slate-200 rounded-lg hover:border-teal hover:bg-teal/5 transition-all text-left group"
              >
                <div className="text-4xl mb-3">🇺🇸</div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-teal">USA Visa (DS-160)</h3>
                <p className="text-sm text-slate-600">Apply for a US visitor visa</p>
              </button>

              <button
                onClick={() => {
                  onSelectCanadaVisa()
                  onClose()
                }}
                className="p-6 border-2 border-slate-200 rounded-lg hover:border-teal hover:bg-teal/5 transition-all text-left group"
              >
                <div className="text-4xl mb-3">🍁</div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-teal">Canada Visitor Visa</h3>
                <p className="text-sm text-slate-600">Apply for a Canadian visitor visa</p>
              </button>

              <button
                onClick={() => {
                  onSelectUKVisa()
                  onClose()
                }}
                className="p-6 border-2 border-slate-200 rounded-lg hover:border-teal hover:bg-teal/5 transition-all text-left group"
              >
                <div className="text-4xl mb-3">🇬🇧</div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-teal">UK Visitor Visa</h3>
                <p className="text-sm text-slate-600">Apply for a UK Standard Visitor Visa</p>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

