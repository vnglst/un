import { Link } from "react-router";
import { Globe, Search, BookOpen } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-un-blue text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Globe className="h-8 w-8" />
            <Link to="/" className="text-xl font-bold">
              UN General Assembly Speeches
            </Link>
          </div>
          <nav className="flex space-x-6">
            <Link to="/" className="flex items-center space-x-1 hover:text-un-light-blue transition-colors">
              <BookOpen className="h-4 w-4" />
              <span>Browse</span>
            </Link>
            <Link to="/globe" className="flex items-center space-x-1 hover:text-un-light-blue transition-colors">
              <Globe className="h-4 w-4" />
              <span>Globe</span>
            </Link>
            <Link to="/search" className="flex items-center space-x-1 hover:text-un-light-blue transition-colors">
              <Search className="h-4 w-4" />
              <span>Search</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
