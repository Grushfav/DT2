import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Nav from './components/Nav'
import Hero from './components/Hero'
import TrustBar from './components/TrustBar'
import About from './components/About'
import Packages from './components/Packages'
import TravelPulse from './components/TravelPulse'
import Services from './components/Services'
import Testimonials from './components/Testimonials'
import Footer from './components/Footer'
import LeadModal from './components/LeadModal'
import LoginModal from './components/LoginModal'
import TravelBuddy from './components/TravelBuddy'
import FormDrafts from './components/FormDrafts'
import MyRequests from './components/MyRequests'
import PaymentInfo from './components/PaymentInfo'
import TestimonialModal from './components/TestimonialModal'
import PassportForm from './components/PassportForm'
import USAVisaForm from './components/USAVisaForm'
import CanadaVisaForm from './components/CanadaVisaForm'
import UKVisaForm from './components/UKVisaForm'
import VisaSelectionModal from './components/VisaSelectionModal'
import CrazyDealBadge from './components/CrazyDealBadge'
import FlyList from './components/FlyList'
import PackageDetailsModal from './components/PackageDetailsModal'
import BankDetails from './components/BankDetails'
import LiveChat from './components/LiveChat'

export default function App() {
  const [isModalOpen, setModalOpen] = useState(false)
  const [isLoginModalOpen, setLoginModalOpen] = useState(false)
  const [isVisaSelectionOpen, setVisaSelectionOpen] = useState(false)
  const [isPassportFormOpen, setPassportFormOpen] = useState(false)
  const [isUSAVisaFormOpen, setUSAVisaFormOpen] = useState(false)
  const [isCanadaVisaFormOpen, setCanadaVisaFormOpen] = useState(false)
  const [isUKVisaFormOpen, setUKVisaFormOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [selectedDraftId, setSelectedDraftId] = useState(null)
  const [selectedPassportDraftId, setSelectedPassportDraftId] = useState(null)
  const [selectedUSAVisaDraftId, setSelectedUSAVisaDraftId] = useState(null)
  const [selectedCanadaVisaDraftId, setSelectedCanadaVisaDraftId] = useState(null)
  const [selectedUKVisaDraftId, setSelectedUKVisaDraftId] = useState(null)
  const [showSavedForms, setShowSavedForms] = useState(false)
  const [showMyRequests, setShowMyRequests] = useState(false)
  const [selectedPaymentRequestId, setSelectedPaymentRequestId] = useState(null)
  const [isTestimonialModalOpen, setTestimonialModalOpen] = useState(false)
  const [isPackageDetailsOpen, setPackageDetailsOpen] = useState(false)
  const [selectedPackageForDetails, setSelectedPackageForDetails] = useState(null)
  const [isBankDetailsOpen, setBankDetailsOpen] = useState(false)

  const handleSavedFormsClick = () => {
    setShowSavedForms(true)
    setShowMyRequests(false)
  }

  const handleMyRequestsClick = () => {
    setShowMyRequests(true)
    setShowSavedForms(false)
  }

  // Listen for testimonial modal open event from Footer
  useEffect(() => {
    const handleOpenTestimonialModal = () => {
      setTestimonialModalOpen(true)
    }
    window.addEventListener('openTestimonialModal', handleOpenTestimonialModal)
    return () => {
      window.removeEventListener('openTestimonialModal', handleOpenTestimonialModal)
    }
  }, [])

  return (
    <div className="font-ui text-slate-800 bg-white">
      <Nav 
        onPrimaryClick={() => setModalOpen(true)} 
        onLoginClick={() => setLoginModalOpen(true)}
        onSavedFormsClick={handleSavedFormsClick}
        onMyRequestsClick={handleMyRequestsClick}
        onBankDetailsClick={() => setBankDetailsOpen(true)}
      />
      <main className="md:pl-72 pt-16 md:pt-0">
        <Hero onPrimaryClick={() => setModalOpen(true)} />
        <TrustBar />
        <Services 
          onPassportClick={() => setPassportFormOpen(true)} 
          onBookingClick={() => setModalOpen(true)}
          onVisaClick={() => setVisaSelectionOpen(true)}
        />
        <Packages 
          onViewDetails={(pkg) => { 
            setSelectedPackageForDetails(pkg)
            setPackageDetailsOpen(true)
          }} 
          onRequest={(pkg) => {
            setSelectedPackage(pkg)
            setModalOpen(true)
          }}
        />
        <TravelPulse />
      
        <TravelBuddy />
        
        <About />

        <Testimonials />
      </main>

      <LeadModal 
        open={isModalOpen} 
        onClose={() => { setModalOpen(false); setSelectedDraftId(null); }} 
        selectedPackage={selectedPackage}
        draftId={selectedDraftId}
      />
      <VisaSelectionModal
        open={isVisaSelectionOpen}
        onClose={() => setVisaSelectionOpen(false)}
        onSelectPassport={() => setPassportFormOpen(true)}
        onSelectUSAVisa={() => setUSAVisaFormOpen(true)}
        onSelectCanadaVisa={() => setCanadaVisaFormOpen(true)}
        onSelectUKVisa={() => setUKVisaFormOpen(true)}
      />
      <PassportForm 
        open={isPassportFormOpen} 
        onClose={() => { setPassportFormOpen(false); setSelectedPassportDraftId(null); }} 
        draftId={selectedPassportDraftId}
      />
      <USAVisaForm 
        open={isUSAVisaFormOpen} 
        onClose={() => { setUSAVisaFormOpen(false); setSelectedUSAVisaDraftId(null); }} 
        draftId={selectedUSAVisaDraftId}
      />
      <CanadaVisaForm 
        open={isCanadaVisaFormOpen} 
        onClose={() => { setCanadaVisaFormOpen(false); setSelectedCanadaVisaDraftId(null); }} 
        draftId={selectedCanadaVisaDraftId}
      />
      <UKVisaForm 
        open={isUKVisaFormOpen} 
        onClose={() => { setUKVisaFormOpen(false); setSelectedUKVisaDraftId(null); }} 
        draftId={selectedUKVisaDraftId}
      />
      <LoginModal open={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} />
      <TestimonialModal open={isTestimonialModalOpen} onClose={() => setTestimonialModalOpen(false)} />
      <PackageDetailsModal
        open={isPackageDetailsOpen}
        onClose={() => {
          setPackageDetailsOpen(false)
          setSelectedPackageForDetails(null)
        }}
        package={selectedPackageForDetails}
        onRequest={() => {
          setSelectedPackage(selectedPackageForDetails)
          setModalOpen(true)
        }}
      />
      
      {/* Modals for My Saved Forms and My Requests */}
      <AnimatePresence>
        {showSavedForms && (
          <FormDrafts
            onResumeDraft={(draft) => { 
              setShowSavedForms(false)
              if (draft.form_type === 'passport') {
                setSelectedPassportDraftId(draft.id)
                setPassportFormOpen(true)
              } else if (draft.form_type === 'usa_visa') {
                setSelectedUSAVisaDraftId(draft.id)
                setUSAVisaFormOpen(true)
              } else if (draft.form_type === 'canada_visa') {
                setSelectedCanadaVisaDraftId(draft.id)
                setCanadaVisaFormOpen(true)
              } else if (draft.form_type === 'uk_visa') {
                setSelectedUKVisaDraftId(draft.id)
                setUKVisaFormOpen(true)
              } else {
                setSelectedDraftId(draft.id)
                setSelectedPackage(draft.form_data?.packageCode ? { code: draft.form_data.packageCode } : null)
                setModalOpen(true)
              }
            }}
            onClose={() => setShowSavedForms(false)}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showMyRequests && (
          <MyRequests 
            onClose={() => setShowMyRequests(false)}
            onViewPayment={(requestId) => setSelectedPaymentRequestId(requestId)}
          />
        )}
      </AnimatePresence>

      {selectedPaymentRequestId && (
        <PaymentInfo
          requestId={selectedPaymentRequestId}
          onClose={() => setSelectedPaymentRequestId(null)}
        />
      )}
      
      <Footer />

      {/* Crazy deal badge - desktop version */}
      <CrazyDealBadge />
      {/* Vertical fly list of affordable destinations */}
      <FlyList />
      
      {/* Bank Details Modal */}
      <BankDetails 
        open={isBankDetailsOpen} 
        onClose={() => setBankDetailsOpen(false)} 
      />

      {/* Live Chat floating button/modal */}
      <LiveChat />
    </div>
  )
}
