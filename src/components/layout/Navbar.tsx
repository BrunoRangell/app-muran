
import { Link } from "react-router-dom";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-1 flex items-center justify-between">
            <div className="flex-shrink-0 flex items-center">
              <Link
                to="/"
                className="text-xl font-bold text-[#ff6e00] flex items-center"
              >
                <span className="hidden md:inline-block">Muran Digital</span>
                <span className="md:hidden">Muran</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              <Link
                to="/daily-reviews"
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Revisão Diária
              </Link>
              <Link
                to="/revisao-nova"
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Revisão Nova
              </Link>
              <Link
                to="/revisao-meta"
                className="px-3 py-2 text-sm font-medium bg-amber-50 text-amber-700 rounded-md hover:bg-amber-100"
              >
                Revisão Meta ✨
              </Link>
            </div>
            <div className="hidden sm:flex items-center">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
