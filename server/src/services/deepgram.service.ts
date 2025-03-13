import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@deepgram/sdk';

export interface TranscriptionWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface TranscriptionSegment {
  text: string;
  words: TranscriptionWord[];
  start: number;
  end: number;
  confidence: number;
}

export interface Transcription {
  segments: TranscriptionSegment[];
  text: string;
}

interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

interface DeepgramUtterance {
  text: string | undefined;
  start: number;
  end: number;
  confidence: number;
  words: DeepgramWord[];
  speaker?: number;
}

interface DeepgramResult {
  metadata: {
    transaction_key: string;
    request_id: string;
    sha256: string;
    created: string;
    duration: number;
    channels: number;
  };
  results: {
    channels: Array<{
      alternatives: Array<{
        transcript: string;
        confidence: number;
        words: DeepgramWord[];
      }>;
    }>;
    utterances: DeepgramUtterance[];
  };
}

@Injectable()
export class DeepgramService {
  private deepgramClient: ReturnType<typeof createClient>;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('DEEPGRAM_API_KEY');
    this.deepgramClient = createClient(apiKey);
  }

  async transcribeVideo(videoUrl: string): Promise<Transcription> {
    try {
      const { result, error } = await this.deepgramClient.listen.prerecorded.transcribeUrl(
        { url: videoUrl },
        {
          punctuate: true,
          utterances: true,
          diarize: true,
          model: 'nova-2',
          language: 'fr',
          detect_language: true,
          smart_format: true,
          filler_words: true,
        }
      );

      if (error) {
        throw new Error(`Deepgram API error: ${error}`);
      }
      
      if (!result) {
        throw new Error('No transcription results found');
      }

      console.log('Transcription result:', result);
      
      // Traiter la réponse selon la nouvelle structure
      const typedResult = result as unknown as DeepgramResult;
      
      // Extraire le texte complet de la transcription
      const transcript = typedResult.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
      
      // Extraire les segments à partir des utterances
      const utterances = typedResult.results?.utterances || [];
      
      // Filtrer les segments qui ont un texte undefined ou vide
      const segments = utterances
        .filter(utterance => {
          // Vérifier si l'utterance a du texte ou des mots
          const hasText = utterance.text !== undefined && utterance.text.trim() !== '';
          const hasWords = utterance.words && utterance.words.length > 0;
          return hasText || hasWords;
        })
        .map(utterance => {
          // Si le texte est undefined mais qu'il y a des mots, reconstruire le texte à partir des mots
          let segmentText = utterance.text;
          if (segmentText === undefined || segmentText.trim() === '') {
            segmentText = (utterance.words || [])
              .map(word => word.word)
              .join(' ');
          }
          
          return {
            text: segmentText || '(inaudible)',
            words: (utterance.words || []).map(word => ({
              word: word.word,
              start: word.start,
              end: word.end,
              confidence: word.confidence || 0,
            })),
            start: utterance.start,
            end: utterance.end,
            confidence: utterance.confidence || 0,
          };
        });
      
      const transcription = {
        segments,
        text: transcript || segments.map(s => s.text).join(' '),
      };
      
      console.log('Processed transcription:', {
        segmentsCount: transcription.segments.length,
        textLength: transcription.text.length,
        firstSegment: transcription.segments[0] || 'No segments',
      });
      
      return transcription;
    } catch (error) {
      console.error('Error transcribing video with Deepgram:', error);
      throw new Error(`Failed to transcribe video: ${error.message}`);
    }
  }
} 