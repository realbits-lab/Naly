import { db } from '../src/lib/db';
import { rssArticles, rssSources } from '../src/lib/schema';

console.log('📰 Populating test RSS articles for report generation...\n');

const testArticles = [
    {
        title: "Apple Reports Record Q4 Earnings Driven by iPhone 15 Sales",
        description: "Apple Inc. announced record-breaking fourth-quarter earnings with iPhone 15 driving unprecedented sales growth across all segments.",
        content: "Apple Inc. (NASDAQ: AAPL) reported its strongest fourth-quarter results in company history, with revenue reaching $119.4 billion, up 8% year-over-year. The tech giant's flagship iPhone 15 series drove significant growth, with iPhone revenue alone accounting for $69.7 billion. CEO Tim Cook highlighted the success of the new titanium design and improved camera capabilities. Services revenue also reached a new high of $22.3 billion, driven by strong performance in the App Store, Apple Music, and iCloud subscriptions. The company announced a new $90 billion share buyback program and increased its dividend by 5%. Looking ahead, Apple provided optimistic guidance for Q1 2024, citing strong pre-order numbers for upcoming product launches. The results exceeded Wall Street expectations on both revenue and earnings per share. Apple's strong cash position of $162.1 billion provides flexibility for future investments in AI and autonomous vehicle technology.",
        fullContent: "Apple Inc. (NASDAQ: AAPL) delivered exceptional fourth-quarter results that surpassed analyst expectations across all key metrics. The Cupertino-based technology giant reported revenue of $119.4 billion, representing an 8% increase from the same period last year and beating consensus estimates by $2.1 billion. Earnings per share came in at $2.18, well above the expected $2.10. The standout performer was the iPhone segment, which generated $69.7 billion in revenue, driven primarily by the successful launch of the iPhone 15 series. The new lineup, featuring titanium construction for Pro models and improved computational photography, resonated strongly with consumers globally. International sales accounted for 65% of total revenue, with particularly strong performance in China and India. Services revenue reached a new quarterly record of $22.3 billion, up 16% year-over-year, highlighting Apple's successful diversification beyond hardware. This growth was driven by increased subscription revenues from Apple Music, iCloud, and the App Store, as well as strong performance in Apple Pay and AppleCare. Mac revenue of $7.6 billion exceeded expectations despite a challenging PC market environment. iPad revenue of $6.4 billion showed resilience in the tablet market. Wearables, Home and Accessories revenue of $9.3 billion demonstrated continued strength in the Apple Watch and AirPods categories. Apple announced a substantial $90 billion share repurchase authorization and increased its quarterly dividend to $0.24 per share, representing a 5% increase. The company's strong balance sheet, with $162.1 billion in cash and marketable securities, provides significant financial flexibility for future investments in artificial intelligence, autonomous vehicles, and other emerging technologies. Looking forward, Apple provided optimistic guidance for the first quarter of 2024, citing strong early sales momentum for the iPhone 15 series and robust pre-order activity for upcoming product launches including new MacBook models and potential AR/VR devices.",
        link: "https://example.com/apple-earnings-q4-2024",
        publishedAt: new Date('2024-01-15T14:30:00Z'),
        author: "Sarah Johnson, Financial Times",
        categories: ["Technology", "Earnings", "Apple", "Consumer Electronics"],
        sourceName: "Financial Times",
        sourceUrl: "https://ft.com/",
        isArchived: false,
        isProcessed: false
    },
    {
        title: "Tesla Stock Surges 15% on Strong Delivery Numbers and AI Progress",
        description: "Tesla shares jumped after the company reported better-than-expected vehicle deliveries and made significant announcements about its autonomous driving technology.",
        content: "Tesla Inc. (NASDAQ: TSLA) shares surged 15% in after-hours trading following the release of fourth-quarter delivery numbers that significantly exceeded analyst expectations. The electric vehicle manufacturer delivered 484,507 vehicles in Q4, surpassing the consensus estimate of 473,000. This brings Tesla's total 2023 deliveries to 1.81 million vehicles, representing 38% growth year-over-year. CEO Elon Musk also provided updates on the company's Full Self-Driving (FSD) technology during a surprise announcement, stating that the next major software update will introduce enhanced neural network capabilities. The company's energy storage business also showed strong momentum, with deployments reaching 14.7 GWh in Q4. Tesla's Supercharger network expansion continued aggressively, with over 5,000 new charging stations added globally in the quarter. The stock surge reflects growing investor confidence in Tesla's ability to maintain its leadership position in the EV market while expanding into autonomous driving and energy storage solutions.",
        fullContent: "Tesla Inc. (NASDAQ: TSLA) delivered a significant surprise to investors with fourth-quarter vehicle delivery numbers that substantially exceeded Wall Street expectations, triggering a 15% surge in after-hours trading. The Austin-based electric vehicle pioneer reported deliveries of 484,507 vehicles for Q4 2023, well above the consensus analyst estimate of 473,000 units. This strong finish brought Tesla's total 2023 deliveries to 1.81 million vehicles, representing robust 38% year-over-year growth and cementing the company's position as the world's largest premium EV manufacturer. The delivery beat was particularly impressive given the challenging macroeconomic environment and increased competition in the electric vehicle space from both traditional automakers and new entrants. Model Y continued to be the standout performer, accounting for 394,497 of total deliveries, while the Model 3 contributed 90,010 units. Combined Model S and X deliveries totaled 10,000 units. Production numbers also exceeded expectations at 494,989 vehicles, indicating strong operational efficiency and reduced delivery-production gap. Beyond vehicle deliveries, CEO Elon Musk provided highly anticipated updates on Tesla's Full Self-Driving (FSD) technology during an impromptu announcement. The next major FSD beta release, version 12, will feature significantly enhanced neural network architecture with improved end-to-end capabilities. This represents a major milestone in Tesla's autonomous driving ambitions and could potentially unlock substantial value from the company's growing fleet of FSD-capable vehicles. Tesla's energy storage business continued its impressive trajectory, with energy deployments reaching 14.7 GWh in Q4, up 30% from the previous quarter. This growth is driven by increasing demand for grid-scale storage solutions and residential Powerwall systems. The Supercharger network expansion also accelerated, with over 5,000 new charging stations added globally in Q4, bringing the total to approximately 55,000 connectors worldwide. The company announced plans to open its charging network to non-Tesla vehicles in additional markets, potentially creating a new revenue stream. Looking ahead, Tesla faces both opportunities and challenges. The Cybertruck launch is progressing with initial deliveries beginning, though production ramp will be closely watched. Competition in the EV space continues to intensify, but Tesla's technological advantages in batteries, software, and manufacturing efficiency position it well for continued growth.",
        link: "https://example.com/tesla-delivery-surge-2024",
        publishedAt: new Date('2024-01-12T09:15:00Z'),
        author: "Michael Chen, Reuters",
        categories: ["Technology", "Electric Vehicles", "Tesla", "Automotive"],
        sourceName: "Reuters",
        sourceUrl: "https://reuters.com/",
        isArchived: false,
        isProcessed: false
    },
    {
        title: "Federal Reserve Signals Potential Rate Cuts as Inflation Cools",
        description: "Fed Chair Jerome Powell indicates the central bank may begin reducing interest rates in the second half of 2024 as inflation approaches target levels.",
        content: "Federal Reserve Chair Jerome Powell signaled a potential shift in monetary policy during his testimony before Congress, indicating that rate cuts could be on the table in the second half of 2024 if inflation continues its downward trajectory. The Consumer Price Index (CPI) has fallen to 3.4% year-over-year, down from a peak of 9.1% in June 2022. Core inflation, which excludes volatile food and energy prices, has declined to 3.9%. Powell emphasized that any policy changes will be data-dependent and gradual. The Fed has maintained the federal funds rate at 5.25-5.50% since July 2023. Financial markets rallied on the news, with the S&P 500 gaining 2.1% and bond yields declining across the curve. Economists expect the first rate cut could come as early as June 2024, with potential for 75-100 basis points of total cuts throughout the year. The dollar weakened against major currencies as investors adjusted their expectations for U.S. monetary policy.",
        fullContent: "Federal Reserve Chair Jerome Powell delivered highly anticipated testimony before the House Financial Services Committee, providing the clearest signal yet that the central bank is preparing for a potential pivot toward more accommodative monetary policy in 2024. Powell's remarks suggest that if current disinflationary trends continue, the Federal Reserve may begin reducing interest rates in the second half of the year, marking a significant shift from the aggressive tightening cycle that began in March 2022. The Consumer Price Index (CPI) has shown meaningful progress in recent months, declining to 3.4% year-over-year in December 2023, representing a substantial decrease from the cycle peak of 9.1% recorded in June 2022. More importantly, core CPI, which excludes the volatile food and energy components and is closely watched by Fed officials, has fallen to 3.9% from its peak of 6.6%. This consistent downward trajectory in core inflation provides the Fed with increasing confidence that price pressures are moderating toward their 2% target. Powell emphasized that any future policy decisions will remain strictly data-dependent, with the central bank carefully monitoring multiple economic indicators including employment data, wage growth, housing costs, and services inflation. The Fed Chair noted that while significant progress has been made in reducing inflation, the central bank remains committed to ensuring price stability is sustainably achieved. Financial markets responded enthusiastically to Powell's testimony, with the S&P 500 Index surging 2.1% on the day, while the Nasdaq Composite gained 2.7%. Bond markets also rallied strongly, with the 10-year Treasury yield falling 15 basis points to 4.12% and the 2-year yield declining 20 basis points to 4.35%. The yield curve inversion between 2-year and 10-year bonds narrowed to its smallest level since early 2023. Currency markets showed immediate reaction as well, with the U.S. Dollar Index declining 0.8% against a basket of major currencies. The euro strengthened to $1.092, while the Japanese yen advanced to 147.5 per dollar. Economists are now revising their Fed policy expectations, with many forecasting the first rate cut could occur as early as the June FOMC meeting. Goldman Sachs economists predict 75 basis points of total cuts in 2024, while JPMorgan expects up to 100 basis points of easing. The housing market, which has been significantly impacted by elevated mortgage rates, could see renewed activity if the Fed begins cutting rates as expected.",
        link: "https://example.com/fed-rate-cut-signals-2024",
        publishedAt: new Date('2024-01-10T16:45:00Z'),
        author: "Jennifer Roberts, Wall Street Journal",
        categories: ["Federal Reserve", "Interest Rates", "Economy", "Monetary Policy"],
        sourceName: "Wall Street Journal",
        sourceUrl: "https://wsj.com/",
        isArchived: false,
        isProcessed: false
    },
    {
        title: "NVIDIA Announces Next-Generation AI Chips with 50% Performance Improvement",
        description: "NVIDIA unveils its latest H200 GPU architecture designed for artificial intelligence workloads, promising significant performance gains over current generation.",
        content: "NVIDIA Corporation (NASDAQ: NVDA) announced its revolutionary H200 GPU architecture, specifically designed for artificial intelligence and machine learning workloads. The new chips deliver up to 50% better performance compared to the previous H100 generation while reducing power consumption by 25%. The H200 features an advanced 4nm manufacturing process and incorporates 188 billion transistors. Key improvements include enhanced memory bandwidth at 4.8 TB/s and support for larger AI models with up to 141GB of HBM3e memory. CEO Jensen Huang highlighted the chip's capabilities in training large language models and running inference for generative AI applications. Major cloud providers including Microsoft Azure, Amazon AWS, and Google Cloud have already committed to deploying H200-based instances. The announcement sent NVIDIA shares up 8% in after-hours trading. Production is expected to begin in Q2 2024, with general availability targeted for Q3. The company also announced partnerships with leading AI companies to optimize software for the new architecture.",
        fullContent: "NVIDIA Corporation (NASDAQ: NVDA) unveiled its groundbreaking H200 GPU architecture during a highly anticipated technology showcase, representing the next evolutionary leap in artificial intelligence computing hardware. The H200 Tensor Core GPU delivers unprecedented performance improvements specifically engineered for the most demanding AI and machine learning workloads that are driving the current technological revolution. The new architecture achieves up to 50% better performance compared to the widely adopted H100 generation while simultaneously reducing power consumption by 25%, addressing two critical concerns in modern data center operations: computational efficiency and energy costs. Built on an advanced 4nm manufacturing process node, the H200 incorporates an impressive 188 billion transistors, representing a significant increase in computational density. This massive transistor count enables the chip to handle increasingly complex AI models that are becoming standard in areas such as large language models, computer vision, and autonomous systems. One of the most significant improvements in the H200 architecture is the enhanced memory subsystem, featuring unprecedented memory bandwidth of 4.8 TB/s and support for up to 141GB of high-bandwidth memory (HBM3e). This substantial memory capacity allows the H200 to train and run inference on larger AI models without requiring complex distributed computing arrangements, simplifying deployment and reducing latency. CEO Jensen Huang emphasized during the announcement that the H200 is specifically optimized for the training of large language models similar to GPT-4 and Claude, as well as running inference for real-time generative AI applications. The chip's architecture includes specialized tensor processing units that can efficiently handle the matrix calculations fundamental to neural network operations. Major cloud service providers have already expressed strong commitment to the H200 platform, with Microsoft Azure, Amazon Web Services, and Google Cloud Platform announcing plans to deploy H200-based instances. These partnerships ensure that developers and enterprises will have access to H200 computing power through familiar cloud platforms. The announcement triggered immediate market reaction, with NVIDIA shares gaining 8% in extended trading as investors recognized the potential impact on the company's data center revenue. Analysts estimate that the H200 could drive significant growth in NVIDIA's already dominant position in AI hardware markets. Production of the H200 is scheduled to begin in Q2 2024, with general availability expected in Q3 2024. NVIDIA also announced strategic partnerships with leading AI companies including OpenAI, Anthropic, and Meta to optimize their software frameworks for the new architecture, ensuring seamless adoption.",
        link: "https://example.com/nvidia-h200-ai-chips-2024",
        publishedAt: new Date('2024-01-08T11:20:00Z'),
        author: "David Kim, TechCrunch",
        categories: ["Technology", "AI", "NVIDIA", "Semiconductors"],
        sourceName: "TechCrunch",
        sourceUrl: "https://techcrunch.com/",
        isArchived: false,
        isProcessed: false
    },
    {
        title: "Microsoft Reports Strong Cloud Growth as Azure Revenue Surges 31%",
        description: "Microsoft's cloud computing division continues to drive growth with Azure and other cloud services posting impressive quarterly gains amid enterprise digital transformation.",
        content: "Microsoft Corporation (NASDAQ: MSFT) reported robust second-quarter results with Azure and other cloud services revenue growing 31% year-over-year, significantly outpacing analyst expectations. Total cloud revenue reached $25.9 billion, representing 43% of Microsoft's total revenue. The Intelligent Cloud segment, which includes Azure, Windows Server, and SQL Server, generated $25.9 billion in revenue, up 20% from the prior year. CEO Satya Nadella emphasized the strong demand for AI-powered cloud services, with Azure AI services experiencing 100% revenue growth. Microsoft's productivity and business processes segment, including Office 365 and Teams, generated $19.2 billion, up 13% year-over-year. The company's focus on AI integration across its product portfolio is driving increased customer adoption and higher average selling prices. Microsoft announced new enterprise AI capabilities in Copilot and expanded partnerships with major consulting firms. The results demonstrate Microsoft's successful transition to a cloud-first company and its leadership position in enterprise software. Shares rose 4% in after-hours trading following the earnings announcement.",
        fullContent: "Microsoft Corporation (NASDAQ: MSFT) delivered exceptional second-quarter fiscal 2024 results that exceeded analyst expectations across all major business segments, with cloud computing continuing to serve as the primary growth engine for the technology giant. Azure and other cloud services revenue surged an impressive 31% year-over-year, significantly outpacing the consensus estimate of 27% growth and demonstrating the sustained momentum in enterprise cloud adoption. Total cloud revenue across all Microsoft services reached $25.9 billion, now representing 43% of the company's total quarterly revenue of $62 billion, highlighting the successful transformation from a traditional software company to a cloud-first organization. The Intelligent Cloud segment, which encompasses Azure public cloud services, Windows Server, SQL Server, and other enterprise infrastructure products, generated $25.9 billion in revenue for the quarter, representing a solid 20% increase compared to the same period in the previous year. This growth was driven by continued enterprise migration to cloud platforms, increased adoption of AI-enhanced services, and expansion of existing customer workloads. CEO Satya Nadella emphasized during the earnings call that demand for AI-powered cloud services has been particularly strong, with Azure AI services experiencing remarkable 100% revenue growth year-over-year. This explosive growth in AI services reflects the increasing enterprise adoption of machine learning capabilities, natural language processing tools, and the integration of OpenAI's GPT models through Azure OpenAI Service. Microsoft's Productivity and Business Processes segment, which includes the Office 365 suite, Microsoft Teams collaboration platform, and LinkedIn professional network, generated $19.2 billion in revenue, representing 13% year-over-year growth. Office 365 commercial revenue grew 15%, driven by increased seat expansion and higher revenue per user as organizations adopt premium features and AI-enhanced capabilities. The integration of AI technologies across Microsoft's product portfolio, particularly through the Copilot brand, is driving increased customer adoption and enabling the company to command higher average selling prices. Microsoft Teams continues to gain market share in the collaboration software space, with monthly active users reaching 280 million. The company announced new enterprise AI capabilities integrated into Copilot for Microsoft 365, including advanced data analysis features and workflow automation tools. Strategic partnerships with major consulting firms including Accenture, Deloitte, and KPMG are helping accelerate enterprise AI adoption and drive additional cloud services revenue. Looking ahead, Microsoft provided optimistic guidance for the remainder of fiscal 2024, citing strong demand pipelines for both traditional cloud workloads and emerging AI services. The company's investment in AI infrastructure, including continued partnership with OpenAI and expansion of data center capacity, positions it well for sustained growth in the rapidly evolving cloud computing market.",
        link: "https://example.com/microsoft-cloud-growth-2024",
        publishedAt: new Date('2024-01-14T08:30:00Z'),
        author: "Lisa Park, Bloomberg",
        categories: ["Technology", "Cloud Computing", "Microsoft", "Enterprise Software"],
        sourceName: "Bloomberg",
        sourceUrl: "https://bloomberg.com/",
        isArchived: false,
        isProcessed: false
    }
];

async function populateArticles() {
    try {
        // First, create RSS sources
        console.log('📡 Creating RSS sources...');

        const testSources = [
            {
                name: "Financial Times",
                description: "Global financial news and analysis",
                feedUrl: "https://ft.com/rss/feed",
                websiteUrl: "https://ft.com/",
                category: "finance"
            },
            {
                name: "Reuters",
                description: "International news and financial information",
                feedUrl: "https://reuters.com/rss",
                websiteUrl: "https://reuters.com/",
                category: "finance"
            },
            {
                name: "Wall Street Journal",
                description: "Business and financial news",
                feedUrl: "https://wsj.com/rss",
                websiteUrl: "https://wsj.com/",
                category: "finance"
            },
            {
                name: "TechCrunch",
                description: "Technology startup and innovation news",
                feedUrl: "https://techcrunch.com/rss",
                websiteUrl: "https://techcrunch.com/",
                category: "technology"
            },
            {
                name: "Bloomberg",
                description: "Business and market news",
                feedUrl: "https://bloomberg.com/rss",
                websiteUrl: "https://bloomberg.com/",
                category: "finance"
            }
        ];

        const sources = await db.insert(rssSources).values(testSources).returning({
            id: rssSources.id,
            name: rssSources.name
        });

        console.log('✅ Created RSS sources:');
        sources.forEach((source, index) => {
            console.log(`   ${index + 1}. ${source.name} (ID: ${source.id})`);
        });

        // Now, create articles with proper source references
        console.log(`\n📄 Inserting ${testArticles.length} test articles...`);

        const articlesWithSources = testArticles.map((article, index) => ({
            ...article,
            sourceId: sources[index % sources.length].id // Distribute articles across sources
        }));

        const results = await db.insert(rssArticles).values(articlesWithSources).returning({
            id: rssArticles.id,
            title: rssArticles.title
        });

        console.log('\n✅ Successfully inserted articles:');
        results.forEach((article, index) => {
            console.log(`   ${index + 1}. ${article.title} (ID: ${article.id})`);
        });

        console.log(`\n🎉 Successfully populated ${sources.length} RSS sources and ${results.length} test articles for report generation!`);
        console.log('📊 Now you can test the generate-report API endpoint.');

    } catch (error) {
        console.error('❌ Error inserting test articles:', error);
    }
}

populateArticles();