import { Link } from 'react-router'
import { Calendar, User } from 'lucide-react'
import type { Speech, HighlightedSpeech } from '~/lib/database'

interface SpeechCardProps {
  speech: Speech | HighlightedSpeech
  highlighted?: boolean
}

export default function SpeechCard({
  speech,
  highlighted = false,
}: SpeechCardProps) {
  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  // Check if this is a highlighted speech
  const highlightedSpeech = speech as HighlightedSpeech
  const hasHighlights =
    highlighted &&
    (highlightedSpeech.highlighted_text ||
      highlightedSpeech.highlighted_speaker ||
      highlightedSpeech.highlighted_country_name)

  // Function to render text with HTML highlights
  const renderHighlightedText = (
    text: string | undefined,
    fallback: string,
    maxLength: number = 150
  ): { __html: string } => {
    if (!text) {
      return { __html: truncateText(fallback, maxLength) }
    }

    // If the highlighted text is too long, truncate it but preserve highlights
    if (text.length > maxLength) {
      const truncated = text.slice(0, maxLength) + '...'
      return { __html: truncated }
    }

    return { __html: text }
  }

  return (
    <Link to={`/speech/${speech.id}`} className="block">
      <div className="border border-gray-200 rounded p-4 hover:border-gray-300 transition-colors h-full flex flex-col">
        <div className="mb-3">
          <h3 className="font-medium text-black mb-2 line-clamp-2">
            {hasHighlights && highlightedSpeech.highlighted_country_name ? (
              <span
                dangerouslySetInnerHTML={{
                  __html: highlightedSpeech.highlighted_country_name,
                }}
              />
            ) : (
              speech.country_name || speech.country_code
            )}
          </h3>
          <div className="flex items-center text-sm text-gray-600 space-x-4">
            <span className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {speech.year}
            </span>
            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
              {speech.country_code}
            </span>
          </div>
        </div>

        <div className="flex-1">
          {speech.speaker && (
            <div className="flex items-center text-sm text-gray-600 mb-3">
              <User className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">
                {hasHighlights && highlightedSpeech.highlighted_speaker ? (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: highlightedSpeech.highlighted_speaker,
                    }}
                  />
                ) : (
                  speech.speaker
                )}
              </span>
            </div>
          )}

          {hasHighlights && highlightedSpeech.highlighted_text ? (
            <div
              className="text-gray-700 text-sm leading-relaxed"
              dangerouslySetInnerHTML={renderHighlightedText(
                highlightedSpeech.highlighted_text,
                speech.text,
                120
              )}
            />
          ) : (
            <p className="text-gray-700 text-sm leading-relaxed">
              {truncateText(speech.text, 150)}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
