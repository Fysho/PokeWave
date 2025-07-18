import { useEffect } from 'react'
import { useTheme } from 'next-themes'

export function ThemeManager() {
  const { theme, resolvedTheme } = useTheme()

  useEffect(() => {
    const htmlElement = document.documentElement
    const bodyElement = document.body
    
    // Remove existing theme classes
    htmlElement.classList.remove('light', 'dark')
    bodyElement.classList.remove('light', 'dark')
    
    // Add the current theme class and apply direct styles
    if (resolvedTheme === 'dark') {
      htmlElement.classList.add('dark')
      bodyElement.classList.add('dark')
      
      // Force dark theme styles
      htmlElement.style.backgroundColor = 'hsl(222.2 84% 4.9%)'
      bodyElement.style.backgroundColor = 'hsl(222.2 84% 4.9%)'
      bodyElement.style.color = 'hsl(210 40% 98%)'
      
      console.log('Applied dark theme to html and body elements')
    } else {
      htmlElement.classList.add('light')
      bodyElement.classList.add('light')
      
      // Force light theme styles
      htmlElement.style.backgroundColor = 'hsl(0 0% 100%)'
      bodyElement.style.backgroundColor = 'hsl(0 0% 100%)'
      bodyElement.style.color = 'hsl(222.2 84% 4.9%)'
      
      console.log('Applied light theme to html and body elements')
    }
  }, [theme, resolvedTheme])

  return null
}