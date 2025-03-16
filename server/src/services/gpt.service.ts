import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Transcription } from './deepgram.service';
import { PromptService } from './prompt.service';

export interface ViralMoment {
  startTime: number;
  endTime: number;
  text: string;
  viralScore: number;
  reason: string;
}

@Injectable()
export class GptService {
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private promptService: PromptService
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async identifyViralMoments(
    transcription: Transcription,
    duration: number,
    count: number,
  ): Promise<ViralMoment[]> {
    try {
      const stringifiedTranscription = JSON.stringify(transcription.segments);
      
      const prompt = this.promptService.createPromptForViralSegments({
        stringifiedTranscription,
        desiredSegmentDuration: `${duration} seconds`,
      });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in viral video content creation. Your task is to analyze video transcripts and identify the most potentially viral moments that would make great short-form content.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from GPT');
      }

      const parsedResponse = JSON.parse(content);
      
      // Map the response to match our ViralMoment interface
      let viralMoments = parsedResponse.segments.map(segment => ({
        startTime: segment.start,
        endTime: segment.end,
        text: this.getTextForTimeRange(transcription, segment.start, segment.end),
        viralScore: 100 - ((segment.rank - 1) * 10), // Convert rank 1-10 to score 100-10
        reason: segment.reason
      }));

      // Ensure segments respect the requested duration
      viralMoments = this.adjustSegmentDurations(viralMoments, duration);
      
      return viralMoments;
    } catch (error) {
      console.error('Error identifying viral moments with GPT:', error);
      throw new Error(`Failed to identify viral moments: ${error.message}`);
    }
  }

  /**
   * Adjusts segment durations to match the requested duration
   * @param moments The viral moments to adjust
   * @param targetDuration The target duration in seconds
   * @returns Adjusted viral moments
   */
  private adjustSegmentDurations(moments: ViralMoment[], targetDuration: number): ViralMoment[] {
    return moments.map(moment => {
      const currentDuration = moment.endTime - moment.startTime;
      
      const lowerThreshold = targetDuration * 0.85;
      
      if (currentDuration < lowerThreshold) {
        console.log(`Segment too short (${currentDuration}s), extending to target ${targetDuration}s`);
        
        // Calculate how much to add on each side
        const additionalTime = targetDuration - currentDuration;
        const addToStart = additionalTime / 2;
        const addToEnd = additionalTime / 2;
        
        return {
          ...moment,
          startTime: Math.max(0, moment.startTime - addToStart),
          endTime: moment.endTime + addToEnd,
        };
      }
      
      // If the segment is already close to or longer than the target duration, keep it as is
      return moment;
    });
  }

  /**
   * Extracts text from transcription for a specific time range
   * @param transcription The full transcription
   * @param startTime Start time in seconds
   * @param endTime End time in seconds
   * @returns The text from the transcription within the time range
   */
  private getTextForTimeRange(
    transcription: Transcription,
    startTime: number,
    endTime: number
  ): string {
    // Filter segments that overlap with the time range
    const relevantSegments = transcription.segments.filter(segment => {
      return (segment.start <= endTime && segment.end >= startTime);
    });
    
    // Extract and join the text from relevant segments
    return relevantSegments.map(segment => segment.text).join(' ');
  }
} 