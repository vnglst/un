import { getSpeechById } from "~/lib/database";
import { data } from "react-router";
import Header from "~/components/header";
import Footer from "~/components/footer";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Calendar, User, MapPin, FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router";

export function meta({ loaderData }: { loaderData: any }) {
  if (!loaderData.speech) {
    return [{ title: "Speech Not Found" }];
  }

  return [
    { title: `${loaderData.speech.country_name} - ${loaderData.speech.year} UN Speech` },
    {
      name: "description",
      content: `Speech by ${loaderData.speech.speaker || loaderData.speech.country_name} at the ${
        loaderData.speech.year
      } UN General Assembly, Session ${loaderData.speech.session}`,
    },
  ];
}

export async function loader({ params }: { params: any }) {
  const speechId = parseInt(params.id);
  const speech = getSpeechById(speechId);

  if (!speech) {
    throw data("Speech not found", { status: 404 });
  }

  return { speech };
}

export default function SpeechDetail({ loaderData }: { loaderData: any }) {
  const { speech } = loaderData;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Speeches
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="border-b bg-gradient-to-r from-un-blue to-un-dark-blue text-white">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{speech.country_name || speech.country_code}</CardTitle>
                <div className="flex flex-wrap items-center gap-4 text-sm opacity-90">
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{speech.year}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>Session {speech.session}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{speech.country_code}</span>
                  </span>
                </div>
              </div>
            </div>

            {speech.speaker && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{speech.speaker}</span>
                  {speech.post && (
                    <>
                      <span>•</span>
                      <span>{speech.post}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-8">
            <div className="prose prose-lg max-w-none">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{speech.text}</div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to All Speeches
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
