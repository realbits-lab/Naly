import { generateAIText } from "@/lib/ai";

export interface TranslationRequest {
	text: string;
	sourceLanguage: 'en' | 'ko';
	targetLanguage: 'en' | 'ko';
	context?: 'title' | 'content' | 'summary' | 'marketAnalysis' | 'investmentImplications';
}

export interface TranslationResult {
	originalText: string;
	translatedText: string;
	sourceLanguage: string;
	targetLanguage: string;
	quality: 'draft' | 'reviewed' | 'approved';
	translatedBy: 'ai';
}

export class TranslationService {
	private static instance: TranslationService;

	public static getInstance(): TranslationService {
		if (!TranslationService.instance) {
			TranslationService.instance = new TranslationService();
		}
		return TranslationService.instance;
	}

	/**
	 * Translate text from one language to another using AI
	 */
	async translateText({
		text,
		sourceLanguage,
		targetLanguage,
		context = 'content'
	}: TranslationRequest): Promise<TranslationResult> {
		if (sourceLanguage === targetLanguage) {
			return {
				originalText: text,
				translatedText: text,
				sourceLanguage,
				targetLanguage,
				quality: 'approved',
				translatedBy: 'ai'
			};
		}

		try {
			const translatedText = await this.performAITranslation(
				text,
				sourceLanguage,
				targetLanguage,
				context
			);

			return {
				originalText: text,
				translatedText,
				sourceLanguage,
				targetLanguage,
				quality: 'draft',
				translatedBy: 'ai'
			};
		} catch (error) {
			console.error('Translation failed:', error);
			throw new Error(`Translation from ${sourceLanguage} to ${targetLanguage} failed`);
		}
	}

	/**
	 * Translate an entire article with all its components
	 */
	async translateArticle(article: {
		title: string;
		content: string;
		summary?: string;
		marketAnalysis?: string;
		investmentImplications?: string;
	}, sourceLanguage: 'en' | 'ko', targetLanguage: 'en' | 'ko') {
		const translations = await Promise.all([
			this.translateText({
				text: article.title,
				sourceLanguage,
				targetLanguage,
				context: 'title'
			}),
			this.translateText({
				text: article.content,
				sourceLanguage,
				targetLanguage,
				context: 'content'
			}),
			article.summary ? this.translateText({
				text: article.summary,
				sourceLanguage,
				targetLanguage,
				context: 'summary'
			}) : null,
			article.marketAnalysis ? this.translateText({
				text: article.marketAnalysis,
				sourceLanguage,
				targetLanguage,
				context: 'marketAnalysis'
			}) : null,
			article.investmentImplications ? this.translateText({
				text: article.investmentImplications,
				sourceLanguage,
				targetLanguage,
				context: 'investmentImplications'
			}) : null,
		]);

		return {
			title: translations[0].translatedText,
			content: translations[1].translatedText,
			summary: translations[2]?.translatedText || undefined,
			marketAnalysis: translations[3]?.translatedText || undefined,
			investmentImplications: translations[4]?.translatedText || undefined,
			translationQuality: 'draft' as const,
			translatedBy: 'ai' as const,
		};
	}

	/**
	 * Perform the actual AI translation
	 */
	private async performAITranslation(
		text: string,
		sourceLanguage: string,
		targetLanguage: string,
		context: string
	): Promise<string> {
		const contextPrompts = {
			title: 'This is a financial news article title. Translate it to be compelling and accurate while maintaining the original meaning.',
			content: 'This is financial news article content. Translate it maintaining all technical terms, data, and financial concepts accurately.',
			summary: 'This is a financial article summary. Translate it concisely while preserving all key information.',
			marketAnalysis: 'This is market analysis content. Translate it preserving all technical financial terms and analytical insights.',
			investmentImplications: 'This is investment implications content. Translate it maintaining all financial recommendations and risks accurately.'
		};

		const languageNames = {
			en: 'English',
			ko: 'Korean'
		};

		const systemPrompt = `You are a professional financial translator specializing in ${languageNames[sourceLanguage as keyof typeof languageNames]} to ${languageNames[targetLanguage as keyof typeof languageNames]} translation.

		Key requirements:
		- Maintain accuracy of all financial terms, numbers, and data
		- Preserve the professional tone and style
		- Keep the original meaning and context
		- Use appropriate financial terminology in the target language
		- Do not add or remove information
		- Return only the translated text, no explanations or notes`;

		const userPrompt = `${contextPrompts[context as keyof typeof contextPrompts]}

		Source language: ${languageNames[sourceLanguage as keyof typeof languageNames]}
		Target language: ${languageNames[targetLanguage as keyof typeof languageNames]}

		Text to translate:
		${text}

		Provide only the translation:`;

		const translatedText = await generateAIText({
			prompt: userPrompt,
			temperature: 0.3, // Lower temperature for more consistent translations
			maxTokens: Math.min(Math.max(text.length * 2, 200), 4000), // Dynamic token limit based on input
		});

		// Clean up the response (remove any explanatory text)
		return translatedText.trim();
	}

	/**
	 * Batch translate multiple texts
	 */
	async batchTranslate(requests: TranslationRequest[]): Promise<TranslationResult[]> {
		const results = await Promise.allSettled(
			requests.map(request => this.translateText(request))
		);

		return results.map((result, index) => {
			if (result.status === 'fulfilled') {
				return result.value;
			} else {
				console.error(`Translation ${index} failed:`, result.reason);
				// Return original text as fallback
				return {
					originalText: requests[index].text,
					translatedText: requests[index].text,
					sourceLanguage: requests[index].sourceLanguage,
					targetLanguage: requests[index].targetLanguage,
					quality: 'draft' as const,
					translatedBy: 'ai' as const
				};
			}
		});
	}

	/**
	 * Validate translation quality (basic checks)
	 */
	validateTranslation(original: string, translated: string): {
		isValid: boolean;
		issues: string[];
	} {
		const issues: string[] = [];

		// Check if translation is too different in length
		const lengthRatio = translated.length / original.length;
		if (lengthRatio < 0.3 || lengthRatio > 3) {
			issues.push('Translation length seems unusual');
		}

		// Check if translation is empty
		if (!translated.trim()) {
			issues.push('Translation is empty');
		}

		// Check if translation is identical (might indicate failure)
		if (translated === original && original.length > 20) {
			issues.push('Translation appears identical to original');
		}

		return {
			isValid: issues.length === 0,
			issues
		};
	}
}

// Export singleton instance
export const translationService = TranslationService.getInstance();