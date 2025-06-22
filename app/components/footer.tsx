export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-bold mb-4">UN Speeches Database</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Comprehensive archive of United Nations General Assembly speeches
              from every member state since 1946, making diplomatic discourse
              accessible for research and analysis.
            </p>
          </div>

          {/* Data Sources */}
          <div>
            <h3 className="text-lg font-bold mb-4">Data Sources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/0TJX8Y"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-un-blue hover:text-un-blue/80 transition-colors"
                >
                  Harvard Dataverse Dataset
                </a>
              </li>
              <li>
                <a
                  href="https://www.ungdc.bham.ac.uk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-un-blue hover:text-un-blue/80 transition-colors"
                >
                  University of Birmingham Research
                </a>
              </li>
            </ul>
          </div>

          {/* Technical */}
          <div>
            <h3 className="text-lg font-bold mb-4">Technical</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/vnglst/un"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-un-blue hover:text-un-blue/80 transition-colors"
                >
                  Source Code (GitHub)
                </a>
              </li>
              <li>
                <span className="text-gray-300">
                  Built with React Router v7
                </span>
              </li>
              <li>
                <span className="text-gray-300">
                  Full-text search with SQLite
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              <p>
                Built for research and educational purposes by{' '}
                <a
                  href="https://koenvangilst.nl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-un-blue hover:text-un-blue/80 transition-colors"
                >
                  Koen van Gilst
                </a>
              </p>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <span className="text-gray-400">
                Engineered for Diplomacy. Built for Research.
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
