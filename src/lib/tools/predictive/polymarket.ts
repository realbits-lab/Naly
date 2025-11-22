import { tool } from 'ai';
import { z } from 'zod';

/**
 * Polymarket Prediction Markets Tool
 * Fetches real-money prediction market probabilities
 * Critical insight: Markets often lead polls and news cycles because participants have "skin in the game"
 */
export const polymarketTool = tool({
  description: `Fetch prediction market probabilities from Polymarket for politics, crypto, and events.
Key insight: Polymarket prices represent crowd wisdom with real capital at stake.
- If "Yes" share costs $0.65 → Market implies 65% probability
- High volume → High confidence in probability
- Low volume → Noisy signal, discard
Use this for political elections, crypto events, major corporate outcomes.`,
  inputSchema: z.object({
    query: z
      .string()
      .describe('Search query for markets (e.g., "2024 election", "Bitcoin ETF approval")'),
    limit: z.number().default(5).describe('Number of markets to return'),
  }),
  execute: async ({ query, limit = 5 }) => {
    try {
      // Polymarket has a public API for market data
      // We'll use the Gamma Markets API (no auth required for public data)
      const searchUrl = `https://gamma-api.polymarket.com/markets?limit=${limit}&offset=0&closed=false&active=true`;

      const response = await fetch(searchUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          error: `Polymarket API error: ${response.status}`,
          recommendation: 'Polymarket may be unavailable. Use polling data and news sentiment.',
        };
      }

      const allMarkets = await response.json();

      // Filter markets by query
      const filteredMarkets = Array.isArray(allMarkets)
        ? allMarkets
            .filter((market: any) => {
              const searchString =
                `${market.question} ${market.description}`.toLowerCase();
              return searchString.includes(query.toLowerCase());
            })
            .slice(0, limit)
        : [];

      if (filteredMarkets.length === 0) {
        return {
          query,
          markets: [],
          recommendation: `No active markets found for "${query}". Try broader search terms or check if market exists.`,
        };
      }

      const markets = filteredMarkets.map((market: any) => {
        // Polymarket outcomes are typically binary (Yes/No)
        const outcomes = market.outcomes || [];
        const yesOutcome = outcomes.find((o: any) => o.toLowerCase().includes('yes')) || outcomes[0];
        const noOutcome = outcomes.find((o: any) => o.toLowerCase().includes('no')) || outcomes[1];

        // Price is the probability (0-1 scale)
        const yesProbability = market.outcomePrices ? market.outcomePrices[0] : 0;
        const volume = market.volume || 0;

        // Volume confidence thresholds
        const volumeConfidence =
          volume > 100000 ? 'High' : volume > 10000 ? 'Medium' : 'Low';

        return {
          question: market.question,
          description: market.description,
          marketSlug: market.slug,
          probability: {
            yes: Math.round(yesProbability * 100),
            no: Math.round((1 - yesProbability) * 100),
          },
          volume: volume,
          volumeFormatted: `$${(volume / 1000).toFixed(1)}K`,
          volumeConfidence,
          endDate: market.endDate,
          isActive: market.active,
          liquidity: market.liquidity || 0,
          url: `https://polymarket.com/event/${market.slug}`,
        };
      });

      return {
        query,
        totalMarkets: markets.length,
        markets,
        analysis: {
          highestConfidence: markets.reduce(
            (max, m) => (m.volume > max.volume ? m : max),
            markets[0]
          ),
          averageProbability:
            markets.reduce((sum, m) => sum + m.probability.yes, 0) / markets.length,
          totalVolume: markets.reduce((sum, m) => sum + m.volume, 0),
        },
        interpretation: `Found ${markets.length} markets. Check volume confidence: High volume = reliable signal, Low volume = noisy.`,
      };
    } catch (error: any) {
      return {
        error: `Polymarket fetch failed: ${error.message}`,
        recommendation:
          'API may be down. Use alternative sources like 538 polls or betting odds.',
      };
    }
  },
});

/**
 * Specific Polymarket Market Tool
 * Fetch detailed data for a known market by slug
 */
export const polymarketMarketDetailTool = tool({
  description: `Get detailed information about a specific Polymarket market including order book depth.
Use this when you've identified a specific market and need granular probability data.`,
  inputSchema: z.object({
    marketSlug: z
      .string()
      .describe('Market slug from Polymarket (e.g., "presidential-election-winner-2024")'),
  }),
  execute: async ({ marketSlug }) => {
    try {
      const marketUrl = `https://gamma-api.polymarket.com/markets/${marketSlug}`;

      const response = await fetch(marketUrl);

      if (!response.ok) {
        return {
          error: `Market not found: ${marketSlug}`,
          recommendation: 'Check market slug or use search tool first',
        };
      }

      const market = await response.json();

      return {
        question: market.question,
        description: market.description,
        currentProbability: {
          yes: Math.round((market.outcomePrices?.[0] || 0) * 100),
          no: Math.round((market.outcomePrices?.[1] || 0) * 100),
        },
        volume24h: market.volume24hr,
        totalVolume: market.volume,
        liquidity: market.liquidity,
        spread: market.spread,
        lastTradePrice: market.lastTradePrice,
        marketResolution: market.closed
          ? { resolved: true, outcome: market.resolvedOutcome }
          : { resolved: false },
        endDate: market.endDate,
        url: `https://polymarket.com/event/${marketSlug}`,
        confidence:
          market.volume > 100000 && market.liquidity > 50000
            ? 'High - Deep market with active trading'
            : market.volume > 10000
              ? 'Medium - Moderate activity'
              : 'Low - Thin market, treat probability with caution',
      };
    } catch (error: any) {
      return {
        error: `Failed to fetch market details: ${error.message}`,
      };
    }
  },
});
