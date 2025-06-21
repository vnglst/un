import PageLayout from '~/components/page-layout'
import { Globe, Search, Database, Users } from 'lucide-react'
import { Link } from 'react-router'
import { FeatureCard } from '~/components/ui/cards'

export function meta() {
  return [
    { title: 'About - UN Speeches' },
    {
      name: 'description',
      content:
        'Learn about the UN Speeches database and our mission to make diplomatic discourse accessible.',
    },
  ]
}

export default function About() {
  return (
    <PageLayout>
      {/* Breadcrumb Navigation */}
      <div className="py-4">
        <div className="flex items-center text-sm text-gray-600">
          <Link to="/" className="hover:text-[#009edb] transition-colors">
            HOME
          </Link>
          <span className="mx-2">&gt;</span>
          <span className="text-gray-900 font-medium">ABOUT</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          About UN Speeches Database
        </h1>
        <p className="text-lg text-gray-700 mb-6 max-w-4xl">
          Our comprehensive platform provides unprecedented access to United
          Nations General Assembly speeches, enabling researchers, diplomats,
          journalists, and citizens to explore decades of international
          discourse and diplomatic engagement.
        </p>
      </div>

      {/* Mission Statement */}
      <div className="bg-white rounded-lg p-8 mb-12 shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
        <p className="text-gray-700 leading-relaxed">
          We believe that access to diplomatic discourse is fundamental to
          understanding global affairs. By making UN General Assembly speeches
          searchable and accessible, we aim to foster greater transparency in
          international relations and enable deeper analysis of how nations
          address shared global challenges.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <FeatureCard
          title="Comprehensive Archive"
          description="Complete collection of UN General Assembly speeches spanning multiple decades"
          icon={<Database className="h-8 w-8 text-white" />}
        />

        <FeatureCard
          title="Advanced Search"
          description="Powerful search capabilities with full-text search, filtering, and highlighting"
          icon={<Search className="h-8 w-8 text-white" />}
        />

        <FeatureCard
          title="Global Coverage"
          description="Speeches from all UN member states providing diverse perspectives"
          icon={<Globe className="h-8 w-8 text-white" />}
        />

        <FeatureCard
          title="Open Access"
          description="Free and open access to diplomatic discourse for all users worldwide"
          icon={<Users className="h-8 w-8 text-white" />}
        />
      </div>

      {/* Data Source Information */}
      <div className="bg-gradient-to-r from-[#009edb] to-[#009edb]/90 rounded-lg p-12 text-white mb-16">
        <h2 className="text-3xl font-bold mb-6">Data Sources & Methodology</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">
              Official UN Documentation
            </h3>
            <p className="text-white/90 mb-4">
              All speeches are sourced directly from the official United Nations
              Documentation Centre, ensuring authenticity and accuracy of the
              diplomatic record.
            </p>
            <ul className="space-y-2 text-white/80">
              <li>• General Assembly Official Records</li>
              <li>• Verbatim transcripts and meeting minutes</li>
              <li>• Complete speaker identification</li>
              <li>• Session and year classification</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Technical Implementation</h3>
            <p className="text-white/90 mb-4">
              Our platform uses advanced search technologies to make diplomatic
              discourse accessible and analyzable for researchers and the
              public.
            </p>
            <ul className="space-y-2 text-white/80">
              <li>• Full-text search with highlighting</li>
              <li>• Multi-language support</li>
              <li>• Advanced filtering capabilities</li>
              <li>• Real-time search suggestions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Contact & Support
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Research Inquiries
            </h3>
            <p className="text-gray-700 mb-4">
              For questions about data sources, methodology, or research
              collaboration opportunities.
            </p>
            <p className="text-[#009edb] font-medium">
              research@unspeeches.org
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Technical Support
            </h3>
            <p className="text-gray-700 mb-4">
              For assistance with search functionality, data access, or
              technical issues.
            </p>
            <p className="text-[#009edb] font-medium">support@unspeeches.org</p>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
