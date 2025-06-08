import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Calendar, User, FileText } from "lucide-react";
import type { Speech } from "~/lib/database";

interface SpeechCardProps {
  speech: Speech;
}

export default function SpeechCard({ speech }: SpeechCardProps) {
  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 bg-gray-800 border-gray-700 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg text-white leading-tight">
              <Link to={`/speech/${speech.id}`} className="hover:underline hover:text-un-light-blue">
                {speech.country_name || speech.country_code}
              </Link>
            </CardTitle>
            <CardDescription className="flex items-center space-x-4 mt-2 text-gray-400">
              <span className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{speech.year}</span>
              </span>
              <span className="flex items-center space-x-1">
                <FileText className="h-4 w-4" />
                <span>Session {speech.session}</span>
              </span>
            </CardDescription>
          </div>
          <div className="text-xs bg-un-blue text-white px-2 py-1 rounded flex-shrink-0">{speech.country_code}</div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between pt-0">
        <div>
          {speech.speaker && (
            <div className="flex items-center space-x-1 text-sm text-gray-400 mb-3">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{speech.speaker}</span>
              {speech.post && <span className="text-gray-500">• {speech.post}</span>}
            </div>
          )}
          <p className="text-gray-300 leading-relaxed text-sm mb-4">{truncateText(speech.text, 150)}</p>
        </div>
        <Link
          to={`/speech/${speech.id}`}
          className="inline-block text-un-blue hover:text-un-light-blue font-medium text-sm mt-auto"
        >
          Read full speech →
        </Link>
      </CardContent>
    </Card>
  );
}
