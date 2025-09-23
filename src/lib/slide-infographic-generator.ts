import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

interface SlideData {
	title: string;
	summary: string;
	keyPoints: string[];
	sentiment: "positive" | "negative" | "neutral";
	entities: string[];
	keywords: string[];
	marketAnalysis?: string;
	investmentImplications?: string;
	wordCount?: number;
	readingTime?: number;
	companyName?: string;
}

interface SlideContent {
	slideNumber: number;
	title: string;
	content: string;
	visualType: 'title' | 'keyPoints' | 'chart' | 'grid' | 'summary' | 'conclusion';
	data?: any;
}

export class SlideInfographicGenerator {
	private apiKey?: string;

	constructor(apiKey?: string) {
		this.apiKey = apiKey || process.env.OPENAI_API_KEY;
	}

	async generateSlides(data: SlideData): Promise<SlideContent[]> {
		// Try to use AI to generate slide content
		if (this.apiKey) {
			try {
				const aiSlides = await this.generateAISlides(data);
				if (aiSlides && aiSlides.length > 0) {
					return aiSlides;
				}
			} catch (error) {
				console.error('Failed to generate AI slides:', error);
			}
		}

		// Fallback to rule-based generation
		return this.generateRuleBasedSlides(data);
	}

	private async generateAISlides(data: SlideData): Promise<SlideContent[]> {
		const prompt = `You are an expert presentation designer following Guy Kawasaki's 10-20-30 rule and modern infographic design principles.

Transform the following financial article data into a PowerPoint-style slide presentation with 6 slides maximum.

ARTICLE DATA:
Title: ${data.title}
Company: ${data.companyName || 'N/A'}
Summary: ${data.summary}
Sentiment: ${data.sentiment}
Key Points: ${data.keyPoints.join('; ')}
Entities: ${data.entities.join(', ')}
Keywords: ${data.keywords.join(', ')}

DESIGN PRINCIPLES TO FOLLOW:
1. Minimalist design - remove unnecessary elements
2. Clear visual hierarchy - largest to smallest importance
3. 30-point minimum font concept - keep text large and readable
4. One key concept per slide
5. Use data visualization where appropriate
6. Maintain consistent color scheme based on sentiment (green=positive, red=negative, blue=neutral)

REQUIRED OUTPUT FORMAT (JSON):
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Brief, impactful slide title (max 8 words)",
      "content": "Concise content (max 30 words). Use bullet points format with • symbol",
      "visualType": "title|keyPoints|chart|grid|summary|conclusion",
      "data": {
        "points": ["for keyPoints type - max 3 points, each under 10 words"],
        "chartData": [{"label": "...", "value": number}],
        "gridItems": [{"title": "...", "description": "max 15 words"}]
      }
    }
  ]
}

SLIDE STRUCTURE GUIDELINES:
Slide 1: Title slide with company and main message
Slide 2: Key insights (3 bullet points max)
Slide 3: Data visualization (chart or metrics grid)
Slide 4: Market impact summary (2-3 concise points)
Slide 5: Investment implications (actionable insights)
Slide 6: Conclusion with sentiment indicator

Keep all text extremely concise. Each slide should be understandable in 5 seconds.`;

		const { text } = await generateText({
			model: openai("gpt-4") as any,
			prompt,
			temperature: 0.7,
			maxTokens: 1500,
		});

		try {
			const parsed = JSON.parse(text);
			return parsed.slides || [];
		} catch (error) {
			console.error('Failed to parse AI response:', error);
			return [];
		}
	}

	private generateRuleBasedSlides(data: SlideData): SlideContent[] {
		const slides: SlideContent[] = [];

		// Slide 1: Title Slide
		slides.push({
			slideNumber: 1,
			title: data.companyName ? `${data.companyName}: Strategic Update` : 'Market Intelligence Report',
			content: this.truncateText(data.title, 100),
			visualType: 'title',
			data: {
				sentiment: data.sentiment,
				date: new Date().toLocaleDateString()
			}
		});

		// Slide 2: Executive Summary
		slides.push({
			slideNumber: 2,
			title: 'Executive Summary',
			content: this.truncateText(data.summary, 150),
			visualType: 'summary',
			data: {
				metrics: [
					{ label: 'Sentiment', value: data.sentiment },
					{ label: 'Reading Time', value: `${data.readingTime || 5} min` },
					{ label: 'Key Entities', value: data.entities.length }
				]
			}
		});

		// Slide 3: Key Insights
		const topKeyPoints = data.keyPoints.slice(0, 3).map(point =>
			this.truncateText(point, 50)
		);
		slides.push({
			slideNumber: 3,
			title: 'Key Insights',
			content: '',
			visualType: 'keyPoints',
			data: {
				points: topKeyPoints
			}
		});

		// Slide 4: Market Landscape (Chart)
		const chartData = data.keywords.slice(0, 5).map((keyword, index) => ({
			label: keyword,
			value: Math.floor(Math.random() * 50) + 30 + (5 - index) * 10
		}));
		slides.push({
			slideNumber: 4,
			title: 'Market Landscape',
			content: '',
			visualType: 'chart',
			data: {
				chartType: 'bar',
				chartData: chartData
			}
		});

		// Slide 5: Strategic Implications (Grid)
		const gridItems = [
			{
				title: 'Market Impact',
				description: this.truncateText(data.marketAnalysis || 'Analysis pending', 60)
			},
			{
				title: 'Investment View',
				description: this.truncateText(data.investmentImplications || 'Under review', 60)
			},
			{
				title: 'Key Players',
				description: data.entities.slice(0, 3).join(', ')
			},
			{
				title: 'Focus Areas',
				description: data.keywords.slice(0, 3).join(', ')
			}
		];
		slides.push({
			slideNumber: 5,
			title: 'Strategic Implications',
			content: '',
			visualType: 'grid',
			data: {
				gridItems: gridItems
			}
		});

		// Slide 6: Conclusion
		slides.push({
			slideNumber: 6,
			title: 'Conclusion',
			content: this.getConclusion(data.sentiment),
			visualType: 'conclusion',
			data: {
				sentiment: data.sentiment,
				callToAction: this.getCallToAction(data.sentiment)
			}
		});

		return slides;
	}

	private truncateText(text: string, maxLength: number): string {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength - 3) + '...';
	}

	private getConclusion(sentiment: string): string {
		switch (sentiment) {
			case 'positive':
				return 'Market conditions favorable for strategic positioning';
			case 'negative':
				return 'Caution advised with focus on risk management';
			default:
				return 'Balanced approach recommended while monitoring developments';
		}
	}

	private getCallToAction(sentiment: string): string {
		switch (sentiment) {
			case 'positive':
				return 'Consider increasing exposure';
			case 'negative':
				return 'Review defensive positions';
			default:
				return 'Maintain current strategy';
		}
	}

	generateHTML(data: SlideData, slides: SlideContent[]): string {
		const sentimentColors = {
			positive: { primary: '#10b981', secondary: '#34d399', light: '#d1fae5' },
			negative: { primary: '#ef4444', secondary: '#f87171', light: '#fee2e2' },
			neutral: { primary: '#6366f1', secondary: '#818cf8', light: '#e0e7ff' }
		};

		const colors = sentimentColors[data.sentiment];

		return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary: ${colors.primary};
            --secondary: ${colors.secondary};
            --light: ${colors.light};
            --dark: #1a202c;
            --gray: #4a5568;
            --light-gray: #e2e8f0;
            --white: #ffffff;
            --shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        body {
            font-family: -apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            overflow: hidden;
        }

        .presentation-container {
            width: 1280px;
            height: 720px; /* 16:9 aspect ratio */
            background: white;
            border-radius: 20px;
            box-shadow: var(--shadow);
            position: relative;
            overflow: hidden;
        }

        .slide {
            width: 1280px;
            height: 720px;
            position: absolute;
            top: 0;
            left: 0;
            display: none;
            padding: 50px;
            animation: slideIn 0.6s ease-out;
        }

        .slide.active {
            display: flex;
            flex-direction: column;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(100px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        /* Slide Types Styling */
        .slide-title {
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: white;
            text-align: center;
        }

        .slide-title h1 {
            font-size: 48px;
            font-weight: 700;
            margin-bottom: 20px;
            line-height: 1.2;
        }

        .slide-title p {
            font-size: 24px;
            opacity: 0.95;
            max-width: 800px;
        }

        .slide-header {
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid var(--light);
        }

        .slide-header h2 {
            font-size: 36px;
            font-weight: 700;
            color: var(--dark);
        }

        .slide-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        /* Key Points */
        .key-points {
            list-style: none;
        }

        .key-point {
            display: flex;
            align-items: flex-start;
            margin-bottom: 30px;
            font-size: 24px;
            line-height: 1.5;
            color: var(--dark);
            animation: fadeInUp 0.5s ease-out;
            animation-fill-mode: both;
        }

        .key-point:nth-child(1) { animation-delay: 0.1s; }
        .key-point:nth-child(2) { animation-delay: 0.2s; }
        .key-point:nth-child(3) { animation-delay: 0.3s; }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .key-point::before {
            content: "•";
            color: var(--primary);
            font-size: 36px;
            margin-right: 20px;
            line-height: 1;
        }

        /* Chart Container */
        .chart-container {
            width: 100%;
            height: 400px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        canvas {
            max-width: 100%;
            max-height: 100%;
        }

        /* Grid Layout */
        .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 30px;
        }

        .grid-item {
            background: var(--light);
            padding: 30px;
            border-radius: 15px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .grid-item:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow);
        }

        .grid-item h3 {
            font-size: 20px;
            font-weight: 600;
            color: var(--primary);
            margin-bottom: 15px;
        }

        .grid-item p {
            font-size: 18px;
            line-height: 1.5;
            color: var(--gray);
        }

        /* Summary Metrics */
        .metrics {
            display: flex;
            justify-content: space-around;
            margin: 40px 0;
        }

        .metric {
            text-align: center;
            padding: 20px;
        }

        .metric-value {
            font-size: 36px;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 10px;
        }

        .metric-label {
            font-size: 16px;
            color: var(--gray);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .summary-text {
            font-size: 22px;
            line-height: 1.6;
            color: var(--dark);
            text-align: center;
            max-width: 800px;
            margin: 0 auto;
        }

        /* Conclusion */
        .conclusion-content {
            text-align: center;
        }

        .conclusion-message {
            font-size: 28px;
            color: var(--dark);
            margin-bottom: 30px;
            font-weight: 500;
        }

        .call-to-action {
            display: inline-block;
            padding: 15px 40px;
            background: var(--primary);
            color: white;
            border-radius: 50px;
            font-size: 20px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s ease;
        }

        .call-to-action:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        /* Navigation */
        .navigation {
            position: absolute;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 20px;
            align-items: center;
        }

        .nav-btn {
            padding: 10px 20px;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 25px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .nav-btn:hover {
            background: var(--secondary);
            transform: scale(1.05);
        }

        .nav-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .slide-indicator {
            display: flex;
            gap: 10px;
        }

        .dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--light-gray);
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .dot.active {
            background: var(--primary);
            transform: scale(1.3);
        }

        /* Progress Bar */
        .progress-bar {
            position: absolute;
            top: 0;
            left: 0;
            height: 4px;
            background: var(--primary);
            transition: width 0.3s ease;
        }

        /* Sentiment Badge */
        .sentiment-badge {
            position: absolute;
            top: 30px;
            right: 30px;
            padding: 10px 20px;
            background: var(--light);
            border-radius: 20px;
            font-weight: 600;
            color: var(--primary);
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        @media (max-width: 768px) {
            .presentation-container {
                height: 500px;
            }

            .slide {
                padding: 40px 30px;
            }

            .slide-title h1 {
                font-size: 32px;
            }

            .slide-header h2 {
                font-size: 28px;
            }

            .key-point {
                font-size: 18px;
            }

            .grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="presentation-container">
        <div class="progress-bar" id="progressBar"></div>

        ${slides.map((slide, index) => this.renderSlide(slide, index === 0)).join('')}

        <div class="navigation">
            <button class="nav-btn" id="prevBtn" onclick="changeSlide(-1)">← Previous</button>
            <div class="slide-indicator">
                ${slides.map((_, index) => `
                    <div class="dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>
                `).join('')}
            </div>
            <button class="nav-btn" id="nextBtn" onclick="changeSlide(1)">Next →</button>
        </div>
    </div>

    <script>
        let currentSlide = 0;
        const totalSlides = ${slides.length};
        const slides = document.querySelectorAll('.slide');
        const dots = document.querySelectorAll('.dot');
        const progressBar = document.getElementById('progressBar');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        function showSlide(n) {
            if (n >= totalSlides) currentSlide = 0;
            if (n < 0) currentSlide = totalSlides - 1;

            slides.forEach(slide => slide.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));

            slides[currentSlide].classList.add('active');
            dots[currentSlide].classList.add('active');

            // Update progress bar
            const progress = ((currentSlide + 1) / totalSlides) * 100;
            progressBar.style.width = progress + '%';

            // Update navigation buttons
            prevBtn.disabled = currentSlide === 0;
            nextBtn.disabled = currentSlide === totalSlides - 1;

            // Initialize charts if needed
            if (slides[currentSlide].querySelector('canvas')) {
                initChart(currentSlide);
            }
        }

        function changeSlide(direction) {
            currentSlide += direction;
            showSlide(currentSlide);
        }

        function goToSlide(n) {
            currentSlide = n;
            showSlide(currentSlide);
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') changeSlide(-1);
            if (e.key === 'ArrowRight') changeSlide(1);
        });

        // Touch/swipe support
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });

        function handleSwipe() {
            if (touchEndX < touchStartX - 50) changeSlide(1); // Swipe left
            if (touchEndX > touchStartX + 50) changeSlide(-1); // Swipe right
        }

        // Chart initialization
        const charts = {};

        function initChart(slideIndex) {
            const canvas = slides[slideIndex].querySelector('canvas');
            if (!canvas || charts[slideIndex]) return;

            const ctx = canvas.getContext('2d');
            const chartData = JSON.parse(canvas.dataset.chartdata || '[]');

            charts[slideIndex] = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: chartData.map(d => d.label),
                    datasets: [{
                        label: 'Impact Score',
                        data: chartData.map(d => d.value),
                        backgroundColor: 'rgba(99, 102, 241, 0.8)',
                        borderColor: 'rgba(99, 102, 241, 1)',
                        borderWidth: 2,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                display: false
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }

        // Auto-advance slides (optional)
        let autoAdvance = null;

        function startAutoAdvance() {
            autoAdvance = setInterval(() => {
                if (currentSlide < totalSlides - 1) {
                    changeSlide(1);
                }
            }, 10000); // Advance every 10 seconds
        }

        function stopAutoAdvance() {
            if (autoAdvance) {
                clearInterval(autoAdvance);
                autoAdvance = null;
            }
        }

        // Stop auto-advance on user interaction
        document.addEventListener('click', stopAutoAdvance);
        document.addEventListener('keydown', stopAutoAdvance);

        // Initialize
        showSlide(0);
        // Optionally start auto-advance
        // startAutoAdvance();
    </script>
</body>
</html>`;
	}

	private renderSlide(slide: SlideContent, isActive: boolean): string {
		const activeClass = isActive ? 'active' : '';

		switch (slide.visualType) {
			case 'title':
				return `
					<div class="slide slide-title ${activeClass}">
						<div class="sentiment-badge">${slide.data?.sentiment || 'neutral'}</div>
						<h1>${slide.title}</h1>
						<p>${slide.content}</p>
						<div style="margin-top: 40px; opacity: 0.8; font-size: 18px;">
							${slide.data?.date || new Date().toLocaleDateString()}
						</div>
					</div>
				`;

			case 'keyPoints':
				return `
					<div class="slide ${activeClass}">
						<div class="slide-header">
							<h2>${slide.title}</h2>
						</div>
						<div class="slide-content">
							<ul class="key-points">
								${(slide.data?.points || []).map((point: string) => `
									<li class="key-point">${point}</li>
								`).join('')}
							</ul>
						</div>
					</div>
				`;

			case 'chart':
				return `
					<div class="slide ${activeClass}">
						<div class="slide-header">
							<h2>${slide.title}</h2>
						</div>
						<div class="slide-content">
							<div class="chart-container">
								<canvas data-chartdata='${JSON.stringify(slide.data?.chartData || [])}'></canvas>
							</div>
						</div>
					</div>
				`;

			case 'grid':
				return `
					<div class="slide ${activeClass}">
						<div class="slide-header">
							<h2>${slide.title}</h2>
						</div>
						<div class="slide-content">
							<div class="grid">
								${(slide.data?.gridItems || []).map((item: any) => `
									<div class="grid-item">
										<h3>${item.title}</h3>
										<p>${item.description}</p>
									</div>
								`).join('')}
							</div>
						</div>
					</div>
				`;

			case 'summary':
				return `
					<div class="slide ${activeClass}">
						<div class="slide-header">
							<h2>${slide.title}</h2>
						</div>
						<div class="slide-content">
							<div class="summary-text">${slide.content}</div>
							<div class="metrics">
								${(slide.data?.metrics || []).map((metric: any) => `
									<div class="metric">
										<div class="metric-value">${metric.value}</div>
										<div class="metric-label">${metric.label}</div>
									</div>
								`).join('')}
							</div>
						</div>
					</div>
				`;

			case 'conclusion':
				return `
					<div class="slide ${activeClass}">
						<div class="slide-header">
							<h2>${slide.title}</h2>
						</div>
						<div class="slide-content">
							<div class="conclusion-content">
								<p class="conclusion-message">${slide.content}</p>
								<a href="#" class="call-to-action">${slide.data?.callToAction || 'Take Action'}</a>
							</div>
						</div>
					</div>
				`;

			default:
				return `
					<div class="slide ${activeClass}">
						<div class="slide-header">
							<h2>${slide.title}</h2>
						</div>
						<div class="slide-content">
							<p>${slide.content}</p>
						</div>
					</div>
				`;
		}
	}
}