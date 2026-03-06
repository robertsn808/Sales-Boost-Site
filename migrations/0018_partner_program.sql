-- Partner accounts for the referral program learning dashboard
CREATE TABLE IF NOT EXISTS partner_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  access_code TEXT NOT NULL UNIQUE,
  avatar_color TEXT NOT NULL DEFAULT '#6366f1',
  tier TEXT NOT NULL DEFAULT 'bronze',
  total_referrals INTEGER NOT NULL DEFAULT 0,
  successful_referrals INTEGER NOT NULL DEFAULT 0,
  total_earned REAL NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Learning modules / course content
CREATE TABLE IF NOT EXISTS learning_modules (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'basics',
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  duration_minutes INTEGER NOT NULL DEFAULT 10,
  sort_order INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL DEFAULT '',
  quiz_json TEXT NOT NULL DEFAULT '[]',
  points INTEGER NOT NULL DEFAULT 10,
  is_published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Partner progress on modules
CREATE TABLE IF NOT EXISTS partner_progress (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  quiz_score INTEGER NOT NULL DEFAULT 0,
  quiz_answers TEXT NOT NULL DEFAULT '[]',
  completed_at TEXT NOT NULL DEFAULT '',
  started_at TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  UNIQUE(partner_id, module_id)
);

-- Partner referral submissions (public-facing, linked to partner)
CREATE TABLE IF NOT EXISTS partner_referrals (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL,
  business_name TEXT NOT NULL DEFAULT '',
  contact_name TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  application_data TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'submitted',
  payout_amount REAL NOT NULL DEFAULT 0,
  payout_date TEXT NOT NULL DEFAULT '',
  lead_id TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Partner meeting requests
CREATE TABLE IF NOT EXISTS partner_meetings (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL,
  merchant_name TEXT NOT NULL DEFAULT '',
  merchant_phone TEXT NOT NULL DEFAULT '',
  merchant_email TEXT NOT NULL DEFAULT '',
  business_name TEXT NOT NULL DEFAULT '',
  meeting_type TEXT NOT NULL DEFAULT 'video',
  preferred_date TEXT NOT NULL DEFAULT '',
  preferred_time TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Seed learning modules with payment processing education
INSERT INTO learning_modules (id, slug, title, description, category, difficulty, duration_minutes, sort_order, content, quiz_json, points, is_published, created_at, updated_at) VALUES
('mod-01', 'what-is-payment-processing', 'What is Payment Processing?', 'Learn the basics of how card payments work from swipe to settlement.', 'basics', 'beginner', 8, 1, '## How Card Payments Work

Every time a customer swipes, dips, or taps a card, a complex chain of events happens in seconds.

### The Players
- **Cardholder** — the customer paying
- **Merchant** — the business accepting payment
- **Issuing Bank** — the bank that issued the customer''s card (Chase, BofA, etc.)
- **Acquiring Bank** — the bank that processes payments for the merchant
- **Card Network** — Visa, Mastercard, Amex, or Discover
- **Payment Processor** — the technology company connecting everything

### The Flow
1. Customer taps/dips/swipes their card
2. Terminal sends encrypted data to the processor
3. Processor routes to the card network
4. Network contacts the issuing bank
5. Issuing bank approves or declines
6. Response travels back in ~2 seconds
7. Funds settle to merchant account in 1-2 business days

### Key Takeaway
Most merchants have **no idea** how many middlemen are taking a cut of every transaction. This is where TechSavvy helps — we make the process transparent and eliminate unnecessary fees.', '[]', 10, 1, datetime('now'), datetime('now')),

('mod-02', 'understanding-processing-fees', 'Understanding Processing Fees', 'Break down the 3 types of fees merchants pay on every transaction.', 'basics', 'beginner', 12, 2, '## The 3 Layers of Processing Fees

Every merchant pays three distinct fee layers. Most processors **bundle them** to hide their markup.

### 1. Interchange Fees (Non-Negotiable)
These go directly to the **issuing bank** (the customer''s bank). Set by Visa/Mastercard.
- Typically 1.5% – 3.5% depending on card type
- Debit cards: lower (~0.5% – 1%)
- Rewards cards: higher (~2% – 3.5%)
- Business/corporate cards: highest

### 2. Assessment Fees (Non-Negotiable)
Small fees paid to the **card networks** (Visa, Mastercard).
- Usually 0.13% – 0.15%
- These are tiny but add up

### 3. Processor Markup (THIS IS NEGOTIABLE!)
This is the **processor''s profit** — and where merchants get overcharged.
- Can range from 0.1% to 2%+ depending on the processor
- Often hidden in "bundled" or "tiered" pricing
- **This is what TechSavvy eliminates with zero-fee processing**

### Why This Matters for Referrals
When you refer a business, we analyze their statement and show them exactly how much markup they''re paying. Most merchants are shocked.', '[]', 15, 1, datetime('now'), datetime('now')),

('mod-03', 'pricing-models-explained', 'Pricing Models Explained', 'Flat rate vs tiered vs interchange-plus vs zero-fee — know the difference.', 'basics', 'intermediate', 15, 3, '## The 4 Pricing Models

### 1. Flat Rate (Square, Stripe, PayPal)
- Simple: 2.6% + $0.10 per transaction
- **Problem**: Overpay on debit cards (true cost ~0.5%, you pay 2.6%)
- Best for: Very small businesses under $5K/month

### 2. Tiered Pricing (Most Traditional Processors)
- Transactions sorted into "Qualified," "Mid-Qualified," "Non-Qualified"
- **Problem**: Processor decides which tier — usually the expensive one
- This is the **most deceptive** model. Avoid.

### 3. Interchange-Plus (Transparent Processors)
- Actual interchange + fixed markup (e.g., IC + 0.3% + $0.10)
- **Better**: You see real costs, markup is clear
- Still has a processor markup though

### 4. Zero-Fee / Cash Discount (TechSavvy Model)
- Merchant pays **$0** in processing fees
- Small service fee passed to card-paying customers (compliant with all networks)
- **Best for**: Any business doing $5K+/month in card volume

### The TechSavvy Advantage
We offer zero-fee processing — the merchant keeps 100% of their sales. This is the easiest pitch in the industry.', '[]', 15, 1, datetime('now'), datetime('now')),

('mod-04', 'reading-merchant-statements', 'How to Read a Merchant Statement', 'Learn to spot hidden fees and overcharges on a processing statement.', 'skills', 'intermediate', 20, 4, '## Statement Analysis 101

This is your most powerful sales tool. When you can read a statement, you can show merchants exactly where they''re losing money.

### Key Sections to Look For
1. **Monthly Summary** — total volume, transaction count, total fees
2. **Fee Breakdown** — interchange, assessments, processor fees
3. **Effective Rate** — total fees ÷ total volume (should be 2.5-3.5% for most)
4. **Hidden Fees to Flag**:
   - PCI non-compliance fee ($30-$100/mo)
   - Monthly minimum fee
   - Statement fee ($10-$25)
   - Batch fee ($0.25+ per batch)
   - Annual/semi-annual fee ($50-$200)
   - Early termination fee (in contract)
   - Rate increases (buried in fine print)

### Red Flags
- Effective rate above 3.5% → overpaying
- "Non-qualified surcharges" → tiered pricing padding
- Multiple small fees adding up to $50+/month → junk fees
- No interchange breakdown → bundled/opaque pricing

### What To Tell the Merchant
"Can I take a quick look at your monthly statement? I can usually find $200-500/month in unnecessary fees within 5 minutes."

You don''t need to be an expert — just get the statement and send it to TechSavvy. We do the full analysis.', '[]', 20, 1, datetime('now'), datetime('now')),

('mod-05', 'making-the-referral', 'How to Make a Referral', 'The simple 3-step process to refer a business and earn your commission.', 'skills', 'beginner', 10, 5, '## The Referral Process

### Step 1: Identify a Business
Look for businesses that:
- Accept card payments (restaurants, retail, salons, auto shops, medical offices)
- Have been in business 6+ months
- Process $5,000+/month in card volume
- Complain about fees, equipment, or their current processor

### Step 2: Make the Introduction
You have three options:
1. **Warm intro**: "Hey, I know someone who can save you money on processing fees. Mind if I connect you?"
2. **Submit through the dashboard**: Fill out the referral form with their info
3. **Three-way text/email**: Introduce both parties directly

### Step 3: We Handle the Rest
Once connected, TechSavvy will:
- Reach out within 24 hours
- Request a processing statement
- Deliver a free savings analysis
- Handle all setup and installation
- You get paid when they activate!

### Commission Structure
- **Bronze** (0-4 referrals): $50 per activated merchant
- **Silver** (5-9 referrals): $75 per activated merchant
- **Gold** (10-19 referrals): $100 per activated merchant + monthly residuals
- **Platinum** (20+ referrals): $150 per activated merchant + monthly residuals

### Pro Tips
- Start with businesses you already frequent (your barber, favorite restaurant, etc.)
- Don''t overthink it — just make the connection, we close the deal
- The best referrals come from genuine relationships', '[]', 15, 1, datetime('now'), datetime('now')),

('mod-06', 'objection-handling', 'Handling Common Objections', 'Know what to say when a merchant pushes back.', 'skills', 'intermediate', 12, 6, '## Common Objections & Responses

### "I''m happy with my current processor"
**Response**: "That''s great! Most of the merchants we help felt the same way — until they saw a side-by-side comparison. Would it hurt to get a free second opinion? It takes 5 minutes."

### "I''m locked in a contract"
**Response**: "We see that a lot. In many cases, the savings from switching actually cover the early termination fee within the first few months. We''ll calculate that for you upfront so there are no surprises."

### "I don''t have time for this"
**Response**: "Totally understand. That''s actually why we handle everything — all we need is a copy of your latest statement. Takes 2 minutes to snap a photo. We do all the analysis and setup."

### "Zero fees sounds too good to be true"
**Response**: "I get that. It works through a cash discount program — a small service fee is applied to card transactions, which is 100% compliant with Visa and Mastercard. Thousands of businesses use it. Your customers barely notice, and you keep every dollar of your sales."

### "I just switched processors"
**Response**: "No problem at all. Mind if I check back in 6 months? Sometimes the honeymoon rates expire and fees creep up."

### Key Principle
You''re not selling — you''re **offering a free analysis**. There''s zero risk to the merchant. If we can''t save them money, we''ll tell them to stay where they are.', '[]', 15, 1, datetime('now'), datetime('now')),

('mod-07', 'industry-verticals', 'Industry Verticals & Opportunities', 'Which business types benefit most and how to approach them.', 'advanced', 'intermediate', 15, 7, '## Best Verticals for Referrals

### 🍽️ Restaurants & Food Service
- **Volume**: High card volume ($15K-$100K+/month)
- **Pain points**: Thin margins, high interchange on rewards cards, expensive POS systems
- **Approach**: "With your volume, even a 0.5% savings is hundreds per month"

### 💇 Salons & Barbershops
- **Volume**: Moderate ($5K-$30K/month)
- **Pain points**: Paying 2.6%+ on Square/PayPal, no real terminal
- **Approach**: "You could upgrade to a real terminal and pay zero fees"

### 🔧 Auto Repair & Services
- **Volume**: Moderate-High ($10K-$50K/month)
- **Pain points**: Large ticket sizes mean large fee amounts
- **Approach**: "On a $2,000 repair, you''re paying $60+ in fees. What if that was zero?"

### 🏥 Medical & Dental
- **Volume**: High ($20K-$200K+/month)
- **Pain points**: High-ticket payments, outdated terminals
- **Approach**: Professional approach, focus on the numbers

### 🛍️ Retail & Specialty Shops
- **Volume**: Varies ($3K-$50K/month)
- **Pain points**: Competing with online, tight margins
- **Approach**: "Every dollar in fees is a dollar off your bottom line"

### ⚠️ High-Risk Verticals (We Handle These Too!)
- CBD/Hemp, Vape/Smoke shops, Firearms dealers
- These businesses pay 4-8% in processing fees
- Huge savings potential = bigger commissions for you', '[]', 20, 1, datetime('now'), datetime('now')),

('mod-08', 'compliance-and-ethics', 'Compliance & Ethics', 'Stay compliant and build trust with proper referral practices.', 'advanced', 'beginner', 10, 8, '## Doing It Right

### What You CAN Do
- Share your genuine experience and knowledge
- Offer to connect businesses with TechSavvy for a free analysis
- Mention the cash discount / zero-fee model
- Share educational materials from the program
- Collect basic contact info with permission

### What You Should NOT Do
- Make specific savings guarantees ("You''ll save exactly $500/month")
- Claim to be a TechSavvy employee or representative
- Access or handle anyone''s financial data
- Pressure or harass businesses
- Make promises about contract terms or rates

### Privacy & Data
- Never share one merchant''s information with another
- Don''t photograph statements yourself — let TechSavvy handle it
- Referral info you submit is confidential

### Building Trust
The best referral partners succeed because they:
1. Lead with genuine helpfulness, not commission
2. Only refer when there''s a real fit
3. Follow up but don''t pressure
4. Build long-term relationships in their community

### Remember
You''re a **connector**, not a salesperson. Your job is to introduce — TechSavvy does the rest. The more authentic you are, the more referrals you''ll naturally generate.', '[]', 10, 1, datetime('now'), datetime('now'));
