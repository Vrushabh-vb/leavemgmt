import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamically import icons with no SSR to avoid hydration mismatch
const Github = dynamic(() => import("lucide-react").then(mod => mod.Github), {
  ssr: false,
})

const Heart = dynamic(() => import("lucide-react").then(mod => mod.Heart), {
  ssr: false,
})

export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="border-t mt-10 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600">
              © {currentYear} LMS All rights reserved.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <p className="text-sm text-gray-600 flex items-center">
              Made with {typeof Heart !== 'undefined' && <Heart className="h-4 w-4 mx-1 text-red-500" />} by Aquaman
            </p>
            <Link 
              href="https://github.com/example/leave-management-app"
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
              target="_blank"
              rel="noopener noreferrer"
            >
              {typeof Github !== 'undefined' && <Github className="h-4 w-4 mr-1" />} GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
} 