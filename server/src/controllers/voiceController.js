import { extractPreferencesFromText } from '../services/aiExtractor.js';

export const extractJobPreferences = async (req, res) => {
  try {
    const { transcript, language } = req.body;

    if (!transcript || typeof transcript !== 'string' || transcript.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'No voice transcript received. Please speak or type your job requirements.'
      });
    }

    const extracted = await extractPreferencesFromText(transcript);

    res.status(200).json({
      success: true,
      message: 'Job preferences successfully extracted!',
      preferences: {
        skill: extracted.skill,
        location: extracted.location,
        availability: extracted.availability,
        expected_wage: extracted.expected_wage,
        wage_type: extracted.wage_type,
        preferred_distance: extracted.preferred_distance
      },
      meta: {
        extractor: extracted.extractor,
        originalTranscript: transcript,
        detectedLanguage: language || (/[a-zA-Z]/.test(transcript) ? 'en-IN' : 'hi-IN')
      }
    });
  } catch (error) {
    console.error('extractJobPreferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process voice request: ' + error.message,
      fallback: {
        skill: 'Electrician',
        location: 'Sector 62',
        availability: 'Immediate',
        expected_wage: 800,
        wage_type: 'daily',
        preferred_distance: 5
      }
    });
  }
};
