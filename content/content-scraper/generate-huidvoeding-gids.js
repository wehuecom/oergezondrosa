#!/usr/bin/env node
/**
 * Genereer de Huidoptimalisatie & Voeding Gids PDF en stuur naar Telegram.
 * Bonus e-book bij 2+1 gratis Oercrème actie.
 * Run: node generate-huidvoeding-gids.js
 */

"use strict";

const https = require("https");
const puppeteer = require("puppeteer");
const cfg = require("./config.js");

function buildHtml() {
  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', sans-serif;
    color: #1a1a1a;
    background: #fff;
    font-size: 14px;
    line-height: 1.6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .cover {
    page-break-after: always;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(160deg, #4b5a3c 0%, #2d3625 100%);
    color: #fff;
    text-align: center;
    padding: 80px 60px;
  }
  .cover-label { font-size: 13px; font-weight: 600; letter-spacing: 4px; text-transform: uppercase; opacity: 0.5; margin-bottom: 32px; }
  .cover-title { font-family: 'Playfair Display', serif; font-size: 48px; font-weight: 800; line-height: 1.1; margin-bottom: 20px; }
  .cover-title span { color: #a8c090; }
  .cover-subtitle { font-size: 17px; opacity: 0.8; max-width: 520px; line-height: 1.7; margin-bottom: 48px; }
  .cover-line { width: 60px; height: 2px; background: rgba(255,255,255,0.3); margin-bottom: 48px; }
  .cover-brand { font-size: 16px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; opacity: 0.4; }
  .cover-url { font-size: 13px; opacity: 0.3; margin-top: 8px; }
  .cover-bonus { display: inline-block; background: rgba(168,192,144,0.25); border: 1px solid rgba(168,192,144,0.4); padding: 8px 24px; border-radius: 24px; font-size: 13px; font-weight: 600; letter-spacing: 1px; margin-bottom: 32px; }

  .page {
    padding: 0 56px;
    margin-bottom: 16px;
  }

  .page-label { font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #4b5a3c; margin-bottom: 8px; margin-top: 36px; }
  .page-divider { width: 40px; height: 3px; background: #4b5a3c; margin-bottom: 20px; }
  .page h2 { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 800; color: #2d3625; line-height: 1.25; margin-bottom: 16px; page-break-after: avoid; }
  .page h3 { font-size: 17px; font-weight: 700; color: #4b5a3c; margin: 22px 0 10px; page-break-after: avoid; }
  .page p { font-size: 13.5px; color: #333; margin-bottom: 12px; line-height: 1.7; orphans: 3; widows: 3; }
  .page .source { font-size: 11px; color: #999; font-style: italic; margin-top: -6px; margin-bottom: 12px; }
  .page strong { color: #2d3625; }

  .danger-card {
    background: #fef2f2;
    border-left: 4px solid #c0392b;
    border-radius: 4px;
    padding: 16px 20px;
    margin-bottom: 14px;
    page-break-inside: avoid;
  }
  .danger-card h4 { font-size: 15px; font-weight: 700; color: #c0392b; margin-bottom: 4px; }
  .danger-card p { font-size: 13px; color: #444; margin: 0; line-height: 1.6; }

  .safe-card {
    background: #f4f6f0;
    border-left: 4px solid #4b5a3c;
    border-radius: 4px;
    padding: 16px 20px;
    margin-bottom: 14px;
    page-break-inside: avoid;
  }
  .safe-card h4 { font-size: 15px; font-weight: 700; color: #4b5a3c; margin-bottom: 4px; }
  .safe-card p { font-size: 13px; color: #444; margin: 0; line-height: 1.6; }

  .nutrient-card {
    background: #f9faf7;
    border: 1px solid #e2e8d8;
    border-radius: 8px;
    padding: 18px 22px;
    margin-bottom: 14px;
    page-break-inside: avoid;
  }
  .nutrient-card h4 { font-size: 15px; font-weight: 700; color: #4b5a3c; margin-bottom: 6px; }
  .nutrient-card .role { font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .nutrient-card p { font-size: 13px; color: #444; margin: 0; line-height: 1.6; }
  .nutrient-card .foods { font-size: 12.5px; color: #4b5a3c; font-weight: 600; margin-top: 6px; }

  .swap-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;
    page-break-inside: avoid;
  }
  .swap-bad {
    flex: 1;
    background: #fef2f2;
    border-left: 4px solid #c0392b;
    padding: 12px 16px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 600;
    color: #c0392b;
  }
  .swap-arrow { font-size: 20px; font-weight: 700; color: #4b5a3c; }
  .swap-good {
    flex: 1;
    background: #f4f6f0;
    border-left: 4px solid #4b5a3c;
    padding: 12px 16px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 600;
    color: #4b5a3c;
  }

  .checklist { list-style: none; padding: 0; }
  .checklist li {
    padding: 10px 0 10px 32px;
    border-bottom: 1px solid #eee;
    position: relative;
    font-size: 14px;
    color: #333;
    line-height: 1.5;
    page-break-inside: avoid;
  }
  .checklist li::before {
    content: "\\2713";
    position: absolute;
    left: 0;
    color: #4b5a3c;
    font-weight: 700;
    font-size: 16px;
  }

  .quote-block {
    border-left: 3px solid #4b5a3c;
    padding: 14px 20px;
    margin: 20px 0;
    background: #f4f6f0;
    border-radius: 0 4px 4px 0;
    page-break-inside: avoid;
  }
  .quote-block p { font-style: italic; color: #444; font-size: 14px; margin: 0; }
  .quote-block cite { display: block; font-size: 11px; color: #999; margin-top: 6px; font-style: normal; }

  .week-day {
    background: #f8faf6;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 12px;
    page-break-inside: avoid;
  }
  .week-day h4 { font-size: 14px; font-weight: 700; color: #4b5a3c; margin-bottom: 6px; }
  .week-day p { font-size: 13px; color: #444; margin: 0; line-height: 1.6; }

  .highlight-box {
    background: linear-gradient(135deg, #4b5a3c 0%, #5a6b48 100%);
    color: #fff;
    border-radius: 10px;
    padding: 24px 28px;
    margin: 24px 0;
    page-break-inside: avoid;
  }
  .highlight-box h4 { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
  .highlight-box p { font-size: 13.5px; opacity: 0.9; margin: 0; line-height: 1.7; }

  .footer-page {
    page-break-before: always;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #4b5a3c;
    color: white;
    text-align: center;
    padding: 80px 60px;
  }
  .footer-page h2 { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 800; margin-bottom: 16px; }
  .footer-page p { font-size: 16px; opacity: 0.8; max-width: 460px; line-height: 1.7; margin-bottom: 32px; }
  .footer-page .brand { font-size: 14px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; opacity: 0.4; }
  .footer-page .url { font-size: 18px; font-weight: 600; opacity: 0.7; margin-bottom: 8px; }
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div class="cover-bonus">EXCLUSIEVE BONUS</div>
  <div class="cover-title">Huid<span>voeding</span></div>
  <div class="cover-subtitle">Hoe je huid eruitziet wordt niet bepaald door wat je erop smeert — maar door wat je eet. De complete gids voor huidherstel van binnenuit.</div>
  <div class="cover-line"></div>
  <div class="cover-brand">Oergezond</div>
  <div class="cover-url">www.oergezond.com</div>
</div>

<!-- INLEIDING -->
<div class="page">
  <div class="page-label">Inleiding</div>
  <div class="page-divider"></div>
  <h2>Je huid is een spiegel</h2>

  <p>Droge huid. Eczeem. Acne op je 35e. Roodheid die maar niet weggaat. Rimpels die te vroeg komen. Psoriasis die opvlamt als je stress hebt.</p>

  <p>De cosmetica-industrie heeft je geleerd om naar de buitenkant te kijken. Nog een serum. Nog een crème. Nog een toner met 14 ingrediënten die je niet kunt uitspreken.</p>

  <p>Maar je huid is geen geïsoleerd orgaan. Het is het grootste orgaan van je lichaam — en het is direct verbonden met je darmen, je lever, je hormonen en je voeding.</p>

  <p><strong>Je huid laat zien wat er vanbinnen gebeurt.</strong></p>

  <p>Acne op je kaak? Dat wijst op hormonen. Droge, schilferige huid? Dat wijst op een tekort aan vetoplosbare vitamines. Eczeem? Dat wijst op een doorlatende darmwand. Vroegtijdige veroudering? Dat wijst op oxidatieve stress door verkeerde vetten.</p>

  <p>In deze gids leer je precies welke voedingsstoffen je huid nodig heeft, welk voedsel je huid kapotmaakt, en hoe je met simpele aanpassingen in je dieet je huid van binnenuit kunt herstellen.</p>

  <div class="quote-block">
    <p>"De huid is de buitenkant van je binnenkant. Als je huid problemen heeft, kijk dan eerst naar je bord."</p>
    <cite>— Dr. Cate Shanahan, Deep Nutrition</cite>
  </div>
</div>

<!-- HOOFDSTUK 1: HOE JE HUID WERKT -->
<div class="page">
  <div class="page-label">Hoofdstuk 1</div>
  <div class="page-divider"></div>
  <h2>Hoe je huid werkt — de basis</h2>

  <p>Je huid bestaat uit drie lagen. Om te begrijpen hoe voeding je huid beïnvloedt, moet je weten wat elke laag doet.</p>

  <h3>Epidermis — de buitenlaag</h3>
  <p>Dit is wat je ziet en aanraakt. De epidermis bestaat uit dode huidcellen die als een muur samengehouden worden door ceramiden — vetten die je lichaam zelf aanmaakt. Als je te weinig van de juiste vetten eet, kan je lichaam niet genoeg ceramiden produceren. Resultaat: een zwakke huidbarrière, vochtverlies, droogheid en gevoeligheid.</p>

  <h3>Dermis — de middenlaag</h3>
  <p>Hier zit het collageen en elastine — de eiwitten die je huid stevig en elastisch houden. Collageen maakt 75% uit van je huid. Na je 25e verlies je elk jaar ongeveer 1% collageen. Maar dat tempo wordt enorm versneld door suiker, zaadoliën en UV-schade.</p>
  <p class="source">Bron: Ganceviciene et al., Journal of Dermatological Science, 2012</p>

  <h3>Subcutis — de onderlaag</h3>
  <p>Vetweefsel dat je huid voedt en isoleert. De kwaliteit van dit vet wordt direct bepaald door de vetten die je eet. Eet je veel zaadoliën? Dan sla je instabiele, ontstekingsbevorderende vetten op — letterlijk in je huid.</p>

  <div class="highlight-box">
    <h4>De huid-darm-as</h4>
    <p>Je darmen en je huid communiceren constant via je immuunsysteem en je bloedstroom. Wat er in je darmen gebeurt, zie je terug op je huid. Dit heet de gut-skin axis — en het verklaart waarom voedsel zo'n directe impact heeft op huidproblemen.</p>
  </div>
  <p class="source">Bron: Salem et al., Frontiers in Microbiology, 2018</p>
</div>

<!-- HOOFDSTUK 2: WAT JE HUID KAPOTMAAKT -->
<div class="page">
  <div class="page-label">Hoofdstuk 2</div>
  <div class="page-divider"></div>
  <h2>5 voedingsmiddelen die je huid kapotmaken</h2>

  <p>Dit zijn de grootste vijanden van gezonde huid. Niet omdat wij het zeggen — maar omdat het onderzoek er glashelder over is.</p>

  <div class="danger-card">
    <h4>1. Zaadoliën (zonnebloem-, koolzaad-, sojaolie)</h4>
    <p>Zaadoliën zijn extreem hoog in linolzuur (omega-6). Dit verstoort je omega-balans en veroorzaakt chronische ontsteking in je huidweefsel. Linolzuur wordt opgeslagen in je huidcellen en maakt ze gevoeliger voor UV-schade en oxidatie. Het versnelt huidveroudering meetbaar.</p>
  </div>
  <p class="source">Bron: Ramsden et al., BMJ, 2013 · Pezeshki et al., Lipids in Health and Disease, 2014</p>

  <div class="danger-card">
    <h4>2. Suiker en geraffineerde koolhydraten</h4>
    <p>Suiker bindt zich aan collageen via een proces dat glycatie heet. Dit maakt je collageen stijf en broos — het verliest zijn elasticiteit. AGEs (advanced glycation end-products) stapelen zich op in je huid en zijn een directe oorzaak van rimpels, doorhangende huid en een doffe teint.</p>
  </div>
  <p class="source">Bron: Danby, Journal of the American College of Nutrition, 2010</p>

  <div class="danger-card">
    <h4>3. Zuivelproducten (vooral magere)</h4>
    <p>Magere zuivel bevat hoge concentraties IGF-1 (insuline-achtige groeifactor) en hormonen die talgproductie stimuleren. Onderzoek toont een duidelijk verband tussen magere melk en acne. Volle, onbewerkte zuivel van grasgevoerde koeien is een heel ander verhaal.</p>
  </div>
  <p class="source">Bron: Adebamowo et al., Journal of the American Academy of Dermatology, 2005</p>

  <div class="danger-card">
    <h4>4. Gluten (bij gevoelige mensen)</h4>
    <p>Bij mensen met glutengevoeligheid of coeliakie veroorzaakt gluten zonuline-afgifte — dit opent de tight junctions in je darmwand. Het gevolg: onverteerde eiwitten en toxines lekken je bloedstroom in en triggeren een immuunreactie die zich uit op je huid. Denk aan eczeem, dermatitis herpetiformis en psoriasis.</p>
  </div>
  <p class="source">Bron: Fasano, Clinical Reviews in Allergy & Immunology, 2012</p>

  <div class="danger-card">
    <h4>5. Alcohol</h4>
    <p>Alcohol dehydrateert je huid, belast je lever (die toxines moet verwerken die anders via je huid uitgescheiden worden), verstoort je slaap en verlaagt je zinkspiegels. Zink is essentieel voor huidherstel. Regelmatig drinken versnelt huidveroudering en verergert rosacea, acne en eczeem.</p>
  </div>
  <p class="source">Bron: Goodman et al., Journal of Clinical and Aesthetic Dermatology, 2009</p>
</div>

<!-- HOOFDSTUK 3: BOUWSTENEN VOOR GEZONDE HUID -->
<div class="page">
  <div class="page-label">Hoofdstuk 3</div>
  <div class="page-divider"></div>
  <h2>De 10 bouwstenen voor gezonde huid</h2>

  <p>Dit zijn de voedingsstoffen die je huid nodig heeft om zichzelf te herstellen, te beschermen en jong te houden. Geen supplementen — gewoon echt voedsel.</p>

  <div class="nutrient-card">
    <div class="role">Bouwsteen 1 — Structuur</div>
    <h4>Collageen</h4>
    <p>Het eiwit dat je huid stevig en elastisch houdt. Je lichaam maakt het zelf, maar heeft de bouwstenen nodig: glycine, proline en hydroxyproline. De makkelijkste manier om die binnen te krijgen? Bottenbouillon en orgaanvlees.</p>
    <div class="foods">Eet: bottenbouillon, kippenvel, varkensoor, ossenstaart, gelatine</div>
  </div>

  <div class="nutrient-card">
    <div class="role">Bouwsteen 2 — Herstel</div>
    <h4>Vitamine A (retinol)</h4>
    <p>Versnelt celvernieuwing, reguleert talgproductie en is essentieel voor huidherstel. Niet te verwarren met bèta-caroteen uit wortels — dat moet je lichaam eerst omzetten en dat lukt bij veel mensen slecht. Echte vitamine A komt uit dierlijke bronnen.</p>
    <div class="foods">Eet: lever (de #1 bron), eidooiers, boter, levertraan</div>
  </div>

  <div class="nutrient-card">
    <div class="role">Bouwsteen 3 — Barrière</div>
    <h4>Omega-3 vetzuren (EPA &amp; DHA)</h4>
    <p>Ontstekingsremmend, versterkt de huidbarrière en vermindert gevoeligheid voor UV-schade. De verhouding omega-3 tot omega-6 bepaalt hoe ontstoken of kalm je huid is. Meer omega-3, minder ontsteking.</p>
    <div class="foods">Eet: wilde zalm, sardines, makreel, haring, kabeljauwlever</div>
  </div>
  <p class="source">Bron: Pilkington et al., Experimental Dermatology, 2011</p>

  <div class="nutrient-card">
    <div class="role">Bouwsteen 4 — Genezing</div>
    <h4>Zink</h4>
    <p>Essentieel voor wondgenezing, celgroei en immuunfunctie. Zinktekort is gelinkt aan acne, eczeem en trage huidgenezing. De meeste mensen krijgen te weinig binnen.</p>
    <div class="foods">Eet: oesters (#1 bron), rood vlees, pompoenpitten, lever</div>
  </div>

  <div class="nutrient-card">
    <div class="role">Bouwsteen 5 — Bescherming</div>
    <h4>Vitamine E</h4>
    <p>Een krachtige antioxidant die je huidcellen beschermt tegen oxidatieve schade door UV-straling en vrije radicalen. Werkt synergistisch met vitamine C — samen zijn ze effectiever dan alleen.</p>
    <div class="foods">Eet: amandelen, zonnebloempitten, avocado, extra vierge olijfolie</div>
  </div>

  <div class="nutrient-card">
    <div class="role">Bouwsteen 6 — Collageen-cofactor</div>
    <h4>Vitamine C</h4>
    <p>Zonder vitamine C kan je lichaam geen collageen aanmaken. Het is ook een antioxidant die hyperpigmentatie vermindert en je teint egaler maakt. Eet het — smeer het niet (topicaal vitamine C oxideert snel).</p>
    <div class="foods">Eet: paprika, broccoli, kiwi, aardbeien, citrusvruchten</div>
  </div>

  <div class="nutrient-card">
    <div class="role">Bouwsteen 7 — Vocht &amp; elasticiteit</div>
    <h4>Verzadigd vet &amp; cholesterol</h4>
    <p>Je huidcellen hebben verzadigd vet en cholesterol nodig om stevige celmembranen te bouwen. Zonder genoeg verzadigd vet wordt je huidbarrière dun en lek. Dit is waarom mensen op vetarme diëten vaak droge huid krijgen.</p>
    <div class="foods">Eet: boter, ghee, kokosvet, eidooiers, tallow</div>
  </div>

  <div class="nutrient-card">
    <div class="role">Bouwsteen 8 — Anti-aging</div>
    <h4>Glycine</h4>
    <p>Het meest voorkomende aminozuur in collageen. De meeste mensen krijgen veel te weinig glycine binnen omdat we geen bindweefsel, huid en botten meer eten. Glycine ondersteunt collageenproductie, leverfunctie en slaapkwaliteit — alle drie cruciaal voor huidherstel.</p>
    <div class="foods">Eet: bottenbouillon, gelatine, varkenspootjes, kippenvel</div>
  </div>

  <div class="nutrient-card">
    <div class="role">Bouwsteen 9 — Darmgezondheid</div>
    <h4>Probiotica &amp; gefermenteerd voedsel</h4>
    <p>Een gezond darmmicrobioom betekent een gezonde huid. Probiotische bacteriën verminderen systemische ontsteking, versterken de darmbarrière en verminderen de doorlaatbaarheid die huidproblemen triggert.</p>
    <div class="foods">Eet: zuurkool (rauw), kimchi, kefir, kombucha, yoghurt (vol)</div>
  </div>
  <p class="source">Bron: Bowe & Logan, Gut Pathogens, 2011</p>

  <div class="nutrient-card">
    <div class="role">Bouwsteen 10 — Mineralen</div>
    <h4>Selenium</h4>
    <p>Beschermt je huid tegen UV-schade van binnenuit, ondersteunt de schildklierfunctie (die je huidgezondheid beïnvloedt) en werkt als antioxidant via glutathionperoxidase.</p>
    <div class="foods">Eet: paranoten (2 per dag = genoeg), vis, eieren, lever</div>
  </div>
</div>

<!-- HOOFDSTUK 4: DE DARM-HUID CONNECTIE -->
<div class="page">
  <div class="page-label">Hoofdstuk 4</div>
  <div class="page-divider"></div>
  <h2>De darm-huid connectie</h2>

  <p>Dit is het hoofdstuk dat de meeste dermatologen overslaan. En het is misschien wel het belangrijkste.</p>

  <h3>Wat is een lekkende darm?</h3>
  <p>Je darmwand is ontworpen als een selectieve barrière. Het laat voedingsstoffen door en houdt toxines, bacteriën en onverteerde eiwitten tegen. Maar als de tight junctions — de sluitspieren tussen je darmcellen — beschadigd raken, gaat die barrière open.</p>

  <p>Toxines en eiwitten lekken je bloedstroom in. Je immuunsysteem reageert. Er ontstaat chronische ontsteking. En die ontsteking uit zich op het zwakste punt — bij veel mensen is dat de huid.</p>

  <h3>Wat beschadigt je darmwand?</h3>
  <div class="danger-card">
    <h4>Gluten</h4>
    <p>Stimuleert zonuline-afgifte, wat de tight junctions opent. Niet alleen bij coeliakiepatiënten — ook bij een deel van de gezonde populatie.</p>
  </div>
  <div class="danger-card">
    <h4>Antibiotica</h4>
    <p>Vernietigen je darmmicrobioom — zowel slechte als goede bacteriën. Na één antibioticakuur kan het maanden duren voordat je microbioom hersteld is.</p>
  </div>
  <div class="danger-card">
    <h4>NSAIDs (ibuprofen, aspirine)</h4>
    <p>Beschadigen de darmslijmlaag direct. Regelmatig gebruik vergroot de doorlaatbaarheid van je darmwand meetbaar.</p>
  </div>
  <div class="danger-card">
    <h4>Chronische stress</h4>
    <p>Cortisol vermindert de bloedtoevoer naar je darmen en vertraagt de vernieuwing van je darmcellen. Stress gaat letterlijk door je darmen heen — en je ziet het op je huid.</p>
  </div>

  <h3>Hoe herstel je je darmwand?</h3>
  <div class="safe-card">
    <h4>Bottenbouillon</h4>
    <p>Bevat glycine, glutamine en gelatine — drie stoffen die je darmslijmlaag herstellen. Drink 1-2 koppen per dag. Dit is de krachtigste darmherstellende voeding die er bestaat.</p>
  </div>
  <div class="safe-card">
    <h4>L-Glutamine</h4>
    <p>Het primaire brandstof voor je darmcellen. Je darmen verbruiken meer glutamine dan elk ander orgaan. Vlees, vis en eieren zijn de beste bronnen.</p>
  </div>
  <div class="safe-card">
    <h4>Gefermenteerd voedsel</h4>
    <p>Voedt je goede darmbacteriën en introduceert nieuwe stammen. Zuurkool, kimchi en kefir zijn de beste opties. Kies altijd onverhit en ongepasteuriseerd.</p>
  </div>
  <div class="safe-card">
    <h4>Vermijd de schade</h4>
    <p>Het heeft geen zin om te herstellen als je tegelijk blijft beschadigen. Vermijd zaadoliën, geraffineerde suiker en onnodige medicijnen. Dat doet meer dan elk supplement.</p>
  </div>
</div>

<!-- HOOFDSTUK 5: VAN BUITENAF — TALLOW -->
<div class="page">
  <div class="page-label">Hoofdstuk 5</div>
  <div class="page-divider"></div>
  <h2>Van buitenaf: waarom tallow werkt</h2>

  <p>Dit boekje gaat over voeding van binnenuit. Maar het verhaal is niet compleet zonder te begrijpen wat je op je huid smeert — en waarom dat ertoe doet.</p>

  <h3>Het probleem met conventionele huidverzorging</h3>
  <p>De gemiddelde vrouw smeert dagelijks 12 producten op haar huid met gemiddeld 168 chemische ingrediënten. Je huid is permeabel — het absorbeert een deel van alles wat je erop smeert. Parabenen, ftalaten, synthetische geurstoffen en oestrogeen-imiterende stoffen komen zo direct in je bloed.</p>
  <p class="source">Bron: Environmental Working Group, 2004</p>

  <p>Veel conventionele crèmes zijn gebaseerd op zaadoliën, minerale oliën (petroleum) of siliconen. Ze leggen een film over je huid die vochtuitwisseling blokkeert. Ze voeden je huid niet — ze maskeren het probleem.</p>

  <h3>Waarom tallow (rundvet) wél werkt</h3>
  <p>Tallow — gereinigd vet van grasgevoerde koeien — heeft een vetzuurprofiel dat bijna identiek is aan menselijke talg. Je huid herkent het letterlijk als eigen materiaal.</p>

  <div class="safe-card">
    <h4>Vetzuurprofiel matcht je huid</h4>
    <p>Tallow bevat palmitinezuur, stearinezuur en oliezuur in dezelfde verhoudingen als je eigen huidvet. Daardoor trekt het diep in zonder poriën te verstoppen.</p>
  </div>
  <div class="safe-card">
    <h4>Natuurlijke vitamines A, D, E en K</h4>
    <p>Grasgevoerd tallow zit vol vetoplosbare vitamines die je huid direct kan gebruiken. Geen synthetische toevoegingen nodig — het zit er van nature in.</p>
  </div>
  <div class="safe-card">
    <h4>CLA (conjugated linoleic acid)</h4>
    <p>Een vettype dat ontstekingsremmend werkt en de huidbarrière versterkt. CLA komt alleen voor in vet van grasetende dieren.</p>
  </div>
  <div class="safe-card">
    <h4>Geen troep</h4>
    <p>Geen parabenen, geen ftalaten, geen synthetische geurstoffen, geen hormoonverstorende stoffen. Gewoon puur vet, zoals de natuur het bedoeld heeft.</p>
  </div>

  <div class="highlight-box">
    <h4>De combinatie: voeding + tallow</h4>
    <p>De krachtigste aanpak voor huidherstel is de combinatie: je huid voeden van binnenuit met de juiste bouwstenen, en beschermen van buitenaf met een vet dat je huid herkent. Dat is waar echte resultaten vandaan komen — niet uit een tube met 40 ingrediënten.</p>
  </div>
</div>

<!-- HOOFDSTUK 6: HET 14-DAGEN HUIDVOEDINGSPLAN -->
<div class="page">
  <div class="page-label">Hoofdstuk 6</div>
  <div class="page-divider"></div>
  <h2>Het 14-dagen huidvoedingsplan</h2>

  <p>Geen ingewikkeld dieet. Geen dure supplementen. Gewoon 14 dagen waarin je de juiste dingen eet, de verkeerde dingen weglaat, en je huid de kans geeft om te herstellen.</p>

  <h3>Week 1: Opruimen</h3>

  <div class="week-day">
    <h4>Dag 1-3: Elimineer de vijanden</h4>
    <p>Haal zaadoliën, geraffineerde suiker en ultrabewerkt voedsel uit je keuken. Vervang bakolie door boter of ghee. Lees etiketten — zaadoliën zitten overal. Dit alleen al maakt een enorm verschil.</p>
  </div>

  <div class="week-day">
    <h4>Dag 4-5: Voeg bottenbouillon toe</h4>
    <p>Begin elke ochtend met een kop bottenbouillon. Maak een grote pan die de hele week meegaat. Dit is de basis voor darmherstel en collageenproductie. Drink minimaal 250ml per dag.</p>
  </div>

  <div class="week-day">
    <h4>Dag 6-7: Lever en vette vis</h4>
    <p>Eet deze week twee keer vette vis (zalm, sardines, makreel) en één keer lever. Lever is het meest voedingsdichte voedsel dat bestaat — 100 gram dekt je behoefte aan vitamine A, B12, folaat en koper voor de hele week.</p>
  </div>

  <h3>Week 2: Opbouwen</h3>

  <div class="week-day">
    <h4>Dag 8-10: Gefermenteerd voedsel</h4>
    <p>Voeg dagelijks een portie zuurkool, kimchi of kefir toe bij je maaltijden. Begin klein (1-2 eetlepels) en bouw op. Je darmen moeten wennen aan de probiotica.</p>
  </div>

  <div class="week-day">
    <h4>Dag 11-12: Eidooiers en orgaanvlees</h4>
    <p>Eet 2-4 eidooiers per dag (van scharrelkippen). Probeer naast lever ook andere organen: hart is mild van smaak en vol CoQ10 en B-vitamines. Meng het door gehakt als je de smaak lastig vindt.</p>
  </div>

  <div class="week-day">
    <h4>Dag 13-14: Consolideer</h4>
    <p>Je nieuwe routine staat. Bottenbouillon als basis, vette vis twee keer per week, lever één keer per week, dagelijks gefermenteerd voedsel, geen zaadoliën. Let op je huid — veel mensen zien al na twee weken verschil in helderheid en textuur.</p>
  </div>

  <div class="quote-block">
    <p>"Je hoeft het niet perfect te doen. Je hoeft het alleen maar beter te doen dan gisteren. Elke maaltijd is een kans."</p>
    <cite>— Jorn &amp; Rosa, Oergezond</cite>
  </div>
</div>

<!-- HOOFDSTUK 7: HUIDPROBLEMEN & VOEDING -->
<div class="page">
  <div class="page-label">Hoofdstuk 7</div>
  <div class="page-divider"></div>
  <h2>Veelvoorkomende huidproblemen en hun voedingsoorzaak</h2>

  <p>Elke huidklacht heeft een voedingscomponent. Hieronder de meest voorkomende — en wat je kunt doen.</p>

  <h3>Acne</h3>
  <div class="safe-card">
    <h4>Mogelijke voedingsoorzaken</h4>
    <p>Hoge insulinespiegels (door suiker en geraffineerde koolhydraten), magere zuivel (IGF-1), zaadoliën (ontsteking), zinktekort.</p>
  </div>
  <div class="safe-card">
    <h4>Voedingsaanpak</h4>
    <p>Elimineer suiker en magere zuivel. Eet zinkrijk voedsel (oesters, rood vlees). Verhoog omega-3 inname. Eet lever voor vitamine A — de krachtigste voedingsstof voor talgregulatie.</p>
  </div>

  <h3>Eczeem</h3>
  <div class="safe-card">
    <h4>Mogelijke voedingsoorzaken</h4>
    <p>Lekkende darm (gluten, zaadoliën), omega-6 overschot, tekort aan vitamine D, histamine-intolerantie, verstoord microbioom.</p>
  </div>
  <div class="safe-card">
    <h4>Voedingsaanpak</h4>
    <p>Herstel je darmwand met bottenbouillon. Elimineer gluten en zaadoliën. Eet vette vis voor omega-3. Voeg gefermenteerd voedsel toe. Smeer tallow op de aangedane plekken — het voedt en beschermt de huidbarrière zonder irriterende ingrediënten.</p>
  </div>

  <h3>Droge huid</h3>
  <div class="safe-card">
    <h4>Mogelijke voedingsoorzaken</h4>
    <p>Te weinig verzadigd vet en cholesterol in je dieet, tekort aan vetoplosbare vitamines (A, D, E, K), dehydratie, tekort aan omega-3.</p>
  </div>
  <div class="safe-card">
    <h4>Voedingsaanpak</h4>
    <p>Eet meer boter, ghee, eidooiers en vette vis. Drink bottenbouillon. Zorg voor voldoende water (30ml per kg lichaamsgewicht). Smeer tallow aan als nachtcrème — het trekt diep in en herstelt het vetniveau van je huid.</p>
  </div>

  <h3>Vroegtijdige veroudering</h3>
  <div class="safe-card">
    <h4>Mogelijke voedingsoorzaken</h4>
    <p>Glycatie door suiker (beschadigt collageen), oxidatie door zaadoliën, tekort aan antioxidanten, te weinig collageen in je dieet.</p>
  </div>
  <div class="safe-card">
    <h4>Voedingsaanpak</h4>
    <p>Elimineer suiker en zaadoliën (de twee grootste versnellers van huidveroudering). Eet collageen-rijke voeding (bottenbouillon, gelatine). Eet kleurrijk fruit en groenten voor antioxidanten. Smeer tallow aan voor vitamine E bescherming van buitenaf.</p>
  </div>

  <h3>Rosacea</h3>
  <div class="safe-card">
    <h4>Mogelijke voedingsoorzaken</h4>
    <p>Darmontsteking, SIBO (bacteriële overgroei), alcohol, pittig eten, histamine-rijke voeding.</p>
  </div>
  <div class="safe-card">
    <h4>Voedingsaanpak</h4>
    <p>Pak de darm aan: bottenbouillon, gefermenteerd voedsel, elimineer alcohol. Vermijd bekende triggers. Veel mensen met rosacea hebben baat bij het elimineren van histamine-rijke voeding (wijn, oude kaas, avocado) gedurende 4-6 weken.</p>
  </div>
</div>

<!-- BRONNEN -->
<div class="page">
  <div class="page-label">Bronnen</div>
  <div class="page-divider"></div>
  <h2>Wetenschappelijke bronnen</h2>

  <p>Alle claims in deze gids zijn gebaseerd op peer-reviewed onderzoek of traditionele voedingsprincipes met een lange track record.</p>

  <p><strong>Collageenafname en huidveroudering:</strong><br>Ganceviciene R et al. "Skin anti-aging strategies." Dermato-Endocrinology, 2012.</p>

  <p><strong>Darm-huid-as:</strong><br>Salem I et al. "The gut microbiome as a major regulator of the gut-skin axis." Frontiers in Microbiology, 2018.</p>

  <p><strong>Omega-6 en huidontsteking:</strong><br>Ramsden CE et al. "Use of dietary linoleic acid for secondary prevention." BMJ, 2013.<br>Pezeshki A et al. "The effect of dietary omega-6 to omega-3 ratio on skin." Lipids in Health and Disease, 2014.</p>

  <p><strong>Suiker en glycatie:</strong><br>Danby FW. "Nutrition and aging skin: sugar and glycation." Journal of the American College of Nutrition, 2010.</p>

  <p><strong>Zuivel en acne:</strong><br>Adebamowo CA et al. "High school dietary dairy intake and teenage acne." JAAD, 2005.</p>

  <p><strong>Gluten en darmpermeabiliteit:</strong><br>Fasano A. "Zonulin, regulation of tight junctions, and autoimmune diseases." Clinical Reviews in Allergy & Immunology, 2012.</p>

  <p><strong>Omega-3 en huidbarrière:</strong><br>Pilkington SM et al. "Omega-3 polyunsaturated fatty acids: photoprotective macronutrients." Experimental Dermatology, 2011.</p>

  <p><strong>Probiotica en huid:</strong><br>Bowe WP, Logan AC. "Acne vulgaris, probiotics and the gut-brain-skin axis." Gut Pathogens, 2011.</p>

  <p><strong>Chemische blootstelling via huidverzorging:</strong><br>Environmental Working Group. "Skin Deep: Cosmetic Safety Database." 2004-2024.</p>

  <p><strong>Tallow en huidcompatibiliteit:</strong><br>Lampe MA et al. "Human stratum corneum lipids: characterization and regional variations." Journal of Lipid Research, 1983.</p>
</div>

<!-- BACK COVER -->
<div class="footer-page">
  <h2>Je huid herstelt. <br>Geef het de juiste bouwstenen.</h2>
  <p>Eet echt voedsel. Vermijd de troep. Smeer puur vet. De rest regelt je lichaam zelf — zoals de natuur het bedoeld heeft.</p>
  <div class="url">www.oergezond.com</div>
  <div class="brand">Oergezond</div>
</div>

</body>
</html>`;
}

async function main() {
  console.log("Huidvoeding Gids PDF genereren...");

  const html = buildHtml();

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  try {
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 });
    } catch {
      await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 });
    }
    await Promise.race([
      page.evaluate(() => document.fonts.ready),
      new Promise((r) => setTimeout(r, 10000)),
    ]);

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "48px", bottom: "48px", left: "0", right: "0" },
    });
    const buf = Buffer.from(pdfBuffer);
    console.log("PDF: " + (buf.length / 1024).toFixed(0) + " KB");

    // Verstuur naar Telegram
    const boundary = "----FormBoundary" + Date.now();
    const filename = "huidvoeding-gids-oergezond.pdf";
    const caption = "*Huidvoeding — De Complete Gids*\n\nExclusieve bonus bij 2+1 gratis Oercrème:\n\n- Hoe je huid werkt van binnenuit\n- 5 voedingsmiddelen die je huid kapotmaken\n- 10 bouwstenen voor gezonde huid\n- De darm-huid connectie\n- Waarom tallow werkt\n- 14-dagen huidvoedingsplan\n- Huidproblemen & hun voedingsoorzaak\n\nKlaar voor gebruik.";

    const parts = [
      Buffer.from("--" + boundary + "\r\nContent-Disposition: form-data; name=\"chat_id\"\r\n\r\n" + cfg.TELEGRAM_CHAT_ID + "\r\n"),
      Buffer.from("--" + boundary + "\r\nContent-Disposition: form-data; name=\"caption\"\r\n\r\n" + caption + "\r\n"),
      Buffer.from("--" + boundary + "\r\nContent-Disposition: form-data; name=\"parse_mode\"\r\n\r\nMarkdown\r\n"),
      Buffer.from("--" + boundary + "\r\nContent-Disposition: form-data; name=\"document\"; filename=\"" + filename + "\"\r\nContent-Type: application/pdf\r\n\r\n"),
      buf,
      Buffer.from("\r\n--" + boundary + "--\r\n"),
    ];
    const body = Buffer.concat(parts);

    const res = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: "api.telegram.org",
        path: "/bot" + cfg.TELEGRAM_TOKEN + "/sendDocument",
        method: "POST",
        headers: { "Content-Type": "multipart/form-data; boundary=" + boundary, "Content-Length": body.length },
      }, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve(JSON.parse(data)));
      });
      req.on("error", reject);
      req.write(body);
      req.end();
    });

    if (res.ok) console.log("PDF verstuurd naar Telegram!");
    else console.error("Telegram fout:", JSON.stringify(res));
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error("FOUT:", e.message); process.exit(1); });
