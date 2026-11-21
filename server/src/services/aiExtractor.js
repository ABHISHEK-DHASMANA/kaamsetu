// Natural Language & Voice Job Preference Extractor for KAAMSETU
// Supports both Gemini API (when configured) and an intelligent dual-language (Hindi/English) regex & NLP fallback engine.

export const extractPreferencesFromText = async (transcriptText) => {
  if (!transcriptText || typeof transcriptText !== 'string' || transcriptText.trim() === '') {
    throw new Error('Empty voice transcript received.');
  }

  const text = transcriptText.trim();

  // If Gemini API Key is configured, attempt LLM extraction
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5) {
    try {
      const result = await extractWithGemini(text);
      if (result && result.skill) {
        return {
          ...result,
          extractor: 'Gemini AI API',
          sourceText: text
        };
      }
    } catch (err) {
      console.warn('[AI Extractor] Gemini API extraction failed, using deterministic NLP engine:', err.message);
    }
  }

  // Deterministic NLP Rule-Engine (handles Hindi / Hinglish / English)
  const fallbackResult = extractWithDeterministicNLP(text);
  return {
    ...fallbackResult,
    extractor: 'Kaamsetu Hybrid NLP Engine (Local)',
    sourceText: text
  };
};

/**
 * Calls Gemini API if configured
 */
const extractWithGemini = async (text) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const prompt = `You are the AI Parser for KAAMSETU, India's hyperlocal employment network.
Extract the worker's job preferences from the following voice transcript (Hindi or English).
Return ONLY a valid JSON object with these keys:
{
  "skill": string (Standard capitalized trade, e.g. "Electrician", "Plumber", "Carpenter", "Painter", "Mason", "Delivery", "Mechanic", "Cleaner", "Welder", or "General Worker"),
  "location": string (Location or sector mentioned, e.g. "Sector 62", "Indirapuram", "Noida", or "Nearby"),
  "availability": string ("Immediate", "Tomorrow", "Next Week", or "Flexible"),
  "expected_wage": number (Extracted daily wage number in INR, default 800 if unspecified),
  "wage_type": string ("daily" or "monthly"),
  "preferred_distance": number (Max distance in km, default 5 to 10)
}

Transcript: "${text}"`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini HTTP error ${response.status}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(rawText);
};

/**
 * Intelligent Local NLP Extractor supporting Hindi, Hinglish and English
 */
export const extractWithDeterministicNLP = (raw) => {
  const text = raw.toLowerCase();

  // 1. Skill Extraction
  let skill = 'General Worker';
  const skillMappings = [
    { name: 'Electrician', patterns: ['electrician', 'bijli', 'wireman', 'wiring', 'बिजली', 'इलेक्ट्रिशियन', 'मीटर', 'इलेक्ट्रिक'] },
    { name: 'Plumber', patterns: ['plumber', 'nal', 'paani', 'pipe', 'plumbing', 'प्लंबर', 'नल', 'पाइप', 'सीवरेज'] },
    { name: 'Carpenter', patterns: ['carpenter', 'badhai', 'lakdi', 'furniture', 'बढ़ई', 'कारपेंटर', 'लकड़ी'] },
    { name: 'Painter', patterns: ['painter', 'paint', 'rangai', 'putty', 'white wash', 'पेंटर', 'रंगाई', 'सफेदी'] },
    { name: 'Mason', patterns: ['mason', 'rajmistri', 'construction', 'cement', 'eet', 'tile', 'राजमिस्त्री', 'मजदूर', 'कंस्ट्रक्शन'] },
    { name: 'Mechanic', patterns: ['mechanic', 'auto', 'bike', 'motor', 'car repair', 'मैकेनिक', 'गाड़ी रिपेयर'] },
    { name: 'Driver', patterns: ['driver', 'delivery', 'rider', 'chalak', 'van', 'ड्राइवर', 'डिलीवरी'] },
    { name: 'Cleaner', patterns: ['cleaner', 'safai', 'cleaning', 'housekeeping', 'झाड़ू', 'सफाई', 'क्लीनर'] },
    { name: 'Welder', patterns: ['welder', 'welding', 'iron', 'fabrication', 'वेल्डर', 'वेल्डिंग'] }
  ];

  for (const item of skillMappings) {
    if (item.patterns.some(pattern => text.includes(pattern))) {
      skill = item.name;
      break;
    }
  }

  // 2. Location Extraction
  let location = 'Noida Sector 62';
  const locationPatterns = [
    { name: 'Sector 62', patterns: ['sector 62', 'sec 62', 'सेक्टर 62', 'sector-62'] },
    { name: 'Sector 63', patterns: ['sector 63', 'sec 63', 'सेक्टर 63', 'sector-63'] },
    { name: 'Sector 18', patterns: ['sector 18', 'sec 18', 'सेक्टर 18', 'atta market'] },
    { name: 'Sector 50', patterns: ['sector 50', 'sec 50', 'सेक्टर 50'] },
    { name: 'Indirapuram', patterns: ['indirapuram', 'इन्दिरापुरम', 'इंदिरापुरम'] },
    { name: 'Vaishali', patterns: ['vaishali', 'वैशाली'] },
    { name: 'Ghaziabad', patterns: ['ghaziabad', 'गाजियाबाद'] },
    { name: 'Greater Noida', patterns: ['greater noida', 'ग्रेनो', 'ग्रेटर नोएडा'] },
    { name: 'Noida', patterns: ['noida', 'नोएडा'] },
    { name: 'Delhi', patterns: ['delhi', 'anand vihar', 'laxmi nagar', 'दिल्ली'] }
  ];

  for (const loc of locationPatterns) {
    if (loc.patterns.some(p => text.includes(p))) {
      location = loc.name;
      break;
    }
  }

  // 3. Wage Extraction
  let expectedWage = 800;
  let wageType = 'daily';

  if (text.includes('mahina') || text.includes('month') || text.includes('monthly') || text.includes('महीना')) {
    wageType = 'monthly';
    expectedWage = 20000;
  }

  // Look for currency patterns: e.g. 800 rupaye, ₹800, 950 per day, 700 rs
  const wageMatch = text.match(/(?:(?:rs\.?|inr|₹|rupaye|rupees)\s*(\d{3,6}))|(\d{3,6})\s*(?:rs\.?|inr|₹|rupaye|rupees|\/-\s*|per day|daily|rozana|din)/i)
    || text.match(/(\d{3,5})\s*(?:kaam|chahiye|mein)/i);

  if (wageMatch) {
    const rawVal = wageMatch[1] || wageMatch[2];
    if (rawVal) {
      const parsed = parseInt(rawVal, 10);
      if (parsed >= 300 && parsed <= 50000) {
        expectedWage = parsed;
      }
    }
  }

  // 4. Availability Extraction
  let availability = 'Immediate';
  if (text.includes('kal') || text.includes('tomorrow') || text.includes('कल')) {
    availability = 'Tomorrow';
  } else if (text.includes('parso') || text.includes('day after') || text.includes('परसों')) {
    availability = 'In 2 Days';
  } else if (text.includes('agle hafte') || text.includes('next week') || text.includes('अगले हफ्ते')) {
    availability = 'Next Week';
  } else if (text.includes('aaj') || text.includes('today') || text.includes('abhi') || text.includes('आज')) {
    availability = 'Immediate';
  }

  // 5. Distance Extraction
  let preferredDistance = 5;
  const distMatch = text.match(/(\d{1,2})\s*(?:km|kilometre|kilometer|किमी)/i)
    || text.match(/(?:five|5|ten|10|do|char|paanch)\s*(?:km|kilometre)/i);

  if (distMatch) {
    const dVal = parseInt(distMatch[1], 10);
    if (!isNaN(dVal) && dVal > 0 && dVal <= 50) {
      preferredDistance = dVal;
    }
  } else if (text.includes('paas') || text.includes('nearby') || text.includes('aas paas')) {
    preferredDistance = 5;
  }

  return {
    skill,
    location,
    availability,
    expected_wage: expectedWage,
    wage_type: wageType,
    preferred_distance: preferredDistance
  };
};
