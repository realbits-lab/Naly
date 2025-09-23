interface InfographicData {
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

export class InfographicGenerator {
	generateInfographic(data: InfographicData): string {
		const sentimentColor = this.getSentimentColor(data.sentiment);
		const sentimentIcon = this.getSentimentIcon(data.sentiment);
		const chartData = this.generateChartData(data);

		return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(data.title)}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            color: #1a202c;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .container {
            width: 1280px;
            height: 720px;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            animation: slideIn 0.5s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .header {
            background: linear-gradient(135deg, ${sentimentColor.primary} 0%, ${sentimentColor.secondary} 100%);
            padding: 40px;
            color: white;
            position: relative;
            overflow: hidden;
        }

        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: rotate 30s linear infinite;
        }

        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .company-badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 16px;
            backdrop-filter: blur(10px);
        }

        .title {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 16px;
            position: relative;
            z-index: 1;
            line-height: 1.3;
        }

        .summary {
            font-size: 18px;
            opacity: 0.95;
            position: relative;
            z-index: 1;
            line-height: 1.6;
        }

        .sentiment-indicator {
            position: absolute;
            top: 40px;
            right: 40px;
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            backdrop-filter: blur(10px);
            animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }

        .content {
            padding: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }

        @media (max-width: 768px) {
            .content {
                grid-template-columns: 1fr;
            }
        }

        .section {
            background: #f7fafc;
            border-radius: 16px;
            padding: 24px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .section:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .section-icon {
            width: 24px;
            height: 24px;
            background: ${sentimentColor.primary};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
        }

        .key-points {
            list-style: none;
        }

        .key-point {
            padding: 12px;
            margin-bottom: 12px;
            background: white;
            border-radius: 12px;
            border-left: 4px solid ${sentimentColor.primary};
            display: flex;
            align-items: center;
            gap: 12px;
            transition: transform 0.2s ease;
            animation: slideInLeft 0.5s ease-out;
            animation-fill-mode: both;
        }

        .key-point:nth-child(1) { animation-delay: 0.1s; }
        .key-point:nth-child(2) { animation-delay: 0.2s; }
        .key-point:nth-child(3) { animation-delay: 0.3s; }
        .key-point:nth-child(4) { animation-delay: 0.4s; }
        .key-point:nth-child(5) { animation-delay: 0.5s; }
        .key-point:nth-child(6) { animation-delay: 0.6s; }

        @keyframes slideInLeft {
            from {
                opacity: 0;
                transform: translateX(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .key-point:hover {
            transform: translateX(5px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .key-point-icon {
            min-width: 8px;
            min-height: 8px;
            background: ${sentimentColor.primary};
            border-radius: 50%;
        }

        .entities-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }

        .entity-tag {
            background: linear-gradient(135deg, ${sentimentColor.primary}15, ${sentimentColor.secondary}15);
            border: 1px solid ${sentimentColor.primary}30;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            color: ${sentimentColor.primary};
            transition: all 0.3s ease;
        }

        .entity-tag:hover {
            background: ${sentimentColor.primary};
            color: white;
            transform: scale(1.05);
        }

        .chart-container {
            width: 100%;
            height: 250px;
            position: relative;
            margin-top: 20px;
        }

        .chart-bar {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            animation: growWidth 1s ease-out;
            animation-fill-mode: both;
        }

        @keyframes growWidth {
            from {
                transform: scaleX(0);
                transform-origin: left;
            }
            to {
                transform: scaleX(1);
            }
        }

        .chart-label {
            min-width: 100px;
            font-size: 14px;
            color: #4a5568;
            font-weight: 500;
        }

        .chart-bar-fill {
            height: 30px;
            background: linear-gradient(90deg, ${sentimentColor.primary}, ${sentimentColor.secondary});
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 12px;
            color: white;
            font-weight: 600;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            transition: transform 0.3s ease;
        }

        .chart-bar-fill:hover {
            transform: scaleX(1.05);
            transform-origin: left;
        }

        .metrics {
            display: flex;
            justify-content: space-around;
            padding: 20px;
            background: linear-gradient(135deg, #f6f9fc 0%, #e9f1f7 100%);
            border-radius: 16px;
        }

        .metric {
            text-align: center;
            animation: fadeInUp 0.8s ease-out;
            animation-fill-mode: both;
        }

        .metric:nth-child(1) { animation-delay: 0.2s; }
        .metric:nth-child(2) { animation-delay: 0.4s; }
        .metric:nth-child(3) { animation-delay: 0.6s; }

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

        .metric-value {
            font-size: 36px;
            font-weight: 700;
            color: ${sentimentColor.primary};
            margin-bottom: 8px;
        }

        .metric-label {
            font-size: 14px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 500;
        }

        .footer {
            padding: 30px;
            background: #f7fafc;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }

        .timestamp {
            color: #718096;
            font-size: 14px;
        }

        .interactive-hint {
            margin-top: 10px;
            font-size: 12px;
            color: #a0aec0;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${data.companyName ? `<div class="company-badge">${this.escapeHtml(data.companyName)}</div>` : ''}
            <h1 class="title">${this.escapeHtml(data.title)}</h1>
            <p class="summary">${this.escapeHtml(data.summary)}</p>
            <div class="sentiment-indicator">${sentimentIcon}</div>
        </div>

        <div class="content">
            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon">📊</span>
                    Key Insights
                </h2>
                <ul class="key-points">
                    ${data.keyPoints.map(point => `
                        <li class="key-point">
                            <span class="key-point-icon"></span>
                            <span>${this.escapeHtml(point)}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>

            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon">🏢</span>
                    Key Entities
                </h2>
                <div class="entities-grid">
                    ${data.entities.map(entity => `
                        <span class="entity-tag">${this.escapeHtml(entity)}</span>
                    `).join('')}
                </div>

                <div class="chart-container">
                    <h3 style="margin: 20px 0 15px; font-size: 16px; color: #4a5568;">Keyword Analysis</h3>
                    ${chartData.map((item, index) => `
                        <div class="chart-bar" style="animation-delay: ${0.1 * index}s;">
                            <div class="chart-label">${this.escapeHtml(item.label)}</div>
                            <div class="chart-bar-fill" style="width: ${item.percentage}%;">
                                ${item.value}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${data.marketAnalysis ? `
            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon">📈</span>
                    Market Analysis
                </h2>
                <p style="line-height: 1.6; color: #4a5568;">
                    ${this.escapeHtml(data.marketAnalysis).substring(0, 200)}...
                </p>
            </div>
            ` : ''}

            ${data.investmentImplications ? `
            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon">💡</span>
                    Investment Implications
                </h2>
                <p style="line-height: 1.6; color: #4a5568;">
                    ${this.escapeHtml(data.investmentImplications).substring(0, 200)}...
                </p>
            </div>
            ` : ''}

            <div class="section" style="grid-column: 1 / -1;">
                <div class="metrics">
                    <div class="metric">
                        <div class="metric-value">${data.wordCount || 0}</div>
                        <div class="metric-label">Words</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${data.readingTime || 0}</div>
                        <div class="metric-label">Min Read</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${data.sentiment}</div>
                        <div class="metric-label">Sentiment</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p class="timestamp">Generated on ${new Date().toLocaleString()}</p>
            <p class="interactive-hint">Hover over elements to see interactive effects</p>
        </div>
    </div>

    <script>
        // Add interactive animations
        document.addEventListener('DOMContentLoaded', function() {
            // Animate numbers counting up
            const animateValue = (element, start, end, duration) => {
                const startTime = performance.now();
                const update = (currentTime) => {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const current = Math.floor(start + (end - start) * progress);
                    element.textContent = current;
                    if (progress < 1) {
                        requestAnimationFrame(update);
                    }
                };
                requestAnimationFrame(update);
            };

            // Animate metric values
            document.querySelectorAll('.metric-value').forEach((element) => {
                const value = parseInt(element.textContent);
                if (!isNaN(value)) {
                    animateValue(element, 0, value, 1000);
                }
            });

            // Add click interactions to entity tags
            document.querySelectorAll('.entity-tag').forEach((tag) => {
                tag.style.cursor = 'pointer';
                tag.addEventListener('click', function() {
                    this.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        this.style.transform = 'scale(1.05)';
                    }, 100);
                });
            });

            // Add parallax effect to header
            const header = document.querySelector('.header');
            document.addEventListener('mousemove', (e) => {
                const x = (e.clientX / window.innerWidth - 0.5) * 20;
                const y = (e.clientY / window.innerHeight - 0.5) * 20;
                header.style.backgroundPosition = \`\${50 + x}% \${50 + y}%\`;
            });
        });
    </script>
</body>
</html>`;
	}

	private getSentimentColor(sentiment: string): { primary: string; secondary: string } {
		switch (sentiment) {
			case 'positive':
				return { primary: '#10b981', secondary: '#34d399' };
			case 'negative':
				return { primary: '#ef4444', secondary: '#f87171' };
			default:
				return { primary: '#6366f1', secondary: '#818cf8' };
		}
	}

	private getSentimentIcon(sentiment: string): string {
		switch (sentiment) {
			case 'positive':
				return '📈';
			case 'negative':
				return '📉';
			default:
				return '⚖️';
		}
	}

	private generateChartData(data: InfographicData): Array<{ label: string; value: number; percentage: number }> {
		const items = data.keywords.slice(0, 4).map((keyword, index) => {
			const value = Math.floor(Math.random() * 50) + 30 + (4 - index) * 10;
			return {
				label: keyword,
				value,
				percentage: Math.min(95, value + 20)
			};
		});
		return items.sort((a, b) => b.value - a.value);
	}

	private escapeHtml(text: string): string {
		const map: { [key: string]: string } = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#39;'
		};
		return text.replace(/[&<>"']/g, m => map[m]);
	}
}