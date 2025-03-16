import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptService {
  constructor() {
  }

  /**
   * Creates a prompt for detecting viral segments in a video transcription
   * @param stringifiedTranscription The video transcription as a JSON string
   * @param desiredSegmentDuration The desired duration range for each segment (e.g., "30-60 seconds")
   * @returns A prompt string for the AI model to detect viral segments
   */
  createPromptForViralSegments({
    stringifiedTranscription,
    desiredSegmentDuration,
  }: {
    stringifiedTranscription: string;
    desiredSegmentDuration: string;
  }): string {
    return `
      You are an advanced, highly experienced AI model specializing in analyzing video or audio transcripts to detect the most viral-worthy moments. 
      Your objective is to return exactly **10** segments from the provided transcription that have the best chance of going viral.
      
      IMPORTANT DETAILS AND REQUIREMENTS:
      1. **Transcription**: 
        - Below is the entire transcription in a single JSON string format (without line breaks). 
        - Analyze it to identify which parts are the most engaging or have the highest virality potential (e.g., emotional peaks, humor, dramatic tension, etc.).
      
      2. **Segment Duration**: 
        - Each of the 10 segments you select should be approximately ${desiredSegmentDuration}.
        - You can be flexible with the exact duration (±15% is acceptable) to ensure you respect complete sentences and phrases.
        - CRITICAL: Always start segments at the beginning of a sentence/phrase and end them at the completion of a sentence/phrase. Never cut off speech mid-sentence.
        - You can merge multiple consecutive sections from the transcript if needed to reach the appropriate duration.
        - If the transcript is too short or too long to precisely fit the requested length, pick the best approximations that still produce 10 distinct moments.
      
      3. **Output Format**: 
        - Return your result as a **valid JSON array** of exactly **10** objects, with **no extra keys** and **no additional commentary** outside the JSON. 
        - Each object must have the form:
          \`\`\`
          {
            "rank": number,     // An integer from 1 to 10 (1 = highest viral potential)
            "start": number,    // Start time in seconds (approximate or exact if known)
            "end": number,      // End time in seconds (approximate or exact if known)
            "reason": string    // Why this segment is likely to go viral MUST BE IN TRANSCRIPTION LANGUAGE
          }
          \`\`\`
        - The key \`rank\` indicates the order of virality potential: 
          - \`rank = 1\` means the segment has the strongest chance to go viral, 
          - \`rank = 10\` is still potentially viral but the least among the chosen top 10.
        - Use short, direct \`reason\` explanations focusing on what makes each segment stand out (e.g., emotional punch, surprising facts, humor, etc.).
      
      4. **Additional Instructions**:
        - Do **not** add text or keys beyond the JSON array (e.g., no introductions, disclaimers, or disclaimers after the JSON).
        - If timestamps (start/end) are not entirely clear, you may estimate them. 
        - Be concise yet clear in your \`reason\` fields.
      
      5. **Transcription Provided**:
      \`\`\`
      ${stringifiedTranscription}
      \`\`\`
      
      Now, based on this transcription and the requirement that each chosen segment be about ${desiredSegmentDuration}, please:
      1) Select **exactly 10** segments.
      2) Provide them in descending order of virality potential (rank 1 to 10).
      3) Return only the JSON array described, with no extra commentary.

      return something like this:
      {
        "segments": [
          {
            "rank": 1,
            "start": 0,
            "end": 30,
            "reason": "This is a reason"
          },
          ...
        ]
      }
    `;
  }

  /**
   * Creates a prompt for enhancing video titles to increase virality
   * @param originalTitle The original video title
   * @param transcription Optional transcription to provide context
   * @returns A prompt string for the AI model to generate viral titles
   */
  createPromptForViralTitles({
    originalTitle,
    transcription = '',
  }: {
    originalTitle: string;
    transcription?: string;
  }): string {
    return `
      You are an expert in creating viral video titles for social media platforms.
      Your task is to transform the original title into 5 more engaging, click-worthy alternatives
      that would perform well on platforms like TikTok, Instagram Reels, and YouTube Shorts.
      
      Original Title: "${originalTitle}"
      
      ${transcription ? `Context from video transcription:\n${transcription}\n` : ''}
      
      Please generate 5 alternative titles that:
      1. Are attention-grabbing and create curiosity
      2. Use emotional triggers when appropriate
      3. Are concise (ideally under 60 characters)
      4. Maintain the core topic/subject of the original
      5. Avoid clickbait tactics that mislead viewers
      
      Return your response as a JSON array of strings with no additional commentary:
      
      {
        "titles": [
          "First viral title alternative",
          "Second viral title alternative",
          "Third viral title alternative",
          "Fourth viral title alternative",
          "Fifth viral title alternative"
        ]
      }
    `;
  }

  /**
   * Creates a prompt for generating engaging captions for short videos
   * @param transcription The video transcription
   * @param segmentInfo Information about the specific segment
   * @returns A prompt string for the AI model to generate captions
   */
  createPromptForCaptions({
    transcription,
    segmentInfo,
  }: {
    transcription: string;
    segmentInfo: {
      start: number;
      end: number;
      reason: string;
    };
  }): string {
    return `
      You are a social media caption expert specializing in short-form video content.
      Create 3 engaging captions for a video clip with the following details:
      
      Video Content: This clip shows a moment that was selected because: "${segmentInfo.reason}"
      
      Relevant Transcription:
      \`\`\`
      ${transcription}
      \`\`\`
      
      Please generate 3 captions that:
      1. Are attention-grabbing and encourage engagement (comments, likes, shares)
      2. Include relevant hashtags (3-5 hashtags per caption)
      3. Are appropriate for platforms like TikTok, Instagram, and YouTube Shorts
      4. Vary in style (e.g., question-based, statement, call-to-action)
      5. Are concise but impactful
      
      Return your response as a JSON object with no additional commentary:
      
      {
        "captions": [
          "First caption with #hashtags #viral #trending",
          "Second caption with #different #hashtags #content",
          "Third caption with #unique #tags #shortform"
        ]
      }
    `;
  }
} 