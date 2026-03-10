# Ad Avatar Guide

Framework for building customer avatars for ad targeting. Use this when onboarding new clients or creating ad campaigns.

## How to Use This Guide

1. Fill out the avatar template below for each client
2. Use the pain points to write ad hooks
3. Use the desires to write ad body copy
4. Use the demographics for Meta targeting
5. Save completed avatars to `clients/{client}/avatar.md`

---

## Avatar Template

### Demographics
| Field | Value |
|-------|-------|
| Age range | |
| Gender (primary) | |
| Location | |
| Income range | |
| Education | |
| Job/role | |
| Family status | |

### Psychographics
| Field | Value |
|-------|-------|
| Values | |
| Interests | |
| Lifestyle | |
| Media consumption | |
| Social platforms | |
| Buying behavior | |

### Pain Points (ranked by intensity)
1. **[Biggest pain]** — The thing that keeps them up at night
2. **[Second pain]** — The daily frustration
3. **[Third pain]** — The thing they've given up on fixing

### Desires (ranked by importance)
1. **[Primary desire]** — What they really want
2. **[Secondary desire]** — How they want to feel
3. **[Tertiary desire]** — The status/identity they want

### Objections
1. **Price** — "Is it worth the money?"
2. **Trust** — "Will this actually work for me?"
3. **Time** — "I don't have time for this"
4. **Comparison** — "Why not [competitor]?"

### Trigger Events
- What happens right before they decide to buy?
- What season/time of year are they most likely to convert?
- What life event pushes them to action?

---

## Example: Local Service Business (Barbershop)

### Demographics
| Field | Value |
|-------|-------|
| Age range | 22-45 |
| Gender | Male (85%) |
| Location | 10-mile radius of shop |
| Income | $35K-$90K |
| Education | Mixed |
| Job/role | Working professionals, blue collar, students |
| Family status | Mixed — single and young families |

### Pain Points
1. **Can't find a consistent barber** — tired of bad cuts, inconsistent results, different barber every time
2. **Long wait times** — walk-in shops are unpredictable, wastes their Saturday
3. **Basic service only** — their current spot just does cuts, no beard work, no skin fades, no hot towels

### Desires
1. **Look sharp consistently** — want to walk out feeling like a million bucks every time
2. **Easy booking** — want to book on their phone in 30 seconds, walk in at their time
3. **Full experience** — want the premium treatment (hot towel, beard trim, line up, the works)

### Objections
1. **"My current barber is fine"** — fine ≠ great. Show the upgrade.
2. **"I don't want to pay more"** — frame as investment in confidence/appearance
3. **"I don't know if they can handle my hair"** — show diverse before/afters

### Ad Hook Examples (from these pain points)
- "If you've been going to the same mediocre barber for years, here's why..."
- "Stop wasting 2 hours at a walk-in shop. Book your exact time in 10 seconds."
- "Your barber should make you feel like THIS when you leave." [before/after]
- "I was nervous to switch barbers after 5 years. Then I tried {name}."
- "This is what a $35 haircut looks like vs a $35 haircut." [comparison]

---

## Example: Online Service Business (Marketing Agency)

### Demographics
| Field | Value |
|-------|-------|
| Age range | 28-55 |
| Gender | Mixed |
| Location | Nationwide (or specific metro) |
| Income | $75K-$250K (business revenue $200K-$2M) |
| Education | College+ |
| Job/role | Business owner, founder, entrepreneur |
| Family status | Mixed |

### Pain Points
1. **Inconsistent leads** — revenue is a roller coaster, feast or famine every month
2. **Wasting money on ads that don't work** — tried boosting posts or hired a bad agency
3. **No time for marketing** — too busy delivering the service to also market the service

### Desires
1. **Predictable lead flow** — know exactly how many leads are coming each month
2. **Someone handling it** — want to focus on delivery, not marketing
3. **Clear ROI** — want to see exactly what they're getting for their ad spend

### Objections
1. **"I got burned by an agency before"** — show proof, case studies, transparency
2. **"I can't afford it"** — frame as: can't afford NOT to (cost of no leads)
3. **"My business is different"** — show results in their specific industry

### Ad Hook Examples
- "If your business makes under $50K/month, you're probably making this one marketing mistake."
- "We spent $3K on ads for a {industry} business. Here's what happened."
- "Stop boosting posts. Here's what actually works for local businesses."
- "Every {industry} owner I talk to has the same problem..."

---

## Converting Avatar → Targeting

| Avatar Field | Meta Targeting Field |
|-------------|---------------------|
| Age range | `age_min` / `age_max` |
| Gender | `genders` (1=male, 2=female, 0=all) |
| Location | `geo_locations.cities` with radius |
| Interests | `flexible_spec.interests` |
| Job/role | `flexible_spec.work_positions` |
| Income | `flexible_spec.income` (US only) |
| Behaviors | `flexible_spec.behaviors` |

**Pro tip:** Start broad with demographics, then narrow with interests. Let Meta's algorithm find the converters within your audience. Over-targeting kills delivery.
