import { useLoaderData, useNavigate, useSearchParams, Form } from "react-router";
import {
  searchSpeeches,
  getCountries,
  getYears,
  getSessions,
  type Speech,
  type PaginationInfo,
  type SearchFilters,
} from "~/lib/database";
import Header from "~/components/header";
import Footer from "~/components/footer";
import StarField from "~/components/star-field";
import SpeechCard from "~/components/speech-card";
import Pagination from "~/components/pagination";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Search as SearchIcon, Filter, X } from "lucide-react";
import { useState, useEffect } from "react";

type LoaderData = {
  speeches: Speech[];
  pagination: PaginationInfo;
  countries: Array<{ country_name: string; country_code: string }>;
  years: number[];
  sessions: number[];
  currentFilters: SearchFilters;
};

export function meta() {
  return [
    { title: "Search UN General Assembly Speeches" },
    {
      name: "description",
      content: "Search through thousands of UN General Assembly speeches by text, country, year, or session.",
    },
  ];
}

export async function loader({ request }: { request: Request }): Promise<LoaderData> {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));

  // Extract search filters from URL parameters
  const filters: SearchFilters = {
    search: url.searchParams.get("q") || undefined,
    country: url.searchParams.get("country") || undefined,
    year: url.searchParams.get("year") ? parseInt(url.searchParams.get("year")!, 10) : undefined,
    session: url.searchParams.get("session") ? parseInt(url.searchParams.get("session")!, 10) : undefined,
  };

  const result = searchSpeeches(filters, page, 20);
  const countries = getCountries();
  const years = getYears();
  const sessions = getSessions();

  return {
    ...result,
    countries,
    years,
    sessions,
    currentFilters: filters,
  };
}

export default function Search() {
  const { speeches, pagination, countries, years, sessions, currentFilters } = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // Local state for form inputs
  const [searchQuery, setSearchQuery] = useState(currentFilters.search || "");
  const [selectedCountry, setSelectedCountry] = useState(currentFilters.country || "");
  const [selectedYear, setSelectedYear] = useState(currentFilters.year?.toString() || "");
  const [selectedSession, setSelectedSession] = useState(currentFilters.session?.toString() || "");

  // Update local state when URL changes
  useEffect(() => {
    setSearchQuery(currentFilters.search || "");
    setSelectedCountry(currentFilters.country || "");
    setSelectedYear(currentFilters.year?.toString() || "");
    setSelectedSession(currentFilters.session?.toString() || "");
  }, [currentFilters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (selectedCountry) params.set("country", selectedCountry);
    if (selectedYear) params.set("year", selectedYear);
    if (selectedSession) params.set("session", selectedSession);

    navigate(`/search?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    navigate(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCountry("");
    setSelectedYear("");
    setSelectedSession("");
    navigate("/search");
  };

  const hasActiveFilters =
    currentFilters.search || currentFilters.country || currentFilters.year || currentFilters.session;

  return (
    <>
      <StarField />

      <div className="min-h-screen flex flex-col bg-transparent relative z-10">
        <Header />

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Search UN Speeches</h1>
            <p className="text-gray-300">
              Search through thousands of speeches from the United Nations General Assembly
            </p>
          </div>

          {/* Search Form */}
          <Card className="bg-gray-800 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <SearchIcon className="h-5 w-5" />
                  <span>Search & Filter</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-white hover:text-un-light-blue"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  {showFilters ? "Hide" : "Show"} Filters
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form onSubmit={handleSearch} className="space-y-4">
                {/* Main search input */}
                <div>
                  <Input
                    type="text"
                    placeholder="Search speeches, speakers, or countries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>

                {/* Advanced filters */}
                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-600">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                      <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="w-full h-9 rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-un-blue"
                      >
                        <option value="">All countries</option>
                        {countries.map((country) => (
                          <option key={country.country_code} value={country.country_code}>
                            {country.country_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full h-9 rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-un-blue"
                      >
                        <option value="">All years</option>
                        {years.map((year) => (
                          <option key={year} value={year.toString()}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Session</label>
                      <select
                        value={selectedSession}
                        onChange={(e) => setSelectedSession(e.target.value)}
                        className="w-full h-9 rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-un-blue"
                      >
                        <option value="">All sessions</option>
                        {sessions.map((session) => (
                          <option key={session} value={session.toString()}>
                            Session {session}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-4">
                  <div className="flex space-x-2">
                    <Button type="submit" className="bg-un-blue hover:bg-un-dark-blue">
                      <SearchIcon className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                    {hasActiveFilters && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={clearFilters}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white bg-transparent"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </Form>
            </CardContent>
          </Card>

          {/* Results */}
          {hasActiveFilters && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                {pagination.total} {pagination.total === 1 ? "speech" : "speeches"} found
              </h2>
              <p className="text-gray-300">
                Showing page {pagination.page} of {pagination.totalPages}
              </p>

              {/* Active filters display */}
              <div className="flex flex-wrap gap-2 mt-3">
                {currentFilters.search && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-un-blue text-white">
                    Text: "{currentFilters.search}"
                  </span>
                )}
                {currentFilters.country && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-un-blue text-white">
                    Country:{" "}
                    {countries.find((c) => c.country_code === currentFilters.country)?.country_name ||
                      currentFilters.country}
                  </span>
                )}
                {currentFilters.year && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-un-blue text-white">
                    Year: {currentFilters.year}
                  </span>
                )}
                {currentFilters.session && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-un-blue text-white">
                    Session: {currentFilters.session}
                  </span>
                )}
              </div>
            </div>
          )}

          {speeches.length === 0 ? (
            <div className="text-center py-12">
              <SearchIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">
                {hasActiveFilters ? "No speeches match your search criteria" : "Start searching to find speeches"}
              </p>
              <p className="text-gray-500">
                {hasActiveFilters
                  ? "Try adjusting your filters or search terms"
                  : "Use the search box above to find speeches by text, speaker, or country"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {speeches.map((speech: Speech) => (
                  <SpeechCard key={speech.id} speech={speech} />
                ))}
              </div>

              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
