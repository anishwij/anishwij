# Marketing Attribution System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           User Journey States                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Anonymous → Email Captured → Account Created → Analytics Consent       │
│     (Redis)     (Redis+DB)      (Database)        (Full Stack)          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

                                    ↓

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Redis (7d)    │────▶│  PostgreSQL     │────▶│    Stripe       │
│ Session Store   │     │  Persistent     │     │ Payment Truth   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                        │
         └───────────────────────┴────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────────────┐          ┌─────────────┐
              │  Meta CAPI  │          │   PostHog   │
              │Attribution  │          │  Analytics  │
              └─────────────┘          └─────────────┘
```

## Identity Resolution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Identity Resolution Logic                   │
└─────────────────────────────────────────────────────────────────┘

1. Guest Visit (Session Only)
   sessionId: sess_abc123
   email: null
   userId: null

2. Guest Donation (Email Captured)
   sessionId: sess_abc123
   email: user@email.com  ← Stripe webhook
   userId: null
   
3. Account Creation/Login
   sessionId: sess_xyz789 (new)
   email: user@email.com
   userId: user_123
   
   ▼ Resolution Process ▼
   
   a) Find all donations by email in DB
   b) Link donations to userId
   c) Migrate Redis attribution to user record
   d) Future sessions tied to userId
```

## Data State Transitions

```
┌──────────────┐     donation     ┌──────────────┐     login        ┌──────────────┐
│              │ ───────────────▶ │              │ ──────────────▶  │              │
│  Anonymous   │                  │Email Known   │                  │Authenticated │
│              │                  │(Guest Donor) │                  │              │
└──────────────┘                  └──────────────┘                  └──────────────┘
 Redis only                       Redis + DB                        DB primary
 No email                         Email via Stripe                   Full user record
 No persistence                   Donation saved                     Attribution linked
 
                                                                           │
                                                                           ▼
                                                                    consent given
                                                                           │
                                                                           ▼
                                                                   ┌──────────────┐
                                                                   │              │
                                                                   │Full Analytics│
                                                                   │              │
                                                                   └──────────────┘
                                                                   PostHog identify()
                                                                   Client tracking
```

## Data Residency Matrix

| Data Type | Anonymous | Email Known | Authenticated | Analytics Consent |
|-----------|-----------|-------------|---------------|-------------------|
| **Session ID** | Redis (7d) | Redis (7d) | Redis + DB | Redis + DB |
| **UTM Params** | Redis (7d) | Redis (7d) | DB | DB |
| **Page Views** | Redis (7d) | Redis (7d) | DB | DB + PostHog |
| **Email** | ❌ | DB (from Stripe) | DB | DB |
| **User ID** | ❌ | ❌ | DB | DB |
| **Donation History** | ❌ | DB | DB (linked) | DB (linked) |
| **Behavioral Events** | Redis (7d) | Redis (7d) | DB | DB + PostHog |
| **Device/Browser** | Redis (7d) | Redis (7d) | DB | DB + PostHog |
| **PostHog ID** | ❌ | ❌ | ❌ | DB + PostHog |

## Database Schema (Drizzle ORM)

```typescript
// Core user table
users {
  id: uuid
  email: string (unique)
  created_at: timestamp
  analytics_consent: boolean
  marketing_consent: boolean
}

// Attribution data (permanent storage)
user_attributions {
  id: uuid
  user_id: uuid (nullable) // null for guests
  email: string
  session_id: string
  
  // First touch
  first_touch_source: string
  first_touch_campaign: string
  first_touch_timestamp: timestamp
  landing_page: string
  
  // Conversion data
  converted: boolean
  conversion_timestamp: timestamp
  conversion_value: decimal
  
  // Metadata
  country: string
  created_at: timestamp
}

// Link donations to attribution
donations {
  id: uuid
  stripe_payment_id: string
  user_id: uuid (nullable)
  email: string
  amount: decimal
  
  // Attribution link
  attribution_session_id: string
  attribution_id: uuid (references user_attributions)
  
  created_at: timestamp
}

// Consent audit trail
consent_log {
  id: uuid
  user_id: uuid
  consent_type: enum ['analytics', 'marketing', 'cookies']
  granted: boolean
  ip_address: string
  timestamp: timestamp
}
```

## API Endpoints & Data Flow

```
POST /api/attribution/event
├── Check sessionId in Redis
├── If authenticated, also save to DB
└── Send to Meta CAPI (always)

POST /api/stripe/webhook
├── Extract sessionId from metadata
├── Get attribution from Redis
├── Save donation to DB with attribution
├── If email exists in users table → link
└── Send conversion to Meta + PostHog

POST /api/auth/login
├── Find user by email
├── Check for unlinked donations
├── Link donations to user_id
├── Migrate Redis session to DB
└── Set new sessionId cookie

PUT /api/user/consent
├── Update user consent in DB
├── Log consent change
├── If analytics granted → PostHog identify()
└── If revoked → delete from PostHog
```

## GDPR Compliance Strategy

```
Data Deletion Request
        │
        ▼
┌─────────────────┐
│ 1. Delete User  │ ← Soft delete, mark as "forgotten"
└────────┬────────┘
         │
┌────────▼────────┐
│ 2. Anonymize    │ ← Keep aggregated data
│   Attributions  │   Remove PII, keep campaign data
└────────┬────────┘
         │
┌────────▼────────┐
│ 3. Stripe API   │ ← Cannot delete, but unlink
│   Unlink        │
└────────┬────────┘
         │
┌────────▼────────┐
│ 4. PostHog API  │ ← Delete if identified
│   Delete        │
└─────────────────┘
```

## Implementation Priority

1. **Phase 1: MVP (Current)**
   - Redis sessions with UTM tracking
   - Stripe webhook → Redis attribution
   - Meta CAPI for conversions
   - Basic guest donations

2. **Phase 2: User Accounts**
   - Login/signup flow
   - Email-based donation linking
   - Attribution migration to DB
   - Basic consent (functional only)

3. **Phase 3: Full Consent**
   - Progressive consent UI
   - PostHog identify on consent
   - Consent management page
   - GDPR deletion flow

4. **Phase 4: Advanced**
   - Multi-touch attribution
   - Cross-device linking
   - Advanced analytics
   - Attribution reports

## Key Technical Decisions

1. **Primary Identifier**: Email (not device/browser)
2. **Attribution Window**: 7 days (Redis TTL)
3. **Source of Truth**: 
   - Payments: Stripe
   - Attribution: PostgreSQL
   - Active Sessions: Redis
4. **Consent Default**: Minimal (server-side only)
5. **Identity Resolution**: Deterministic (email match)