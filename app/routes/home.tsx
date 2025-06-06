import { getAllSpeeches, Speech, PaginationInfo } from "~/lib/database";
import { useLoaderData } from "react-router";
import Header from "~/components/header";
import Footer from "~/components/footer";
import SpeechCard from "~/components/speech-card";
import Pagination from "~/components/pagination";

type LoaderData = {
  speeches: Speech[];
  pagination: PaginationInfo;
};

export function meta() {
  return [
    { title: "UN General Assembly Speeches" },
    { name: "description", content: "Browse and search speeches from the UN General Assembly" },
  ];
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");

  const result = getAllSpeeches(page, 20);

  return {
    ...result,
  };
}

export default function Home() {
  const { speeches, pagination } = useLoaderData<LoaderData>();

  const handlePageChange = (page: number) => {
    window.location.href = `/?page=${page}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">UN General Assembly Speeches</h1>
          <p className="text-gray-600">Explore {pagination.total} speeches from the United Nations General Assembly</p>
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
            <p className="text-gray-500 text-lg">No speeches found.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 mb-8">
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
  );
}
