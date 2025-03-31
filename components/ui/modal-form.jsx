'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ModalForm({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitText = 'Simpan',
  size = 'md', // sm, md, lg, xl
}) {
  const [isClosing, setIsClosing] = useState(false)

  // Handle escape key press
  useEffect(() => {
    const handleEscape = e => {
      if (e.key === 'Escape') handleClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 200)
  }

  const handleSubmit = e => {
    e.preventDefault()
    onSubmit(e)
  }

  // Determine modal width based on size prop
  const getModalWidth = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md'
      case 'md':
        return 'max-w-lg'
      case 'lg':
        return 'max-w-2xl'
      case 'xl':
        return 'max-w-4xl'
      default:
        return 'max-w-lg'
    }
  }

  if (!isOpen && !isClosing) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay - separate from content */}
      <motion.div
        className="fixed inset-0 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      />

      {/* Modal content */}
      <AnimatePresence>
        {(isOpen || isClosing) && (
          <motion.div
            className={`bg-white rounded-lg shadow-lg ${getModalWidth()} w-full z-10 overflow-hidden`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">{title}</h2>
              <button
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={onSubmit}>
              <div className="p-4 max-h-[70vh] overflow-y-auto">{children}</div>

              <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Batal
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  {submitText}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}