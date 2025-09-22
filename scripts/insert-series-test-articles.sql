-- Insert test articles with complete time series data for testing table generation

INSERT INTO rss_articles (
    source_id,
    title,
    description,
    content,
    full_content,
    link,
    author,
    categories,
    published_at,
    is_archived,
    is_processed
) VALUES
(
    '20198024-e5b2-4898-9162-9b8439ee2808',
    'NVIDIA Reports Q3 2024: Complete Quarterly Financial Series Shows Strong Growth Trajectory',
    'NVIDIA Corporation releases comprehensive quarterly results with detailed 12-quarter historical performance data.',
    'NVIDIA Corporation (NASDAQ: NVDA) reported Q3 2024 results showing sustained growth across all segments, with complete historical quarterly data revealing consistent expansion.',
    'NVIDIA Corporation (NASDAQ: NVDA) released comprehensive Q3 2024 financial results with complete historical quarterly performance:

QUARTERLY REVENUE SERIES (in millions):
Q3 2024: $18,120
Q2 2024: $13,507
Q1 2024: $7,192
Q4 2023: $6,051
Q3 2023: $5,931
Q2 2023: $6,704
Q1 2023: $8,288
Q4 2022: $7,643
Q3 2022: $5,931
Q2 2022: $6,704
Q1 2022: $5,661
Q4 2021: $5,003

QUARTERLY NET INCOME SERIES (in millions):
Q3 2024: $9,243
Q2 2024: $6,188
Q1 2024: $2,043
Q4 2023: $1,414
Q3 2023: $680
Q2 2023: $656
Q1 2023: $1,618
Q4 2022: $1,414
Q3 2022: $680
Q2 2022: $656
Q1 2022: $1,618
Q4 2021: $1,332

QUARTERLY EPS DILUTED:
Q3 2024: $3.71
Q2 2024: $2.48
Q1 2024: $0.82
Q4 2023: $0.57
Q3 2023: $0.27
Q2 2023: $0.26
Q1 2023: $0.65
Q4 2022: $0.57
Q3 2022: $0.27
Q2 2022: $0.26
Q1 2022: $0.65
Q4 2021: $0.53

DAILY STOCK PRICE MOVEMENT (Last 10 Trading Days):
2024-10-25: Open $139.52, High $141.23, Low $138.45, Close $140.89, Volume 298,453,200
2024-10-24: Open $137.89, High $139.78, Low $136.92, Close $139.15, Volume 276,892,100
2024-10-23: Open $135.45, High $138.12, Low $134.78, Close $137.56, Volume 265,789,300
2024-10-22: Open $133.67, High $135.89, Low $132.45, Close $135.23, Volume 254,678,900
2024-10-21: Open $131.23, High $134.56, Low $130.89, Close $133.45, Volume 243,567,800
2024-10-18: Open $129.45, High $131.78, Low $128.67, Close $130.89, Volume 232,456,700
2024-10-17: Open $127.89, High $130.23, Low $126.45, Close $129.56, Volume 221,345,600
2024-10-16: Open $125.67, High $128.45, Low $124.89, Close $127.34, Volume 210,234,500
2024-10-15: Open $123.45, High $126.78, Low $122.67, Close $125.89, Volume 199,123,400
2024-10-14: Open $121.23, High $124.56, Low $120.45, Close $123.78, Volume 188,012,300

SEGMENT REVENUE BREAKDOWN BY QUARTER (in millions):
Data Center:
Q3 2024: $14,506, Q2 2024: $10,323, Q1 2024: $4,284, Q4 2023: $3,616

Gaming:
Q3 2024: $2,856, Q2 2024: $2,486, Q1 2024: $2,240, Q4 2023: $1,974

Professional Visualization:
Q3 2024: $416, Q2 2024: $379, Q1 2024: $295, Q4 2023: $226

Automotive:
Q3 2024: $342, Q2 2024: $319, Q1 2024: $373, Q4 2023: $235

GROSS MARGIN PROGRESSION:
Q3 2024: 73.0%, Q2 2024: 70.1%, Q1 2024: 64.6%, Q4 2023: 63.3%, Q3 2023: 56.9%

OPERATING EXPENSES SERIES (in millions):
Q3 2024: $2,983, Q2 2024: $2,662, Q1 2024: $2,508, Q4 2023: $2,176, Q3 2023: $1,793

FREE CASH FLOW QUARTERLY (in millions):
Q3 2024: $8,612, Q2 2024: $6,077, Q1 2024: $3,808, Q4 2023: $2,016, Q3 2023: $1,856',
    'https://example.com/nvidia-q3-2024-complete-series',
    'Financial Data Analyst',
    '["Technology", "Semiconductors", "AI", "Earnings"]'::jsonb,
    NOW() - INTERVAL '1 hour',
    false,
    false
),
(
    'abb2feea-d098-444e-a3e0-4e6f3f5df93f',
    'JPMorgan Chase Posts Record Quarter with Full 5-Year Historical Financial Data',
    'JPMorgan Chase & Co. releases Q3 2024 earnings with comprehensive 5-year quarterly performance metrics.',
    'JPMorgan Chase & Co. (NYSE: JPM) announced Q3 2024 financial results including complete 5-year quarterly historical data showing consistent profitability and growth.',
    'JPMorgan Chase & Co. (NYSE: JPM) reported Q3 2024 results with complete historical data:

5-YEAR QUARTERLY NET REVENUE (in billions):
2024 Q3: $41.93
2024 Q2: $50.99
2024 Q1: $41.93
2023 Q4: $38.57
2023 Q3: $40.69
2023 Q2: $41.31
2023 Q1: $38.35
2022 Q4: $34.55
2022 Q3: $32.72
2022 Q2: $30.72
2022 Q1: $30.72
2021 Q4: $29.26
2021 Q3: $29.65
2021 Q2: $31.40
2021 Q1: $33.12
2020 Q4: $28.70
2020 Q3: $29.94
2020 Q2: $33.82
2020 Q1: $28.25
2019 Q4: $26.80

5-YEAR QUARTERLY NET INCOME (in billions):
2024 Q3: $12.90
2024 Q2: $18.15
2024 Q1: $13.42
2023 Q4: $9.31
2023 Q3: $13.15
2023 Q2: $14.47
2023 Q1: $12.62
2022 Q4: $11.01
2022 Q3: $9.74
2022 Q2: $8.65
2022 Q1: $8.28
2021 Q4: $10.40
2021 Q3: $11.69
2021 Q2: $11.95
2021 Q1: $14.30
2020 Q4: $12.14
2020 Q3: $9.44
2020 Q2: $4.69
2020 Q1: $2.87
2019 Q4: $8.52

WEEKLY STOCK PRICE DATA (Last 4 Weeks):
Week ending 2024-10-25: High $225.34, Low $218.67, Close $223.89, Weekly Volume 89,234,500
Week ending 2024-10-18: High $218.45, Low $212.34, Close $216.78, Weekly Volume 92,456,700
Week ending 2024-10-11: High $213.67, Low $208.45, Close $211.23, Weekly Volume 87,123,400
Week ending 2024-10-04: High $209.89, Low $204.56, Close $207.45, Weekly Volume 91,234,600

LOAN PORTFOLIO QUARTERLY PROGRESSION (in billions):
2024 Q3: $1,323.7
2024 Q2: $1,311.1
2024 Q1: $1,305.2
2023 Q4: $1,299.0
2023 Q3: $1,289.6
2023 Q2: $1,272.2
2023 Q1: $1,248.0
2022 Q4: $1,239.0

DEPOSITS QUARTERLY TREND (in billions):
2024 Q3: $2,423.3
2024 Q2: $2,413.9
2024 Q1: $2,387.8
2023 Q4: $2,412.8
2023 Q3: $2,343.3
2023 Q2: $2,383.9
2023 Q1: $2,379.8
2022 Q4: $2,344.0

TIER 1 CAPITAL RATIO PROGRESSION:
2024 Q3: 15.0%
2024 Q2: 14.9%
2024 Q1: 14.8%
2023 Q4: 14.8%
2023 Q3: 14.8%
2023 Q2: 14.7%
2023 Q1: 14.2%
2022 Q4: 13.8%

RETURN ON EQUITY QUARTERLY:
2024 Q3: 17.1%
2024 Q2: 23.0%
2024 Q1: 18.0%
2023 Q4: 12.1%
2023 Q3: 17.9%
2023 Q2: 20.2%
2023 Q1: 18.1%
2022 Q4: 15.8%',
    'https://example.com/jpm-q3-2024-historical-series',
    'Banking Sector Analyst',
    '["Finance", "Banking", "Earnings", "Historical Data"]'::jsonb,
    NOW() - INTERVAL '2 hours',
    false,
    false
),
(
    '46c61a1c-c1e8-4b46-bae0-bb896511b5f7',
    'Amazon Web Services Growth: Complete Monthly Revenue and Market Share Data 2022-2024',
    'AWS releases detailed monthly revenue figures and market share data covering 24-month period.',
    'Amazon Web Services reported comprehensive monthly performance metrics showing sustained cloud dominance with exact monthly revenue figures from 2022 through 2024.',
    'Amazon Web Services (AWS) Comprehensive Monthly Performance Data:

MONTHLY REVENUE 2024 (in millions):
October 2024: $7,893.45
September 2024: $7,654.23
August 2024: $7,432.89
July 2024: $7,234.56
June 2024: $7,012.34
May 2024: $6,823.45
April 2024: $6,645.67
March 2024: $6,456.78
February 2024: $6,234.56
January 2024: $6,089.23

MONTHLY REVENUE 2023 (in millions):
December 2023: $5,967.89
November 2023: $5,823.45
October 2023: $5,678.90
September 2023: $5,534.56
August 2023: $5,412.34
July 2023: $5,289.67
June 2023: $5,167.45
May 2023: $5,045.23
April 2023: $4,923.45
March 2023: $4,812.34
February 2023: $4,689.56
January 2023: $4,567.89

DAILY ACTIVE USERS (Last 30 Days, in millions):
2024-10-25: 145.67
2024-10-24: 144.89
2024-10-23: 143.56
2024-10-22: 142.34
2024-10-21: 141.23
2024-10-20: 140.89
2024-10-19: 140.45
2024-10-18: 139.78
2024-10-17: 138.92
2024-10-16: 137.56
2024-10-15: 136.78
2024-10-14: 135.89
2024-10-13: 135.23
2024-10-12: 134.67
2024-10-11: 133.89
2024-10-10: 132.45
2024-10-09: 131.78
2024-10-08: 130.89
2024-10-07: 129.67
2024-10-06: 128.89
2024-10-05: 127.92
2024-10-04: 126.78
2024-10-03: 125.67
2024-10-02: 124.89
2024-10-01: 123.45
2024-09-30: 122.67
2024-09-29: 121.89
2024-09-28: 120.78
2024-09-27: 119.89
2024-09-26: 118.67

MARKET SHARE MONTHLY PROGRESSION:
October 2024: 31.2%
September 2024: 31.1%
August 2024: 31.0%
July 2024: 30.9%
June 2024: 30.8%
May 2024: 30.7%
April 2024: 30.7%
March 2024: 30.6%
February 2024: 30.5%
January 2024: 30.4%

SERVICE USAGE METRICS (Monthly Average):
EC2 Instance Hours (billions):
Oct 2024: 89.234, Sep 2024: 87.456, Aug 2024: 85.123, Jul 2024: 83.567

S3 Storage (exabytes):
Oct 2024: 234.567, Sep 2024: 228.345, Aug 2024: 222.890, Jul 2024: 217.456

Lambda Invocations (trillions):
Oct 2024: 15.678, Sep 2024: 14.892, Aug 2024: 14.234, Jul 2024: 13.567

REGIONAL REVENUE BREAKDOWN Q3 2024 (in millions):
North America: $3,456.78
Europe: $2,234.56
Asia Pacific: $1,567.89
Latin America: $345.67
Middle East & Africa: $289.45',
    'https://example.com/aws-monthly-series-2024',
    'Cloud Services Reporter',
    '["Cloud Computing", "AWS", "Technology", "Market Analysis"]'::jsonb,
    NOW() - INTERVAL '3 hours',
    false,
    false
);