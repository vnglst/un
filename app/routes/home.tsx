import { getAllSpeeches, getCountries, getYears, getSessions } from "~/lib/database";
import { useState } from "react";
import { useSearchParams } from "react-router";
import Header from "~/components/header";
import Footer from "~/components/footer";
import SpeechCard from "~/components/speech-card";
import Pagination from "~/components/pagination";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Search, Filter } from "lucide-react";

export function meta() {
  return [
    { title: "UN General Assembly Speeches" },
    { name: "description", content: "Browse and search speeches from the UN General Assembly" },
  ];
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const country = url.searchParams.get("country") || "";
  const year = url.searchParams.get("year") ? parseInt(url.searchParams.get("year")!) : undefined;
  const session = url.searchParams.get("session") ? parseInt(url.searchParams.get("session")!) : undefined;
  const search = url.searchParams.get("search") || "";

  const filters = { country, year, session, search };
  const result = getAllSpeeches(page, 20, filters);
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

export default function Home({ loaderData }: { loaderData: any }) {
  const { speeches, pagination, countries, years, sessions, currentFilters } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    country: currentFilters.country || "",
    year: currentFilters.year?.toString() || "",
    session: currentFilters.session?.toString() || "",
    search: currentFilters.search || "",
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const newParams = new URLSearchParams();

    if (filters.country) newParams.set("country", filters.country);
    if (filters.year) newParams.set("year", filters.year);
    if (filters.session) newParams.set("session", filters.session);
    if (filters.search) newParams.set("search", filters.search);
    newParams.set("page", "1");

    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setFilters({ country: "", year: "", session: "", search: "" });
    setSearchParams({});
  };

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", page.toString());
    setSearchParams(newParams);
  };

  const hasActiveFilters = filters.country || filters.year || filters.session || filters.search;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">UN General Assembly Speeches</h1>
          <p className="text-gray-600">
            Explore {pagination.total} speeches from {years.length} years of United Nations General Assembly sessions
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Text</label>
              <Input
                placeholder="Search speeches..."
                value={filters.search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange("search", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <Select
                value={filters.country}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange("country", e.target.value)}
              >
                <option value="">All Countries</option>
                {countries.map((country: any) => (
                  <option key={country.country_code} value={country.country_name}>
                    {country.country_name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <Select
                value={filters.year}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange("year", e.target.value)}
              >
                <option value="">All Years</option>
                {years.map((year: any) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
              <Select
                value={filters.session}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange("session", e.target.value)}
              >
                <option value="">All Sessions</option>
                {sessions.map((session: any) => (
                  <option key={session} value={session}>
                    Session {session}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={applyFilters}>
              <Search className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{pagination.total} speeches found</h2>
          <p className="text-gray-600">
            Showing page {pagination.page} of {pagination.totalPages}
          </p>
        </div>

        {speeches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No speeches found matching your criteria.</p>
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-6 mb-8">
              {speeches.map((speech: any) => (
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
  );
}
