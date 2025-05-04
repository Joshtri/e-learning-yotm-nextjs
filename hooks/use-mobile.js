"use client"

import { useState, useEffect } from "react"

/**
 * Custom hook to check if a media query matches
 * @param {string} query - Media query string
 * @returns {boolean} - Whether the media query matches
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)

    // Function to handle changes in media query
    const handleChange = () => {
      setMatches(mediaQuery.matches)
    }

    // Set initial value
    setMatches(mediaQuery.matches)

    // Add listener for changes
    mediaQuery.addEventListener("change", handleChange)

    // Clean up listener on unmount
    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [query])

  return matches
}
