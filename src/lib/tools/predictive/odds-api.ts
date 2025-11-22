import { tool } from 'ai';
import { z } from 'zod';

/**
 * The Odds API Tool for Sports Predictions
 * Fetches live betting odds across multiple bookmakers
 * Critical: The "closing line" is the most accurate predictor of sports outcomes
 */
export const sportsOddsTool = tool({
  description: `Fetch live sports betting odds from multiple bookmakers.
Key insights:
- Consensus odds across bookmakers = Market probability
- Line movement (opening vs current) reveals "sharp money" (professional bettors)
- If odds move from 1.90 → 1.70, sharp money is backing that team
- The closing line (final odds before game) is the most efficient predictor
Use for: NFL, NBA, soccer, tennis, MMA, and more.`,
  inputSchema: z.object({
    sport: z
      .enum(['americanfootball_nfl', 'basketball_nba', 'soccer_epl', 'baseball_mlb', 'icehockey_nhl'])
      .describe('Sport key (e.g., americanfootball_nfl, basketball_nba)'),
    region: z
      .enum(['us', 'uk', 'au', 'eu'])
      .default('us')
      .describe('Region for bookmakers'),
    market: z
      .enum(['h2h', 'spreads', 'totals'])
      .default('h2h')
      .describe('Betting market type: h2h (moneyline), spreads, totals (over/under)'),
  }),
  execute: async ({ sport, region = 'us', market = 'h2h' }) => {
    const apiKey = process.env.ODDS_API_KEY;

    if (!apiKey) {
      return {
        error: 'ODDS_API_KEY not configured',
        recommendation:
          'Cannot fetch sports odds. Use news sentiment and team statistics instead.',
      };
    }

    try {
      const oddsUrl = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${apiKey}&regions=${region}&markets=${market}&oddsFormat=decimal`;

      const response = await fetch(oddsUrl);

      if (!response.ok) {
        return {
          error: `Odds API error: ${response.status} ${response.statusText}`,
          recommendation: 'API may be rate limited or sport unavailable.',
        };
      }

      const events = await response.json();

      if (!Array.isArray(events) || events.length === 0) {
        return {
          sport,
          events: [],
          recommendation: `No upcoming ${sport} events found. Check sport key or try different timeframe.`,
        };
      }

      // Process events
      const processedEvents = events.slice(0, 10).map((event: any) => {
        const bookmakers = event.bookmakers || [];

        // Calculate consensus odds by averaging across bookmakers
        const allOdds = bookmakers.map((book: any) => {
          const marketData = book.markets.find((m: any) => m.key === market);
          return marketData?.outcomes || [];
        });

        // Flatten and group by team
        const teamOdds: Record<string, number[]> = {};
        allOdds.forEach((outcomes: any[]) => {
          outcomes.forEach((outcome: any) => {
            if (!teamOdds[outcome.name]) {
              teamOdds[outcome.name] = [];
            }
            teamOdds[outcome.name].push(outcome.price);
          });
        });

        // Calculate average and convert to implied probability
        const consensusOdds = Object.entries(teamOdds).map(([team, odds]) => {
          const avgOdd = odds.reduce((sum, odd) => sum + odd, 0) / odds.length;
          const impliedProb = (1 / avgOdd) * 100;

          return {
            team,
            averageOdds: avgOdd.toFixed(2),
            impliedProbability: impliedProb.toFixed(1),
            oddsRange: {
              best: Math.max(...odds).toFixed(2),
              worst: Math.min(...odds).toFixed(2),
            },
            bookmakerCount: odds.length,
          };
        });

        return {
          matchup: `${event.home_team} vs ${event.away_team}`,
          sport: event.sport_key,
          commenceTime: event.commence_time,
          consensusOdds,
          bookmakerCount: bookmakers.length,
          lastUpdate: event.last_update || new Date().toISOString(),
        };
      });

      return {
        sport,
        region,
        market,
        totalEvents: processedEvents.length,
        events: processedEvents,
        analysis: {
          interpretation: `${processedEvents.length} upcoming games found. Implied probability = 1 / decimal odds.`,
          sharpMoneyDetection:
            'Compare opening vs current odds to detect sharp action (not available in this response)',
        },
      };
    } catch (error: any) {
      return {
        error: `Odds API fetch failed: ${error.message}`,
        recommendation: 'API error. Use manual research or alternative sports data sources.',
      };
    }
  },
});

/**
 * Sports Line Movement Tool
 * Tracks opening line vs current line to detect sharp money
 * This is CRITICAL for identifying value bets and accurate predictions
 */
export const lineMovementTool = tool({
  description: `Analyze betting line movement to detect professional ("sharp") money.
Key concept: If the public is betting heavily on Team A, but the line moves toward Team B,
this means sharp bettors (who move the line) are backing Team B.
Follow the sharps, not the public.`,
  inputSchema: z.object({
    eventId: z.string().describe('Specific event ID from The Odds API'),
    sport: z.string().describe('Sport key'),
  }),
  execute: async ({ eventId, sport }) => {
    // Note: Line movement requires historical data, which may need premium API access
    // This is a simplified implementation using current odds only
    const apiKey = process.env.ODDS_API_KEY;

    if (!apiKey) {
      return {
        error: 'ODDS_API_KEY not configured',
        recommendation: 'Manual line movement tracking required',
      };
    }

    return {
      eventId,
      sport,
      lineMovement: 'Historical line movement requires premium API access or database tracking',
      recommendation:
        'To implement full line movement analysis, store odds snapshots over time in your database.',
      implementationNote:
        'Consider adding a cron job to fetch and store odds every hour for trend analysis.',
    };
  },
});
