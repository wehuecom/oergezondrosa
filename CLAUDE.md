# Oergezond

Oergezond is een Nederlands gezondheidsmerk dat mensen helpt moderne gezondheidsproblemen op te lossen met oervoeding, een natuurlijke leefstijl en holistische gezondheidseducatie.

---

## Business Config

| Field | Value |
|-------|-------|
| **Business name** | Oergezond |
| **Opgericht door** | Jorn & Rosa — achtergrond bij Defensie, hersteld van PDS en vermoeidheid via oervoeding en natuurlijke leefstijl |
| **Wat we doen** | Educatieve content, holistische gezondheidsprotocollen en natuurlijke producten gebaseerd op ancestrale principes (oervoeding, circadiaans ritme, minimale blootstelling aan moderne toxines) |
| **Producten** | Oercrème, Oercrème Vitamine E, Shampoo Bar, Conditioner Bar, Haarolie, Luierzalf, Oerbril |
| **Diensten** | Oermenu (gepersonaliseerde voedingsplannen), holistische gezondheidscoaching |
| **Website** | www.oergezond.com |
| **Email** | contact@oergezond.com |
| **Platforms** | Instagram @oergezond (hoofdkanaal), TikTok @oergezondnl (groeidoel) |

---

## Ideale Klant — 3 Avatars

### Avatar 1 — De Bewuste Moeder (Lisa, 32–45)
Woont in de Randstad, koopt bewust biologisch, leest etiketten. Wil geen hormoonverstorende stoffen op de huid van haar kinderen. Worstelt met eczeem, droge huid of gevoelige huid. Overweldigd door te veel producten — wil simpeler maar effectiever.

**Triggers:** Before/after van andere moeders, herkenbare ingrediëntenlijst, testimonials over eczeem bij kinderen, lokale Nederlandse herkomst.

### Avatar 2 — De Huidprobleem-Zoeker (Tom/Sanne, 25–45)
Worstelt al jaren met eczeem, psoriasis, rosacea of beschadigde huidbarrière. Heeft alles geprobeerd. Moe van steroïdcrèmes en dermatologen die alleen symptomen behandelen.

**Triggers:** Wetenschappelijke uitleg over tallow vs. zaadoliën, gedetailleerde testimonials met tijdslijn, geld-terug-garantie.

### Avatar 3 — De Bewuste Biohacker (Daan/Mark, 28–45)
Eet carnivoor, keto of paleo. Volgt Huberman Lab, Joe Rogan, Nederlandse health-creators. Optimaliseert slaap, voeding en training — wil dat ook voor zijn huid.

**Triggers:** Evidence-based uitleg over vetzuurprofielen, koppeling aan nose-to-tail filosofie, mannelijke testimonials, anti-zaadoliën redenering.

---

## Brand Voice

| Field | Value |
|-------|-------|
| **Toon** | Confronterend eerlijk, rustig zelfverzekerd, educatief |
| **Karakter** | De bevriende expert — vertelt wat je al wilt weten maar nog niet hebt gehoord. Geen omhaal, geen zachte woorden voor harde feiten. |
| **Schrijfstijl** | Schrijf als mens, niet als merk. Jij/wij, nooit u. Korte zinnen. Spreektaal. Altijd afsluiten met actie of conclusie. |

### Gebruik altijd:
`troep` · `puur` · `oer-` · `echt` · `gewoon` · `100% non-toxisch` · `hormoonvriendelijk` · `herstel van binnenuit` · `zoals de natuur het bedoeld heeft` · `je huid herkent het` · `de natuur wint` · `controle terugpakken` · `simpel maar effectief` · `grasgevoerd`

### Gebruik nooit:
`journey` · `ritual` · `elevate` · `holistic` · `glow up` · `clean beauty` · `self-care` · `superfoods` · `revolutionair` · `baanbrekend` · vage wellness-taal · corporate afstand · superlatieven zonder bewijs

### Tekststructuur:
1. **Opening** — confronterende vraag of stelling die de frustratie articuleert
2. **Het probleem** — kort en hard benoemen, geen diplomatie
3. **De oplossing** — rustig introduceren, geen uitroeptekens
4. **Waarom het werkt** — wetenschap in volkstaal (als aan een vriend aan de keukentafel)
5. **Bewijs** — echte mensen, echte klachten, specifieke resultaten

---

## Tools & Tech Stack

- **Shopify** — webshop en betalingen (Shopify Payments nu, Stripe over ~1 maand)
- **Klaviyo** — e-mailmarketing en automations
- **Canva** — content en designs maken
- **Meta Business Suite** — Instagram/Facebook content plannen
- **Meta Ads Manager** — betaalde advertenties Facebook/Instagram
- **Google Ads** — betaalde advertenties Google

---

## Huidige Prioriteiten

1. **Automatisering** — minder IN het bedrijf werken, meer ERAAN:
   - Customer support automatiseren (inclusief Instagram DM-automations)
   - Ad creatives automatiseren
   - Instagram content automatiseren
2. **Online cursussen** — toekomstig verdienmodel rondom orthomoleculaire, paleo en ayurvedische gezondheid; holistische geneeswijze via voeding voor mensen met specifieke klachten

---

## Regels voor Claude

- **Toon altijd eerst — publiceer nooit zelf.** Alles wat gecreëerd wordt (content, scripts, ads, automations) gaat eerst langs Jorn & Rosa ter goedkeuring voordat het naar klanten gaat of live staat.
- **Geen financiële acties.** Jorn & Rosa houden zelf controle over alle financiële beslissingen. Claude doet geen betalingen, abonnementen of financiële wijzigingen.
- **Ads publiceer je niet zelf.** Ad creatives en copy aanleveren is oké — maar het publiceren doen Jorn & Rosa altijd zelf via Meta Ads Manager of Google Ads.
- **Schrijf altijd in de Oergezond brand voice.** Gebruik de taalpatronen, het vocabulaire en de structuur uit dit document. Nooit generieke wellness-taal.
- **Geen medische claims.** Maak nooit medische of therapeutische claims richting klanten — niet over producten, niet over gezondheidsprotocollen. Schrijf educatief en informatief, maar claim nooit dat een product iets "geneest", "behandelt" of "voorkomt". Wat bewezen is, communiceren Jorn & Rosa zelf op het juiste moment.
- **Schrijf in het Nederlands**, tenzij expliciet anders gevraagd.

---

## Key Files

### Content & Brand
| File | Contents |
|------|----------|
| `brand voice.txt` | Volledige brand voice guide met schrijfregels, taalpatronen en voorbeelden |
| `oercrème_competitor_research_avatars.txt` | Competitor research + 3 klantavatars met campagne-angles |

### Automatisering & Bots
| File | Contents |
|------|----------|
| `customer-support/amy/amy.js` | Amy klantenservice bot (Node.js) — verwerkt emails, stuurt concepts via Telegram |
| `customer-support/amy/config.js` | Amy credentials (niet in Git) |
| `customer-support/amy/amy_state.json` | Amy runtime state — pending callbacks, tokens |

### Credentials (buiten Git)
| File | Contents |
|------|----------|
| `C:\Users\rosav\.credentials\shared.env` | Gedeelde keys: Airtable API, Gemini |
| `C:\Users\rosav\.credentials\oergezond.env` | Alle Oergezond keys: Claude, Shopify, Klaviyo, Microsoft, Meta, Google, Telegram |
| `C:\Users\rosav\.credentials\syncwithrosa.env` | Alle SyncWithRosa keys |
