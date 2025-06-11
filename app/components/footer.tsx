export default function Footer() {
  return (
    <footer className="border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center text-xs text-gray-500 space-y-2">
          <p className="max-w-2xl mx-auto">
            Archive of UN General Assembly speeches from every member state
            since 1946. Based on research from the University of Birmingham.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/0TJX8Y"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Dataset
            </a>
            <a
              href="https://www.ungdc.bham.ac.uk/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Research
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
