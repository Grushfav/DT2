import React from 'react'

export default function TrustBar() {
  return (
    <div className="bg-white py-4 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-center gap-6 text-sm text-slate-700">
        <div className="flex items-center gap-2">✅ <span>Verified Travel Agent</span></div>
        <div className="flex items-center gap-2">🏅 <span>Chevening Scholar</span></div>
        <div className="flex items-center gap-2">⭐ <span>4.9★ Reviews</span></div>
        <div className="flex items-center gap-2">⚡ <span>Fast Response</span></div>
      </div>
    </div>
  )
}
