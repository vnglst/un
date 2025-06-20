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
    <Link to={`/speech/${speech.id}`} className="block group">
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#009edb] hover:shadow-md transition-all duration-200 h-full flex flex-col">
        <div className="mb-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-bold text-gray-900 group-hover:text-[#009edb] transition-colors line-clamp-2">
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
            <span className="text-xs bg-[#009edb] text-white px-2 py-1 rounded-full font-medium ml-2 flex-shrink-0">
              {speech.country_code}
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-600 space-x-4">
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-[#009edb]" />
              {speech.year}
            </span>
            {speech.session && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                Session {speech.session}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1">
          {speech.speaker && (
            <div className="flex items-center text-sm text-gray-600 mb-4 pb-3 border-b border-gray-100">
              <User className="h-4 w-4 mr-2 text-[#009edb] flex-shrink-0" />
              <span className="truncate font-medium">
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
                140
              )}
            />
          ) : (
            <p className="text-gray-700 text-sm leading-relaxed">
              {truncateText(speech.text, 160)}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100">
          <span className="text-xs text-[#009edb] font-medium group-hover:text-[#009edb]/80 transition-colors">
            Read full speech →
          </span>
        </div>
      </div>
    </Link>
  )
}
