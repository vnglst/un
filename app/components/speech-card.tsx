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
    <Card className="hover:shadow-lg transition-shadow duration-200 bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg text-white">
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
          <div className="text-xs bg-un-blue text-white px-2 py-1 rounded">{speech.country_code}</div>
        </div>
      </CardHeader>
      <CardContent>
        {speech.speaker && (
          <div className="flex items-center space-x-1 text-sm text-gray-400 mb-2">
            <User className="h-4 w-4" />
            <span>{speech.speaker}</span>
            {speech.post && <span>• {speech.post}</span>}
          </div>
        )}
        <p className="text-gray-300 leading-relaxed">{truncateText(speech.text)}</p>
        <Link
          to={`/speech/${speech.id}`}
          className="inline-block mt-3 text-un-blue hover:text-un-light-blue font-medium text-sm"
        >
          Read full speech →
        </Link>
      </CardContent>
    </Card>
  );
}
