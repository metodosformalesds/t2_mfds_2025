'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function FaqItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="py-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={isOpen}
      >
        <h3 className="font-poppins text-2xl font-medium text-neutral-900">
          {question}
        </h3>
        <ChevronDown
          className={`h-7 w-7 flex-shrink-0 text-primary-500 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`grid overflow-hidden text-neutral-700 transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="pt-4 font-inter text-base leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  )
}