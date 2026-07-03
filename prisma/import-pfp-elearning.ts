import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "@prisma/client";

import { hashPassword } from "../src/lib/password.ts";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      "postgresql://placeholder:***@localhost:5432/fyfitacademy?schema=public",
  }),
});

const COURSE_SLUG = "patellofemorale-pijn-review";
const REVIEWER_EMAIL = "accreditatie-review@fy-fit.nl";
const REVIEWER_PASSWORD = "fyfit-review-2026";
const ASSET_BASE = "/lms/pfp";

const moduleTexts: Record<number, string> = {
  "1": "Module 1: Een nieuw paradigma\nFocus\n\nDe prevalentie en het natuurlijk beloop van PFP\n\nHet weerleggen van het kraakbeenmodel (chondromalacia) en het\nsporingsmodel (VMO-disfunctie)\n\nHet homeostasemodel van Scott Dye en het concept Envelope of Function\n\nVasculaire insufficiëntie als pijnmechanisme: veneuze occlusie, intra-ossale\ndruk en de consequenties voor training\n\nLeerdoelen\nNa deze module kan de cursist:\n\nDe diagnostische criteria voor PFP benoemen volgens het Manchester\nConsensus Statement (2016)\n\nBeargumenteren waarom structurele kraakbeenafwijkingen op MRI geen\nvoorspeller zijn voor de aanwezigheid van PFP\n\nUitleggen waarom geïsoleerde VMO-training niet langer het eerste\nbehandeldoel is bij PFP\n\nHet concept Envelope of Function toepassen om aan een patiënt uit te leggen\nhoe pijn kan ontstaan zonder structurele schade\n\nHet mechanisme van vasculaire insufficiëntie beschrijven en de rationale voor\nintermitterend trainen onderbouwen\n\nEven voorstellen:\nDit is Sanne, 22 jaar oud en student aan de RU (rechten). Ze meldt zich vandaag op\njouw spreekuur met zeurende pijn rondom de knieschijf sinds 4 maanden. Ze liep\nhiervoor 3 keer per week hard, maar dat gaat niet meer vanwege de klachten. Ze\nvertelt je: “Mijn huisarts zegt me dat er op de MRI niets te zien is, maar ik kan niet\neens een college uitzitten zonder pijn, laat staan traplopen of hardlopen. Ik ben bang\ndat mijn knie verslijt.”\nLes 1.1: Definitie en prevalentie\nPatellofemorale pijn (PFP) is een klinisch syndroom met zeer specifieke kenmerken,\nzoals beschreven in het internationale Manchester Consensus Statement uit 2016.\nDe pijn bevindt zich rondom of achter de patella en wordt uitgelokt of verergerd door\nminstens één activiteit waarbij het patellofemorale gewricht belast wordt in gebogen\nstand – denk aan traplopen, hurken, hardlopen of springen. Ook langdurig zitten\nmet gebogen knieën, de zogeheten theaterknie, kan de pijn provoceren.\n\nPFP is een exclusiediagnose. Dat betekent dat je de diagnose primair stelt door\nandere specifieke pathologieën aan de voorzijde van de knie systematisch uit te\nsluiten: patella tendinopathie (pijn specifiek aan de onderpool van de patella),\n\nmeniscusletsel of instabiliteit, en bij jongere patiënten groeigerelateerde\naandoeningen zoals Osgood-Schlatter of Sinding-Larsen-Johansson. Pas als je deze\nhebt uitgesloten en het klinische patroon van pijn bij belaste flexie aanwezig is, kun je\nspreken van PFP. In module 2 gaan we hier dieper op in.\n\nHoe vaak zie je PFP op je spreekuur? Waarschijnlijk vaker dan je denkt.\nPatellofemorale pijn is de meest voorkomende vorm van kniepijn in de algemene\nbevolking, met een jaarprevalentie van ongeveer 23% – en onder jongeren zelfs tot\n29%. In de eerstelijns fysiotherapie is PFP verantwoordelijk voor 25 tot 40% van alle\nkniegerelateerde consulten. Dat betekent dat je op een gemiddelde dag\nwaarschijnlijk minstens één patiënt met PFP ziet.\n\nMisschien herken je dit uit je opleiding: PFP werd lang afgedaan als een onschuldige\ngroeiklacht die vanzelf verdwijnt. De cijfers vertellen een ander verhaal. Een groot\nNederlands cohortonderzoek toonde aan dat 41% van de patiënten na één jaar nog\nsteeds pijn had, en 19% zelfs na zes jaar. Bij adolescenten houdt zelfs 65% na twee\njaar nog klachten. Sommige patiënten rapporteren tot 20 jaar na de eerste\npresentatie nog aanzienlijke symptomen. Dit is geen groeipijn die vanzelf overgaat –\nhet is een klacht die serieuze aandacht verdient.\n\nLiteratuur:\n(Barton & Crossley, 2016)\n\nBarton, C. J., & Crossley, K. M. (2016). 2016 Patellofemoral pain consensus\nstatement from the 4th International Patellofemoral Pain Research Retreat,\nManchester. Part 1: Terminology, definitions, clinical examination, natural history,\npatellofemoral osteoarthritis and patient-reported outcome measures. Br J Sports\nMed, 50(14), 833-834. https://doi.org/10.1136/bjsports-2015-095607\n\nLes 1.2: exit chondromalacia patellae\nVeel patiënten met kniepijn komen bij je binnen met de uitspraak: “Ik ben bang dat\nmijn knie verslijt.” Grote kans dat ze ooit de term “kraakbeenslijtage” of\n“chondromalacia patellae” heeft gehoord. Het is een term die al meer dan een eeuw\nhet denken over kniepijn domineert. In 1906 beschreef de Weense arts Konrad\nBüdinger voor het eerst het “verzachten” van het kraakbeen, en in 1918 werd de term\nofficieel ingevoerd door Oscar Aleman. Het idee was eenvoudig: pijn rond de\nknieschijf wordt veroorzaakt door pathologische veranderingen in het hyaline\nkraakbeen – slijtage of verzachting. Het kraakbeenmodel was geboren.\n\nModern onderzoek heeft deze directe link tussen kraakbeenschade en pijn echter\neffectief weerlegd. Al in de jaren ’80 ontdekten chirurgen tijdens artroscopiën dat\nveel patiënten met ernstige kniepijn een “perfecte” knieschijf hadden, terwijl mensen\nzónder pijn juist vaak kraakbeenafwijkingen vertoonden. Een belangrijke studie uit\n2016 van Van der Heijden bevestigde dit: kleine kraakbeendefecten kwamen bij 23%\nvan de PFP-patiënten voor, maar óók bij 21% van de gezonde controles. Structurele\nafwijkingen op een MRI voorspellen dus niet of iemand pijn heeft. Daar komt bij dat\nhyaline kraakbeen zelf geen zenuwen bevat en dus strikt genomen geen pijn kan\ngenereren. De pijn moet ergens anders vandaan komen.\n\nHet blijven gebruiken van de term “chondromalacia” is niet onschuldig; het kan de\nbehandeling zelfs tegenwerken. Wanneer een patiënt hoort dat zijn kraakbeen\n“zacht” is of “slijt”, ontstaat er vaak angst om te bewegen – kinesiofobie. Patiënten\nworden bang dat oefentherapie de knie verder beschadigt, terwijl belasting juist\nessentieel is voor herstel. Omdat de aandoening vaak “onzichtbaar” is op scans,\nvoelen patiënten zich soms niet serieus genomen als ze geen structurele diagnose\nkrijgen.\n\nSinds het Manchester Consensus Statement uit 2016 is de officiële consensus dat\nwe spreken over Patellofemorale Pijn (PFP). Dit verschuift de focus van “wat is er\nstuk” (anatomie) naar “hoe functioneert het weefsel” (biologie). Sanne’s MRI laat een\n“perfect” gewricht zien – en dat is precies wat je verwacht bij PFP.\n\nLiteratuur:\n(Barton & Crossley, 2016)\n(van der Heijden et al., 2016)\n\nBarton, C. J., & Crossley, K. M. (2016). 2016 Patellofemoral pain consensus\nstatement from the 4th International Patellofemoral Pain Research Retreat,\nManchester. Part 1: Terminology, definitions, clinical examination, natural history,\npatellofemoral osteoarthritis and patient-reported outcome measures. Br J Sports\nMed, 50(14), 833-834. https://doi.org/10.1136/bjsports-2015-095607\n\nvan der Heijden, R. A., de Kanter, J. L., Bierma-Zeinstra, S. M., Verhaar, J. A., van\nVeldhoven, P. L., Krestin, G. P., Oei, E. H., & van Middelkoop, M. (2016). Structural\nAbnormalities on Magnetic Resonance Imaging in Patients With Patellofemoral Pain:\nA Cross-sectional Case-Control Study. Am J Sports Med, 44(9), 2339-2346.\nhttps://doi.org/10.1177/0363546516646107\n\nLes 1.3: exit sporingsprobleem\nHerken je dit? Een patiënt met kniepijn, en je denkt meteen aan de VMO. “De\nbinnenkant van de quadriceps is te zwak, daardoor spoort de knieschijf verkeerd.”\nHet is een verklaring die generaties fysiotherapeuten hebben geleerd. Sinds de jaren\n’70 was het “maltracking model” het dominante verklaringsmodel voor PFP: de pijn\nontstaat door een verkeerde biomechanische sporing van de knieschijf, veroorzaakt\ndoor een disbalans in spieractiviteit of beperkte flexibiliteit van de weke delen.\n\nEen centraal onderdeel van dit model is de veronderstelde disfunctie van de Vastus\nMedialis Obliquus (VMO). Vroege studies suggereerden dat de VMO bij PFP-\npatiënten later aanspant dan de Vastus Lateralis. Recentere meta-analyses laten\nechter een enorme variatie in deze resultaten zien, wat de algemene geldigheid in\ntwijfel trekt. Men dacht ook vaak dat alleen de VMO dunner wordt bij PFP, maar\nonderzoek met echografie toont aan dat er meestal sprake is van een algehele\nafname van de quadriceps-dikte, en niet van selectieve VMO-atrofie.\n\nHoewel sporingafwijkingen soms worden waargenomen, is het bewijs voor een\ncausaal verband met de pijn zwak. PFP komt in de meeste gevallen voor in een knie\ndie er op scans biomechanisch en structureel volledig normaal uitziet. Er is geen\ndirect bewijs dat een verandering in de VMO-timing daadwerkelijk de pijn\nvermindert; het is waarschijnlijker dat verbeteringen door oefentherapie komen door\ngeleidelijke belasting van het gewricht dan door het “recht trekken” van de knieschijf\n(Powers et al., 2017).\n\nHet blijven focussen op “sporing” kan leiden tot onnodige angst bij de patiënt (“mijn\nknieschijf zit scheef”). In plaats van te zoeken naar een mechanische fout, verschuift\nde moderne fysiotherapie naar het verbeteren van de algehele belastbaarheid en\nhomeostase. Stel dat de vorige behandelaar van je patiënt had gezegd: “Je\nknieschijf spoort niet goed, je VMO is te zwak.” Dan was je patiënt nu waarschijnlijk\ngeïsoleerde VMO-oefeningen aan het doen. Met de kennis uit deze les weet je dat dit\nniet de juiste insteek is. Maar wat dan wél?\n\nLiteratuur:\n(Powers et al., 2017)\n\nPowers, C. M., Witvrouw, E., Davis, I. S., & Crossley, K. M. (2017). Evidence-based\nframework for a pathomechanical model of patellofemoral pain: 2017 patellofemoral\npain consensus statement from the 4th International Patellofemoral Pain Research\nRetreat, Manchester, UK: part 3. Br J Sports Med, 51(24), 1713-1723.\nhttps://doi.org/10.1136/bjsports-2017-098717\n\nLes 1.4: homeostasemodel\nWe hebben twee verouderde modellen achter ons gelaten: het kraakbeenmodel en\nhet sporingsmodel. Maar als het kraakbeen niet de oorzaak is, en de sporing ook niet\n– waar komt de pijn dan wél vandaan? Het antwoord komt van de Amerikaanse\northopedisch chirurg Scott Dye, die in de jaren ’90 een fundamenteel nieuw\nperspectief introduceerde: patellofemorale pijn ontstaat niet door schade, maar door\neen verstoring van de biologische homeostase in het gewricht. Volgens dit model is\nPFP het resultaat van een gewricht dat biologisch niet meer kan herstellen van de\nbelastingen die het te verduren krijgt.\n\nDye gebruikt het concept van de Envelope of Function om de relatie tussen\nbelasting en weefselherstel te visualiseren (zie figuur 1). Het model kent drie zones:\nDe Zone of Homeostasis is de veilige zone: hierbinnen kun je de knie belasten\nzonder dat er klachten ontstaan, het weefsel herstelt en onderhoudt zichzelf normaal.\nDe Zone of Supraphysiologic Overload is de zone waar de belasting groter is dan\nwat het weefsel biologisch aankan – er ontstaat géén directe schade, maar de\nhomeostase raakt verstoord. Dit is de zone waar PFP ontstaat.\n\nDe Zone of Structural Failure ten slotte is de zone van extreme belasting waar\ndaadwerkelijk structurele schade optreedt, zoals een fractuur of bandletsel.\nPFP wordt getriggerd door suprafysiologische belasting. Dit kan acuut gebeuren –\neen eenmalige, zeer hoge belasting buiten de normale grenzen – of chronisch, als\noveruse: een optelling van belastingen die elk apart in de veilige zone vallen, maar\ndoor een te hoge frequentie het biologische herstelvermogen uitputten. Dat laatste is\neen patroon dat je in de praktijk vaak ziet: intensief sporten gecombineerd met\nlangdurig zitten.\n\nEen cruciaal inzicht uit dit model is dat PFP in de meeste gevallen voorkomt in een\nknie die er op scans en biomechanisch volledig normaal uitziet. De pijn is een\nbiologisch signaal dat de grens van de belastbaarheid is overschreden. Wanneer de\nhomeostase eenmaal verstoord is, wordt de Envelope of Function tijdelijk kleiner – de\nzogeheten post-injury envelope. Activiteiten die voorheen pijnvrij waren,\nveroorzaken nu ineens wel pijn. Sanne’s knie is structureel gezond, maar “van slag”.\nEn dat is de boodschap die ze nodig heeft: het is geen schade, het is een biologisch\nsignaal dat we kunnen beïnvloeden.\n\nFiguur 1 Envelope of function\nLiteratuur:\n(Dye, 2005)\n\nDye, S. F. (2005). The pathophysiology of patellofemoral pain: a tissue homeostasis\nperspective. Clin Orthop Relat Res(436), 100-110.\nhttps://doi.org/10.1097/01.blo.0000172303.74414.7d\nLes 1.5: vasculaire insufficiëntie\nEen typisch verhaal dat je vaak hoort: “Als ik een tijdje heb gezeten en dan opsta,\ndoet mijn knie het meest pijn. Maar als ik rustig ga lopen, zakt het na een paar\nminuten.” Dit patroon – pijn bij stilzitten, verlichting bij lichte beweging – past niet bij\nhet klassieke beeld van slijtage. Het past wél bij een mechanisme dat we steeds\nbeter begrijpen: vasculaire insufficiëntie in het patellabot.\n\nIn de vorige les leerden we dat PFP ontstaat door een verstoorde homeostase. Maar\nhoe vertaalt die biologische onbalans zich naar de scherpe pijn die de patiënt voelt?\nHet antwoord ligt in de bloedvoorziening van de knieschijf. Wanneer de homeostase\nverstoord is, ontstaat er vaak vasculaire insufficiëntie: een tekortschietende\ndoorbloeding, specifiek in de afvoer van bloed. Onderzoek met Near-Infrared\nSpectroscopy (NIRS) suggereert dat bij PFP-patiënten de veneuze afvoer uit de\npatella wordt belemmerd tijdens belasting. Terwijl er nog wel bloed de knieschijf in\nstroomt, stagneert de afvoer – veneuze occlusie. Deze stuwing verhoogt de\nvloeistofdruk en het watergehalte binnen in het botweefsel van de patella.\n\nScott Dye bewees dit mechanisme spectaculair door bij zichzelf zoutoplossing in de\nknieschijf te injecteren om de druk te verhogen. Dit veroorzaakte direct een\n\n“plotselinge, ernstige en borende pijn” (Dye et al., 1998). Het bot is namelijk rijk aan\nzenuwen die gevoelig zijn voor drukveranderingen. Wanneer de doorbloeding\nchronisch tekortschiet, ontstaat er hypoxie in het bot en de omliggende weke delen.\nDit zet een keten van biologische reacties in gang: hyperinnervatie (meer\npijnzenuwen in de retinaculae), hypervascularisatie (nieuwe bloedvaatjes van\nslechte kwaliteit), en fibrose (littekenweefselvorming die de flexibiliteit van de knie\nverder vermindert).\n\nDit hemodynamische model verklaart ook waarom klassieke krachttraining de\nklachten soms kan verergeren. Tijdens een krachtige contractie van de quadriceps\nwordt het vasculaire netwerk rond de patella letterlijk dichtgeknepen door de\nspierspanning. De oplossing is even elegant als logisch: train met intermitterende\ncontracties, met minimaal twee seconden rust tussen elke herhaling, zodat het\nbloed tussendoor kan wegstromen. Dit wordt een centraal principe in module 3.\n\nLiteratuur:\n(Dye et al., 1998)\n\nDye, S. F., Vaupel, F. L., & Dye, C. C. (1998). Concious neurosensory mapping of the\ninternal structures of the human knee without intraarticular anesthesia. American\njournal of sports medicine, 26.\n\nToetsvragen Module 1",
  "2": "Module 2: Diagnostiek\nFocus\n\nHet systematisch uitsluiten van differentiaaldiagnoses aan de voorzijde van de\nknie\n\nHet onderscheid tussen PFP en patellatendinopathie\n\nDe uitvoering en interpretatie van de Decline Step Down Test (DSDT) als\nobjectieve uitkomstmaat\n\nDe uitvoering en interpretatie van de Lower Limb Range of Motion (LLROM)\ntest en de indeling in subgroepen\n\nLeerdoelen\nNa deze module kan de cursist:\n\nDe belangrijkste differentiaaldiagnoses bij anterieure kniepijn benoemen en\nsystematisch uitsluiten\n\nDe klinische kenmerken beschrijven waarmee PFP wordt onderscheiden van\npatellatendinopathie\n\nDe DSDT correct uitvoeren op een decline-positie van 20 graden en de\nMaximale Pijnvrije Flexiehoek (MPFH) bepalen met fotografische goniometrie\n\nDe referentiewaarden voor de MPFH benoemen en de uitkomst interpreteren\nin de context van het behandeltraject\n\nDe LLROM-test uitvoeren voor knieflexie en heupadductie, de\nreferentiewaarden toepassen en de patiënt indelen in subgroep 1, 2 of 3\nLes 2.1: Uitsluiten en bevestigen\nJe patiënt zit op de behandelbank. Je hebt een goed beeld van wat PFP is en hoe\nhet ontstaat. Maar voordat je die diagnose stelt, moet je één ding zeker weten: is het\ninderdaad PFP, of is er iets anders aan de hand? PFP is een exclusiediagnose. De\nofficiële standaard is dat de diagnose wordt gesteld door andere specifieke\npathologieën systematisch uit te sluiten.\n\nTijdens de klinische work-up moeten de volgende aandoeningen worden overwogen\nen uitgesloten: traumatisch letsel zoals meniscusletsel, kruisband- of\ncollateraalbandletsel of fracturen; gewrichtsspecifieke problematiek zoals\nkraakbeendefecten, patella-instabiliteit of patellofemorale artrose; overige lokale\nstructuren zoals bursitis, hoffitis of tractus iliotibiaal bandsyndroom; en referred pain\nvanuit de heup of de lumbale wervelkolom.\n\nHet is met name cruciaal om PFP te onderscheiden van patella tendinopathie\n(jumpers knee), aangezien de aanpak verschilt. Bij tendinopathie is de pijn zeer\nlokaal en belastingsafhankelijk, specifiek aan de onderpool van de patella of in het\nverloop van de patellapees. Dit wordt bevestigd door een positieve palpatietest, de\n\nRoyal London Hospital Test en pijn tijdens een single leg decline squat. Bij PFP\ndaarentegen is de pijn vaak diffuus aanwezig rondom de gehele knieschijf.\n\nBij jongere patiënten is het van belang om groeigerelateerde pathologie uit te\nsluiten: Morbus Osgood-Schlatter (pijn specifiek op de tuberositas tibiae) en Morbus\nSinding-Larsen-Johansson (apofysitis aan de onderpool van de patella). De diagnose\nPFP kan worden bevestigd zodra het klinische patroon van pijn bij belaste flexie\naanwezig is en deze specifieke oorzaken zijn uitgesloten.\n\nBij Sanne sluit je systematisch uit: de pijn zit niet specifiek aan de onderpool, er is\ngeen trauma-anamnese, en ze is 22 – geen groeigerelateerde problematiek meer.\nDe pijn is diffuus rondom de knieschijf, verergert bij traplopen, hurken en langdurig\nzitten. Het klinische patroon past bij PFP. Maar je wilt meer dan een klinische indruk\n– je wilt objectief vaststellen hoe ver haar belastbaarheid is afgenomen.\n\nLiteratuur:\n(Ophey et al., 2025)\n\nOphey, M., Koeter, S., van Ooijen, L., van Ark, M., Boots, F., Ilbrink, S., Lankhorst, N.\nA., Piscaer, T., Vestering, M., den Ouden Vierwind, M., van Linschoten, R., & van\nBerkel, S. (2025). Dutch multidisciplinary guideline on anterior knee pain:\nPatellofemoral pain and patellar tendinopathy. Knee Surg Sports Traumatol Arthrosc,\n33(2), 457-469. https://doi.org/10.1002/ksa.12367\nLes 2.2: de DSDT\nJe hebt vastgesteld dat het klachtenpatroon past bij PFP. Maar “pijn bij traplopen” is\nnog geen maat die je kunt evalueren. Je hebt een nulmeting nodig – een objectief\ngetal dat je kunt volgen over het behandeltraject. De Decline Step Down Test\n(DSDT) geeft je precies dat: de maximale hoek waarop de patiënt zijn knie pijnvrij\nkan belasten bij een beweging die traplopen simuleert. De test wordt uitgevoerd op\neen hellend vlak. Twee stepboxen worden in een decline-positie van 20 graden\ngeplaatst, waarbij de box aan het lage uiteinde 20 cm hoog is. De helling van 20\ngraden zorgt ervoor dat de mobiliteit van de enkel (dorsaalflexie) geen beperkende\nfactor is tijdens het afstappen – zo wordt de knie maximaal en specifiek uitgedaagd.\nDe patiënt staat op het lage einde van de box en beweegt het andere been gestrekt\nnaar beneden en naar voren. De instructie is: “buig je knie zover als je kunt zonder\ndat je enige pijn ervaart.” De test stopt op het exacte punt waar de pijnscore\nverschuift van NPRS 0 naar NPRS groter dan 0. De hoek die op dat moment is\nbereikt, is de Maximale Pijnvrije Flexiehoek (MPFH).\n\nVoor een betrouwbare meting wordt gebruik gemaakt van fotografische goniometrie,\nbijvoorbeeld de Dr. Goniometer-app. Er wordt een foto gemaakt van het sagittale vlak\nop het maximale pijnvrije punt, met als landmarks de malleolus lateralis, het midden\n\nvan de knieholte en de trochanter major. De test heeft een bijna perfecte\nbetrouwbaarheid (ICC tussen 0.83 en 0.85). In onderzoek scoorden PFP-patiënten\nmet langdurige klachten gemiddeld een MPFH van ongeveer 39 tot 45 graden. Het\nadvies voor de praktijk: voer de test twee keer uit en neem het gemiddelde als\nuitkomstmaat (Herrington, 2014). De MPFH is je nulmeting. Het doel van de\nbehandeling is om deze hoek gedurende de revalidatie pijnvrij te vergroten, wat een\ndirecte vertaling is naar verbeterde functie bij dagelijkse activiteiten zoals traplopen.\nBij Sanne meet je een MPFH van 42 graden – precies in de range die je verwacht bij\nlangdurige PFP.\n\nLiteratuur:\n(Ophey et al., 2019)\n\nOphey, M. J., Bosch, K., Khalfallah, F. Z., Wijnands, A., van den Berg, R. B.,\nBernards, N. T. M., Kerkhoffs, G., & Tak, I. J. R. (2019). The decline step-down test\nmeasuring the maximum pain-free flexion angle: A reliable and valid performance test\nin patients with patellofemoral pain. Phys Ther Sport, 36, 43-50.\nhttps://doi.org/10.1016/j.ptsp.2018.12.007\n\nLes 2.3: Lower Limb Range of Motion - de kinetische keten\nDe DSDT heeft je laten zien dát de knie beperkt belastbaar is. Maar waarom? Is het\npuur een lokaal knieprobleem, of speelt er iets verderop in de keten? De Lower\nLimb Range of Motion (LLROM) test is een methode om de flexibiliteit van de weke\ndelen over meerdere gewrichten tegelijkertijd te beoordelen. Waar traditionele tests\nvaak spieren in isolatie meten, waardeert de LLROM de anatomische onderlinge\nverbondenheid van structuren binnen de kinetische keten, aansluitend bij concepten\nzoals de Anatomy Trains.\n\nDe test is een afgeleide van de HERAD-test bij liesklachten van Rob Langhout et al.\nen gebruikt twee testbewegingen. De eerste is maximale knieflexie: deze evalueert\nde voorzijde, waaronder de quadriceps en de iliopsoas. De test wordt uitgevoerd met\nde heup in maximale extensie en de romp in extensie en rotatie om de hele keten op\nspanning te zetten (tension arch). De tweede is maximale heupadductie: deze\nevalueert de laterale keten, waaronder de tractus iliotibialis, de gluteale en\nabdominale spieren en de quadratus lumborum. De scores van beide testen kunnen\nworden opgeteld tot een Total ROM.\n\nOp basis van onderzoek bij gezonde proefpersonen en PFP-patiënten zijn de\nvolgende referentiewaarden voor gezonde jongvolwassenen vastgesteld: knieflexie\n≥126 graden, heupadductie ≥32 graden, en Total ROM ≥158 graden.\nSymptomatische benen van PFP-patiënten scoren gemiddeld significant lager op de\nLLROM dan gezonde controles. Er is een bewezen verband tussen een lagere\n\nLLROM en een verminderde pijnvrije functie tijdens het traplopen. Cruciaal: tijdens\nde test moet je als therapeut registreren wáár de patiënt spanning of pijn voelt –\nvoorzijde dijbeen, zijkant heup of de onderrug. Aan de hand van het stroomdiagram\nin figuur 2 kan de patellofemorale pijn worden onderverdeeld in een subgroep. De\nlokalisatie van de spanning of pijn is bepalend voor de gerichte behandeling in fase 1\nvan de revalidatie.\n\nDe LLROM-test kijkt verder dan de knie alleen. Een beperking in de heup- of\nrompregio kan de mechanische druk op het patellofemorale gewricht verhogen. Door\ndeze beperkingen in kaart te brengen kun je de behandeling specifiek richten op de\narea of tension om de homeostase te herstellen. Bij Sanne meet je een knieflexie\nvan 96 graden en een heupadductie van 28 graden – beide onder de norm. Ze valt in\nsubgroep 1 (anterieure keten). Dat geeft je een concreet aangrijpingspunt voor de\nbehandeling in module 3.\n\nFiguur 1 Stroomdiagram LLROM\nLiteratuur:\n(Ophey et al., 2023)\n(Tak et al., 2017)\n\nOphey, M. J., Bennink, D., Bernsen, J. E., Blazevic, I., van Bergen, R., van den Berg,\nR., Kerkhoffs, G., & Tak, I. J. R. (2023). Patients with patellofemoral pain have lower\nsoft tissue flexibility of the kinetic chain compared to healthy controls: A case-control\nstudy. J Bodyw Mov Ther, 36, 203-209. https://doi.org/10.1016/j.jbmt.2023.06.006\n\nTak, I. J., Langhout, R. F., Groters, S., Weir, A., Stubbe, J. H., & Kerkhoffs, G. M.\n(2017). A new clinical test for measurement of lower limb specific range of motion in\n\nfootball players: Design, reliability and reference findings in non-injured players and\nthose with long-standing adductor-related groin pain. Phys Ther Sport, 23, 67-74.\nhttps://doi.org/10.1016/j.ptsp.2016.07.007\n\nToetsvragen Module 2",
  "3": "Module 3: Behandeling en educatie\nFocus\n\nEducatie als fundament: het reframen van pijn vanuit het homeostasemodel\n\nFase 1: het verminderen van mechanische compressie via LLROM-gerichte\ninterventies\n\nBelastingsmanagement: de 24-uursregel, VAS-grenzen en het level of\nirritability\n\nFase 2 en 3: kracht, coördinatie en sporthervatting met intermitterend trainen\nals sleutelprincipe\n\nHet herkennen en managen van een afwijkend beloop aan de hand van de\nrichtlijn\n\nLeerdoelen\nNa deze module kan de cursist:\n\nEen educatieve boodschap formuleren die aansluit bij het concept \"niets stuk,\nwel van slag\"\n\nOp basis van de LLROM-subgroep een gerichte interventie selecteren voor\nfase 1\n\nDe 24-uursregel en het level of irritability toepassen om de oefentherapie bij te\nstellen aan de hand van de FITT-principes\n\nDe rationale voor intermitterend trainen uitleggen vanuit het vasculaire model\nen dit toepassen in fase 2 en 3\n\nDe vier beslismomenten uit de multidisciplinaire richtlijn benoemen en\ntoepassen bij een afwijkend beloop\n\nPrognostisch ongunstige factoren herkennen en hun invloed op het\nbehandelbeleid beschrijven\nLes 3.1: fase 1 – Educatie & LLROM\nHet moment is aangebroken: je gaat behandelen. De diagnose staat, de metingen\nzijn gedaan. Maar waar begin je? In de eerste fase van de revalidatie bij PFP (week\n1 tot en met 6) staan het begrijpen van de klacht en het wegnemen van\nmechanische belemmeringen centraal.\n\nHet hoofddoel van de educatie is het wegnemen van angst voor bewegen en het\ndestigmatiseren van de klacht. Leg de patiënt uit dat patellofemorale pijn geen\nkwestie is van structurele schade of slijtage, maar een verstoring van de biologische\nhomeostase. De knie is gezond, maar “van slag” door relatieve overbelasting. Als\nklachten langer aanwezig zijn kan er sprake zijn van perifere en/of centrale\nsensitisatie; vertel de patiënt dat de knie gevoeliger is geworden door lokale\nweefselprocessen en centrale zenuwstelselprocessen. Vermeld dat herstel tijd kost:\n\ner zijn gemiddeld 6 tot 12 weken van consistente oefentherapie nodig voordat\nklinisch relevante verbeteringen optreden.\n\nOp basis van de LLROM-test uit module 2 wordt de behandeling gericht op het\nverminderen van de mechanische druk (compressie) op het gewricht. Spanning in\nde kinetische keten kan de bloedafvoer uit de knieschijf hinderen, waardoor diffuse\npijn kan ontstaan. Op basis van de LLROM-test kan de patiënt in een subgroep\nworden onderverdeeld (figuur 3). Subgroep 1 (quadriceps en iliopsoas): focus op\nmobilisatie van de heup en behandeling van de voorzijde van het bovenbeen met\nmyofasciale technieken of oefentherapie. Subgroep 2 (patellofemoraal gewricht):\ngebruik van mediale en caudale glides om de patella te mobiliseren. Subgroep 3\n(tractus iliotibialis): rekken en massage van de laterale keten, inclusief bilspieren.\nDaarnaast kunnen remote effects een rol spelen: behandeling van omliggende\ngebieden zoals de lage rug is geïndiceerd als de LLROM-test daar beperkingen\naangeeft.\n\nBij Sanne voer je een proefbehandeling uit. Uit het onderzoek blijkt dat haar\nknieflexie 30 graden onder de norm ligt (96 graden ten opzichte van de\nnormaalwaarde van 126 graden), waarbij zij in de eindstand haar herkenbare kniepijn\naangeeft. Zij valt daarmee binnen subgroep 1 (zie figuur 2). Een aantal diepe\nstrijkingen door de weefsels van het bovenbeen resulteren direct in een toegenomen\nmobiliteit en afname van pijn bij de hertest. Dit geeft de indicatie om het\nbehandeltraject te starten met oefentherapie waarbij pijnvrij wordt gewerkt aan\nanterieure keten lenigheid.\n\nFiguur 2 Stroomdiagram LLROM\n\nLiteratuur:\n(Ophey et al., 2021)\n\nOphey, M. J., Crooijmans, G., Frieling, S. M. W., Kardos, D. M. A., van den Berg, R.,\nKerkhoffs, G., & Tak, I. J. R. (2021). Short-term effectiveness of an intervention\ntargeting lower limb range of motion on pain and disability in patellofemoral pain\npatients: A randomized, non-concurrent multiple-baseline study. J Bodyw Mov Ther,\n26, 300-308. https://doi.org/10.1016/j.jbmt.2020.12.028\n\nLes 3.2 : belastingmanagement\nSuccesvolle revalidatie valt of staat met het trainen binnen de grenzen van de\nhomeostase. Waar vaak nog de gedachte heerst “je kunt niks stuk maken, dus je\nmag door de pijn heen trainen”, lijkt dit een negatieve invloed te hebben op de\ncentrale pijnprocessen. Het is daarom essentieel om samen met de patiënt grenzen\nte bepalen en vast te leggen.\n\nDe belangrijkste graadmeter is de 24-uursregel: de gebruikelijke kniepijn mag niet\ntoenemen direct na een trainingssessie of de volgende ochtend. Een toename wijst\nerop dat de belasting te groot was voor de huidige biologische belastbaarheid van\nhet weefsel. Oefenen mag wél gepaard gaan met enige pijn, mits gecontroleerd: een\nVAS van 0 tot 2 is veilige belasting, VAS 2 tot 5 is acceptabel mits de 24-uursregel\nwordt gerespecteerd, en een VAS boven de 5 geeft een hoog risico op het verstoren\nvan de homeostase.\n\nDaarnaast is het level of irritability een belangrijk concept. Bij een hoog geïrriteerde\nknie (VAS boven 7) wek je géén pijn op tijdens of na de behandeling. Bij matige\nirritatie (VAS 4 tot 6) is lichte pijn toegestaan, mits de napijn binnen 2 tot 3 uur\nverdwijnt. Bij lage irritatie (VAS 1 tot 3) is lichte pijn toegestaan met een maximale\nnapijn van 4 tot 6 uur. Dit betekent dat de oefentherapie continu bijgesteld moet\nworden op basis van de mate van irritatie en de ervaren pijn, aan de hand van de\nFITT-principes (Frequentie, Intensiteit, Tijd, Type).\n\nLiteratuur:\n(Ophey et al., 2025)\n\nOphey, M., Koeter, S., van Ooijen, L., van Ark, M., Boots, F., Ilbrink, S., Lankhorst, N.\nA., Piscaer, T., Vestering, M., den Ouden Vierwind, M., van Linschoten, R., & van\nBerkel, S. (2025). Dutch multidisciplinary guideline on anterior knee pain:\nPatellofemoral pain and patellar tendinopathy. Knee Surg Sports Traumatol Arthrosc,\n33(2), 457-469. https://doi.org/10.1002/ksa.12367\n\nLes 3.3 : Fase 2 & 3 controle en kracht\nZodra de pijnvrije functie (gemeten met de MPFH) toeneemt en de rustpijn afneemt,\nverschuift de focus naar kracht en coördinatie. Een cruciaal inzicht uit onderzoek\nnaar patellabot-doorbloeding is dat quadriceps-oefeningen intermitterend moeten\nworden uitgevoerd, met minimaal twee seconden rust tussen elke herhaling.\nContinue spanning blokkeert de bloedstroom in het bot (veneuze occlusie); de\nrustpauze laat het bloed wegstromen en voorkomt de diffuse stuwingspijn.\n\nIn fase 2 ligt de focus op bewegen in het dagelijks leven. Leer de patiënt de\nquadriceps bewust aan- en ontspannen – door een lange periode van pijn kan er\nsprake zijn van een continue contractie die de patella comprimeert. Neem in de\ntraining heup-abductoren en exorotatoren mee om de stabiliteit in de keten te\nversterken. Denk aan planken (front 60 seconden, side 30 seconden), single leg\nglute bridges en gecontroleerde mini step-ups.\n\nPas wanneer ADL-taken pijnvrij zijn en de MPFH aanzienlijk is vergroot, start fase\n3: de sportspecifieke fase. Voeg plyometrie en explosieve krachtoefeningen toe,\npassend bij de sport van de patiënt. Train complexe bewegingspatronen onder\nvermoeidheid, terwijl de pijncriteria uit het belastingsmanagement streng worden\nbewaakt. Een effectieve behandeling van PFP is een optelsom van educatie, het\nherstellen van de mobiliteit in de hele keten en het opbouwen van kracht binnen de\nbiologische grenzen van de homeostase, waarbij intermitterend trainen de sleutel is\ntot pijnvrije progressie.\n\nLes 3.4 Workflow en afwijkend beloop.\nNiet elke patiënt herstelt zoals je verwacht. De multidisciplinaire richtlijn hanteert\nstrikte tijdlijnen voor de evaluatie. De revalidatie start altijd met oefentherapie als\nprimaire strategie. Na 6 weken vindt de eerste kritische evaluatie plaats, en na 12\nweken wordt formeel bepaald of het beloop als “afwijkend” moet worden beschouwd.\nOm te bepalen of een patiënt goed herstelt, gebruikt de richtlijn objectieve\nafkappunten: een verbetering van minimaal 10 punten op de AKPS, en monitoring\nvan de VAS-progressie. Als deze verbetering na 6 tot 12 weken uitblijft ondanks\nstructurele oefentrouw, spreken we van een afwijkend beloop.\n\nDe richtlijn definieert vier beslismomenten (Figuur 4). Na 6 weken (moment 1)\nkunnen aanvullende conservatieve behandelingen worden overwogen, zoals tapes,\nbraces of inlegzooltjes, altijd náást de voortgezette oefentherapie. Na 12 weken\n(moment 2) is de belangrijkste stap het heroverwegen van de diagnose PFP – zijn er\npathologieën over het hoofd gezien? Pas als de diagnose onduidelijk blijft na 12\nweken (moment 3) wordt beeldvorming overwogen. De richtlijn adviseert\nterughoudendheid met vroege beeldvorming vanwege de beperkte correlatie tussen\n\nMRI-bevindingen en pijn. Na 6 maanden (moment 4) is chirurgie uitsluitend een optie\nvoor non-responders met een duidelijke anatomische afwijking op scans.\n\nDe therapeut moet extra alert zijn op een afwijkend beloop bij patiënten met bekende\nongunstige prognostische factoren: een lange klachtenduur (meer dan 3 tot 4\nmaanden) voor de start van de behandeling, hoge pijnscores bij aanvang (VAS\nboven 6), bilaterale klachten, pijn bij zitten die al optreedt bij kleine buigingshoeken of\ndie zeer snel opzet (binnen 10 minuten), en multi-site pain – pijn of blessures op\nmeerdere plekken in het lichaam. De workflow van de richtlijn beschermt tegen\noverbehandeling én onderbehandeling: gebruik de 6- en 12-weken afkappunten om\nobjectief te beslissen wanneer je een extra hulpmiddel inzet of wanneer je de\ndiagnose fundamenteel moet herzien.\n\nFiguur 3 Evidence-based klinische benaderingen voor PFP en PT. Optimale behandeling en tijdspaden met\noefentherapie als hoeksteen gedurende respectievelijk de eerste 6 en 12 weken voor PFP en PT.\n\nLiteratuur:\n(Ophey et al., 2025)\n\nOphey, M., Koeter, S., van Ooijen, L., van Ark, M., Boots, F., Ilbrink, S., Lankhorst, N.\nA., Piscaer, T., Vestering, M., den Ouden Vierwind, M., van Linschoten, R., & van\nBerkel, S. (2025). Dutch multidisciplinary guideline on anterior knee pain:\n\nPatellofemoral pain and patellar tendinopathy. Knee Surg Sports Traumatol Arthrosc,\n33(2), 457-469. https://doi.org/10.1002/ksa.12367\n\nToetsvragen Module 3",
  "4": "Module 4: Samenvatting & klinische kernpunten\nFocus\n• Het integreren van het moderne verklaringsmodel van patellofemorale pijn (PFP)\n• Het samenvatten van de diagnostische workflow en objectieve metingen\n• Het vertalen van de belangrijkste behandelprincipes naar de dagelijkse praktijk\n• Het herkennen van klinische valkuilen en rode vlaggen voor een afwijkend beloop\n• Het formuleren van een evidence-based kernboodschap voor patiënten\n\nLeerdoelen\nNa deze module kan de cursist:\n• De belangrijkste paradigmaverschuivingen binnen PFP samenvatten\n• De diagnostische workflow van exclusiediagnose tot DSDT en LLROM beschrijven\n• De kernprincipes van belastingsmanagement en intermitterend trainen uitleggen\n• De belangrijkste klinische valkuilen bij PFP benoemen en vermijden\n• Een patiënt in eenvoudige taal uitleggen waarom PFP meestal betekent: “niets stuk,\nwel van slag”\n\nLes 4.1: Wat moet je onthouden?\nJe hebt inmiddels de volledige reis doorlopen: van verouderde verklaringsmodellen\nnaar een modern biologisch denkkader, van diagnostiek naar behandeling, en van\ntheorie naar praktijk. Maar stel: morgen staat er een patiënt met diffuse anterieure\nkniepijn op je spreekuur. Welke kennis móét direct paraat zijn?\n\nLaten we beginnen bij misschien wel de grootste paradigmaverschuiving: PFP is\nmeestal geen structureel probleem. De klassieke verklaringen – “kraakbeenslijtage”\n(chondromalacia) en een “verkeerd sporende patella” – verklaren de pijn\nonvoldoende. Structurele afwijkingen op MRI correleren slecht met klachten, en de\nmeeste patiënten hebben een biomechanisch ogenschijnlijk normale knie.\n\nDe moderne visie beschouwt PFP als een verstoring van de biologische homeostase:\neen knie die tijdelijk onvoldoende herstelt van belasting. Niet “stuk”, maar “van slag”.\nBinnen het Envelope of Function-model betekent dit dat de belastbaarheid tijdelijk\nkleiner is geworden: activiteiten die voorheen pijnvrij waren, veroorzaken nu ineens\nklachten.\n\nDe tweede kernboodschap is diagnostisch: PFP is een exclusiediagnose. De vraag is\nniet alleen: “past dit bij PFP?”, maar ook: “wat moet ik eerst uitsluiten?” Denk aan\npatellatendinopathie, instabiliteit, meniscusproblematiek, traumatisch letsel of\ngroeigerelateerde aandoeningen bij jongeren. Pas wanneer het typische patroon\n\naanwezig is – diffuse retro- of peripatellaire pijn bij belaste flexie – én andere\noorzaken zijn uitgesloten, spreek je van PFP.\n\nDaarna volgt objectiveren. De DSDT vertelt je hoe belastbaar de knie op dit moment\nis via de maximale pijnvrije flexiehoek (MPFH). De LLROM-test helpt verklaren\nwaarom de knie overbelast raakt door beperkingen elders in de kinetische keten\nzichtbaar te maken. Samen vormen ze je kompas tijdens de behandeling.\n\nEn tenslotte de behandeling: niet harder trainen, maar slimmer trainen. Educatie,\ngerichte interventies op de kinetische keten, belastingmanagement volgens de 24-\nuursregel en intermitterende krachttraining vormen de basis. Niet door pijn heen\n“beuken”, maar progressief opbouwen binnen de grenzen van de homeostase.\n\nBij Sanne zie je precies waarom dit werkt: de MRI was normaal, maar haar\nbelastbaarheid verlaagd. Door educatie, LLROM-gerichte interventies en\ngecontroleerde progressie werd haar knie niet “gerepareerd” — haar belastbaarheid\nwerd hersteld.\n\nLes 4.2: De 10 klinische take-home messages\nWanneer je straks één slide mee naar huis zou nemen, laat het dan deze zijn:\n1. PFP is meestal geen structurele schade\nEen normale MRI sluit klachten niet uit — en afwijkingen op MRI verklaren klachten\nvaak niet.\n2. Exit chondromalacia en sporingsdenken\nGeïsoleerde VMO-training of verklaringen als “je knieschijf zit scheef” zijn meestal\nonvoldoende onderbouwd.\n3. Denk homeostase, niet schade\nPijn betekent vaak dat de belastbaarheid tijdelijk is overschreden, niet dat de knie\nbeschadigd raakt.\n4. PFP is een exclusiediagnose\nSluit eerst andere oorzaken van anterieure kniepijn systematisch uit.\n5. Gebruik objectieve uitkomstmaten\nMeet DSDT (MPFH) en LLROM om belastbaarheid en voortgang zichtbaar te maken.\n6. Behandel de kinetische keten\nEen beperking in heup, quadriceps of laterale keten kan de kniebelasting\nbeïnvloeden.\n7. Educatie is behandeling\nEen patiënt die begrijpt waarom bewegen veilig is, beweegt beter en minder angstig.\n8. Respecteer de 24-uursregel\nToename van klachten na belasting betekent: dosering aanpassen.\n9. Train intermitterend\n\nLaat minimaal twee seconden ontspanning tussen quadricepscontracties om\nstuwingspijn te beperken.\n10. Heroverweeg tijdig je diagnose\nGeen klinisch relevante vooruitgang na 12 weken? Denk opnieuw na over je\nwerkhypothese.\n\nLes 4.3: Hoe leg je dit uit aan een patiënt?\nEen goede fysiotherapeut begrijpt PFP, een uitstekende fysiotherapeut kan het ook\nbegrijpelijk uitleggen.\n\nEen mogelijke educatieve boodschap:\n“Je knie is niet versleten en er is niets kapot. Wat we zien bij patellofemorale pijn is\ndat de knie tijdelijk gevoeliger en minder belastbaar is geworden. Je knie is eigenlijk\neen beetje ‘van slag’ geraakt door een disbalans tussen belasting en herstel. Het\ngoede nieuws is: dit is trainbaar. We gaan stap voor stap zorgen dat je knie weer\nmeer aankan, zonder haar te overbelasten.”\n\nEen patiënt die dit begrijpt, begrijpt ook waarom rust alléén niet werkt en waarom\ngedoseerde belasting juist onderdeel van herstel is.\n\nToetsvragen Module 4"
};

const questions = [
  {
    "module": 1,
    "prompt": "Waarom is het klinisch onjuist om patellofemorale pijn bij adolescenten te bestempelen als een onschuldige groeipijn die vanzelf overgaat?",
    "explanation": "Langetermijnonderzoek laat zien dat PFP bij een aanzienlijk deel van de patiënten persisteert. A is onjuist: chirurgie is slechts voor een selecte groep met anatomische afwijkingen. C is onjuist: ongeveer een derde van de PFP-patiënten sport niet. D is onjuist: het verband tussen PFP en artrose is niet zo eenduidig.",
    "options": [
      {
        "label": "Omdat de meeste patiënten uiteindelijk een operatieve ingreep moeten ondergaan vanwege progressieve kraakbeenschade.",
        "isCorrect": false
      },
      {
        "label": "Omdat onderzoek aantoont dat tot wel 40% van de patiënten na 6 jaar nog steeds aanhoudende kniesymptomen rapporteert en de klacht dus niet self-limiting is.",
        "isCorrect": true
      },
      {
        "label": "Omdat de pijn uitsluitend voorkomt bij jongeren die intensief aan topsport doen en bij hen altijd chronisch wordt.",
        "isCorrect": false
      },
      {
        "label": "Omdat adolescenten met PFP een verhoogd risico hebben op het ontwikkelen van patellofemorale artrose binnen vijf jaar.",
        "isCorrect": false
      }
    ]
  },
  {
    "module": 1,
    "prompt": "Wat is de belangrijkste reden waarom de term “chondromalacia patellae” niet langer als synoniem voor PFP wordt gebruikt?",
    "explanation": "Uit onderzoek blijkt dat structurele kraakbeenafwijkingen niet discrimineren tussen patiënten en gezonde controles. B is onvolledig: hoewel kraakbeen inderdaad geen zenuwen bevat, is dit niet de hoofdreden. C is onjuist: de term werd historisch juist bij jongeren gebruikt. D is onjuist: kraakbeendefecten zijn vaak blijvend.",
    "options": [
      {
        "label": "Kraakbeendefecten op MRI komen bij gezonde controles bijna even vaak voor (21%) als bij PFP-patiënten (23%), waardoor structurele afwijkingen de pijn niet voorspellen.",
        "isCorrect": true
      },
      {
        "label": "Kraakbeen is het enige weefsel in de knie dat geen innervatie heeft en dus per definitie geen pijn kan veroorzaken.",
        "isCorrect": false
      },
      {
        "label": "De term chondromalacia is uitsluitend van toepassing op patiënten ouder dan 50 jaar met degeneratieve veranderingen.",
        "isCorrect": false
      },
      {
        "label": "Kraakbeendefecten herstellen zich bij PFP-patiënten meestal volledig binnen enkele weken rust en fysiotherapie.",
        "isCorrect": false
      }
    ]
  },
  {
    "module": 1,
    "prompt": "Waarom is de focus op geïsoleerde VMO-training bij PFP-patiënten in de moderne fysiotherapie minder dominant geworden?",
    "explanation": "Meta-analyses tonen aan dat atrofie gegeneraliseerd is en dat verbetering door oefentherapie waarschijnlijk komt door geleidelijke belasting, niet door het corrigeren van sporing. B is onjuist: de quadricepsmassa is juist afgenomen. C is onjuist: sporing wordt door meerdere factoren beïnvloed. D is onjuist: de reden is wetenschappelijk, niet financieel.",
    "options": [
      {
        "label": "Quadriceps-atrofie bij PFP-patiënten is meestal gegeneraliseerd en niet beperkt tot de VMO, en het bewijs voor een causaal verband tussen VMO-disfunctie en pijn is zwak.",
        "isCorrect": true
      },
      {
        "label": "De VMO is bij de meeste PFP-patiënten juist overontwikkeld ten opzichte van de vastus lateralis.",
        "isCorrect": false
      },
      {
        "label": "De sporing van de patella wordt uitsluitend bepaald door de botvorm van de trochlea en is niet beïnvloedbaar door spiertraining.",
        "isCorrect": false
      },
      {
        "label": "Geïsoleerde VMO-training is effectiever dan algemene quadricepstraining, maar wordt niet meer vergoed door verzekeraars.",
        "isCorrect": false
      }
    ]
  },
  {
    "module": 1,
    "prompt": "Wat gebeurt er volgens het Envelope of Function-model nadat een knie door overbelasting “van slag” is geraakt?",
    "explanation": "De post-injury envelope is kleiner dan de oorspronkelijke, waardoor eerder pijnvrije activiteiten nu pijn veroorzaken. B is het tegenovergestelde. C is onjuist: PFP ontstaat juist in de zone vóór structurele schade. D is onjuist: herstel van de homeostase kost weken tot maanden.",
    "options": [
      {
        "label": "De envelop wordt tijdelijk kleiner, waardoor activiteiten die voorheen pijnvrij waren nu sneller buiten de veilige zone vallen.",
        "isCorrect": true
      },
      {
        "label": "De envelop wordt groter als compensatiemechanisme om toekomstige belasting beter op te kunnen vangen.",
        "isCorrect": false
      },
      {
        "label": "De envelop verdwijnt volledig totdat er structurele schade zichtbaar is op beeldvorming.",
        "isCorrect": false
      },
      {
        "label": "De envelop herstelt zich binnen 48 uur automatisch als de patiënt de knie volledig ontziet.",
        "isCorrect": false
      }
    ]
  },
  {
    "module": 1,
    "prompt": "Welk mechanisme verklaart waarschijnlijk de pijn die PFP-patiënten ervaren bij langdurig zitten of belasting?",
    "explanation": "Onderzoek toont aan dat verhoogde intra-ossale druk direct ernstige pijn veroorzaakt. B is onjuist: wrijving past in het verouderde mechanische model. C is onjuist: PFP gaat niet gepaard met structurele botafbraak. D is onjuist: er is geen bewijs voor synoviatekort als primaire oorzaak. Community opdracht – Casusreflectie Module 1 Lees onderstaande casus en beantwoord de reflectievragen. Deel je antwoorden in de community. Casus: Je ziet een 28-jarige recreatieve hardloopster met drie maanden toenemende pijn rondom haar rechter knieschijf. Een eerdere behandelaar vertelde haar dat ze “last heeft van kraakbeenslijtage” en adviseerde te stoppen met hardlopen. Ze durft nauwelijks meer te bewegen. De MRI toont geen structurele afwijkingen. 1. Welk verouderd verklaringsmodel hanteerde de eerdere behandelaar? Hoe zou jij dit reframen vanuit het homeostasemodel? 2. Beschrijf aan de hand van het Envelope of Function-model wat er waarschijnlijk aan de hand is. 3. Formuleer een concrete educatieve boodschap die aansluit bij “niets stuk, wel van slag”.",
    "options": [
      {
        "label": "Veneuze stuwing en verhoogde intra-ossale druk in de patella, waardoor drukgevoelige zenuwen in het bot worden geprikkeld.",
        "isCorrect": true
      },
      {
        "label": "Directe wrijving tussen de patella en het femur door onvoldoende gewrichtsvloeistof.",
        "isCorrect": false
      },
      {
        "label": "Progressieve afbraak van het subchondrale bot door herhaalde microtraumata bij flexiebelasting.",
        "isCorrect": false
      },
      {
        "label": "Een tekort aan gewrichtsvloeistof (synovia) door verminderde activiteit van de synoviale membraan.",
        "isCorrect": false
      }
    ]
  },
  {
    "module": 2,
    "prompt": "Wat is het belangrijkste klinische onderscheid tussen Patellofemorale Pijn (PFP) en Patella Tendinopathie (PT) ?",
    "explanation": "Het locatiepatroon is het belangrijkste onderscheidende kenmerk. B is onjuist: PFP is juist zeer prevalent bij jongeren. C is onjuist: PFP ontstaat meestal geleidelijk. D is onjuist: beide aandoeningen reageren op oefentherapie.",
    "options": [
      {
        "label": "PT wordt gekenmerkt door zeer lokale pijn aan de onderpool van de patella, terwijl PFP vaker diffuse pijn rondom of achter de knieschijf geeft.",
        "isCorrect": true
      },
      {
        "label": "PFP komt alleen voor bij mensen ouder dan 40 jaar, terwijl PT vooral bij jongeren optreedt.",
        "isCorrect": false
      },
      {
        "label": "PFP is altijd het gevolg van een direct trauma, terwijl PT geleidelijk ontstaat.",
        "isCorrect": false
      },
      {
        "label": "PT reageert niet op oefentherapie, terwijl PFP uitsluitend met oefentherapie te behandelen is.",
        "isCorrect": false
      }
    ]
  },
  {
    "module": 2,
    "prompt": "Waarom wordt de DSDT uitgevoerd op een hellend vlak van 20 graden?",
    "explanation": "De decline-positie elimineert de enkel als confounding factor, zodat de knieflexie puur wordt gemeten. B is onjuist: de test isoleert de kniefunctie. C is onjuist: balansondersteuning is toegestaan. D is onjuist: dat is niet de rationale.",
    "options": [
      {
        "label": "Om te voorkomen dat een beperkte enkelmobiliteit (dorsaalflexie) de testresultaten beïnvloedt, zodat de knie maximaal en specifiek wordt uitgedaagd.",
        "isCorrect": true
      },
      {
        "label": "Om de kracht van de hamstrings extra te testen, aangezien deze bij PFP vaak verzwakt zijn.",
        "isCorrect": false
      },
      {
        "label": "Om de stabiliteit van de knie te beoordelen, wat een belangrijke component is van de DSDT.",
        "isCorrect": false
      },
      {
        "label": "Om de patiënt meer proprioceptieve feedback te geven tijdens het uitvoeren van de testbeweging.",
        "isCorrect": false
      }
    ]
  },
  {
    "module": 2,
    "prompt": "Welke waarde bij de LLROM heupadductie-test wordt beschouwd als de normaalwaarde voor gezonde jongvolwassenen?",
    "explanation": "De normaalwaarde voor heupadductie bij gezonde jongvolwassenen is ≥32 graden (Langhout et al.). A en B liggen onder de norm en worden geassocieerd met beperkingen. D is te ruim voor de testbeweging.",
    "options": [
      {
        "label": "Minimaal 20 graden, wat al wijst op een adequate flexibiliteit van de laterale keten.",
        "isCorrect": false
      },
      {
        "label": "Minimaal 25 graden, wat de ondergrens is voor sporters met belasting van de kinetische keten.",
        "isCorrect": false
      },
      {
        "label": "Minimaal 32 graden, gebaseerd op referentiewaarden uit onderzoek bij gezonde proefpersonen.",
        "isCorrect": true
      },
      {
        "label": "Minimaal 45 graden, wat nodig is om de tractus iliotibialis volledig te ontspannen.",
        "isCorrect": false
      }
    ]
  },
  {
    "module": 2,
    "prompt": "Welke uitspraak over de DSDT is juist?",
    "explanation": "De DSDT meet objectief de MPFH met uitstekende betrouwbaarheid. A is onjuist: de test meet pijnvrije functie, niet maximale kracht. B is onjuist: de decline- positie schakelt de enkel juist uit. D is onjuist: de test stopt waar pijn begint.",
    "options": [
      {
        "label": "De DSDT meet de maximale spierkracht van de quadriceps in een gesloten kinetische keten.",
        "isCorrect": false
      },
      {
        "label": "De DSDT wordt uitgevoerd op een vlakke ondergrond om de enkelmobiliteit mee te beoordelen.",
        "isCorrect": false
      },
      {
        "label": "De DSDT meet de maximale pijnvrije knieflexiehoek (MPFH), met een bijna perfecte interbeoordelaarsbetrouwbaarheid (ICC 0.83–0.85).",
        "isCorrect": true
      },
      {
        "label": "De DSDT is alleen betrouwbaar wanneer de patiënt géén enkele pijn ervaart tijdens de volledige testbeweging.",
        "isCorrect": false
      }
    ]
  },
  {
    "module": 2,
    "prompt": "Een patiënt scoort bij de LLROM knieflexietest 98° (norm ≥126°) en ervaart hierbij herkenbare kniepijn. In welke subgroep valt deze patiënt?",
    "explanation": "Beperkte knieflexie met herkenbare pijn in de anterieure keten wijst op subgroep 1. A geldt bij patellofemorale mobiliteitsbeperkingen. B geldt bij de laterale keten. D is onjuist: 98° ligt ruim onder de norm. Community opdracht – Praktijkopdracht Module 2 Voer de DSDT en de LLROM-test uit bij een collega of patiënt. Noteer de uitkomsten en beantwoord: 1. Wat is de MPFH en hoe verhoudt deze zich tot de referentiewaarden (39-45°)? 2. In welke subgroep (1, 2 of 3) deel je de proefpersoon in op basis van de LLROM? 3. Waar voelde de proefpersoon spanning of pijn? Hoe richt je op basis daarvan de behandeling?",
    "options": [
      {
        "label": "Subgroep 2: start met mediale en caudale glides om de patella te mobiliseren.",
        "isCorrect": false
      },
      {
        "label": "Subgroep 3: start met rekken en massage van de laterale keten en gluteale spieren.",
        "isCorrect": false
      },
      {
        "label": "Subgroep 1: start met myofasciale technieken of oefentherapie gericht op de anterieure keten.",
        "isCorrect": true
      },
      {
        "label": "Geen subgroep: een knieflexie van 98° valt nog binnen de normaalwaarden en behoeft geen interventie.",
        "isCorrect": false
      }
    ]
  },
  {
    "module": 3,
    "prompt": "Wat is in Fase 1 het primaire doel van interventies gericht op de LLROM?",
    "explanation": "De LLROM-interventies in fase 1 richten zich op het verminderen van compressie. B is onjuist: krachtopbouw is het doel van fase 2 en 3. C is onjuist: VMO-disfunctie is een verouderd concept. D is onjuist: proprioceptie is niet het primaire doel in fase 1.",
    "options": [
      {
        "label": "Het verminderen van mechanische compressie op het gewricht om de vasculaire doorbloeding en homeostase te herstellen.",
        "isCorrect": true
      },
      {
        "label": "Het vergroten van de maximale spierkracht in de quadriceps om de patella beter te laten sporen.",
        "isCorrect": false
      },
      {
        "label": "Het losmaken van de VMO zodat die weer voldoende sturing aan de patella geeft.",
        "isCorrect": false
      },
      {
        "label": "Het verbeteren van de proprioceptie in het kniegewricht door middel van balansoefeningen.",
        "isCorrect": false
      }
    ]
  },
  {
    "module": 3,
    "prompt": "Wanneer is een oefensessie “veilig” uitgevoerd binnen de grenzen van de weefselhomeostase?",
    "explanation": "De 24-uursregel is de belangrijkste graadmeter. A is onjuist: enige pijn (VAS 2-5) is acceptabel. C is onjuist: spiertrillen is geen indicator voor homeostase- overschrijding. D is onjuist: crepitatie is geen betrouwbare maat.",
    "options": [
      {
        "label": "Als de patiënt tijdens het oefenen een pijnscore van VAS 0 heeft gedurende de hele sessie.",
        "isCorrect": false
      },
      {
        "label": "Als de gebruikelijke kniepijn direct na de sessie of de volgende ochtend niet is toegenomen ten opzichte van het niveau voorafgaand aan de sessie.",
        "isCorrect": true
      },
      {
        "label": "Als de patiënt de oefeningen kan uitvoeren zonder trillen van de spieren of coördinatieproblemen.",
        "isCorrect": false
      },
      {
        "label": "Als de therapeut geen crepitatie hoort of voelt tijdens het uitvoeren van de oefeningen.",
        "isCorrect": false
      }
    ]
  },
  {
    "module": 3,
    "prompt": "Waarom is het essentieel om quadriceps-oefeningen intermitterend (met rust tussen herhalingen) uit te voeren bij PFP?",
    "explanation": "Intermitterend trainen voorkomt veneuze occlusie en stuwingspijn. A is onjuist: hoewel rust ATP-herstel bevordert, is dat niet de specifieke reden bij PFP. B is onjuist: excentrische belasting is niet direct geïndiceerd. D is onjuist: lactaat beschadigt geen kraakbeen.",
    "options": [
      {
        "label": "Om spiervezels meer tijd te geven voor ATP-aanmaak en zo de maximale kracht te verbeteren.",
        "isCorrect": false
      },
      {
        "label": "Omdat dit beter werkt voor het opbouwen van excentrische belasting van de spieren en pezen.",
        "isCorrect": false
      },
      {
        "label": "Om de hemodynamische belasting te verlagen en het bloed de kans te geven uit het patellabot weg te stromen.",
        "isCorrect": true
      },
      {
        "label": "Omdat continue contracties leiden tot overmatige lactaatophoping die het kraakbeen kan beschadigen.",
        "isCorrect": false
      }
    ]
  },
  {
    "module": 3,
    "prompt": "Wanneer adviseert de richtlijn om de diagnose PFP fundamenteel te heroverwegen bij uitblijvend resultaat?",
    "explanation": "Na 12 weken is het formele moment voor diagnostische heroverweging. B is onjuist: na 6 weken worden eerst aanvullende conservatieve middelen overwogen. C is onjuist: een halfjaar is het moment voor verwijzing naar orthopedie. D is onjuist: een jaar wachten is onnodig lang.",
    "options": [
      {
        "label": "Na 12 weken van gestructureerde oefentherapie zonder klinisch relevante verbetering.",
        "isCorrect": true
      },
      {
        "label": "Al na de eerste 6 weken, omdat het onethisch is om langer te wachten met aanvullende diagnostiek.",
        "isCorrect": false
      },
      {
        "label": "Na een halfjaar gestructureerde oefentherapie, het standaard evaluatiemoment voor conservatieve behandeling.",
        "isCorrect": false
      },
      {
        "label": "Pas na een jaar, omdat PFP een langzaam herstellende aandoening is die veel geduld vereist.",
        "isCorrect": false
      }
    ]
  },
  {
    "module": 3,
    "prompt": "Een patiënt traint 8 weken. De MPFH is verbeterd van 42° naar 65°, maar de AKPS-score is slechts 4 punten gestegen. Welke conclusie is het meest passend?",
    "explanation": "Na 6 weken adviseert de richtlijn aanvullende conservatieve middelen bij onvoldoende subjectief resultaat. A is onjuist: de AKPS is een gevalideerde maat. C is onjuist: beeldvorming pas na 12 weken. D is onjuist: intensiever trainen kan de homeostase verstoren. Community opdracht – Behandelplan Module 3 Stel een behandelplan op voor een eigen PFP-patiënt volgens het 3-fasenmodel: 1. Welke educatieve boodschap geef je en hoe sluit deze aan bij het homeostasemodel? 2. Welke LLROM-interventies voer je uit in fase 1 en in welke subgroep valt je patiënt? 3. Beschrijf je belastingsmanagement: welke VAS-grenzen hanteer je en hoe stel je bij? 4. Wanneer zou je de diagnose heroverwegen?",
    "options": [
      {
        "label": "De behandeling is succesvol: de MPFH-verbetering is voldoende en de AKPS is niet relevant.",
        "isCorrect": false
      },
      {
        "label": "Er is sprake van een gemengd resultaat. Overweeg aanvullende interventies (taping, bracing) naast voortgezette oefentherapie, conform het 6-wekenmoment uit de richtlijn.",
        "isCorrect": true
      },
      {
        "label": "Stop direct met de huidige behandeling en verwijs voor beeldvorming.",
        "isCorrect": false
      },
      {
        "label": "Verhoog de trainingsintensiteit aanzienlijk om sneller resultaat te boeken op de AKPS.",
        "isCorrect": false
      }
    ]
  },
  {
    "module": 4,
    "prompt": "Wat is de belangrijkste paradigmaverschuiving binnen de moderne visie op PFP?",
    "explanation": "De moderne visie verschuift van structurele schade naar een biologisch model van weefselhomeostase. A en B passen bij verouderde verklaringsmodellen. D onderschat het vaak persisterende karakter van PFP.",
    "options": [
      {
        "label": "PFP ontstaat uitsluitend door kraakbeenschade die zichtbaar is op MRI.",
        "isCorrect": false
      },
      {
        "label": "PFP wordt vooral veroorzaakt door een verkeerd sporende patella door VMO- zwakte.",
        "isCorrect": false
      },
      {
        "label": "PFP wordt gezien als een verstoring van de biologische homeostase en belastbaarheid van het gewricht.",
        "isCorrect": true
      },
      {
        "label": "PFP wordt beschouwd als een onschuldige groeiklacht die meestal vanzelf verdwijnt.",
        "isCorrect": false
      }
    ]
  },
  {
    "module": 4,
    "prompt": "Waarom zijn DSDT en LLROM belangrijke onderdelen van het behandeltraject?",
    "explanation": "DSDT objectiveert de pijnvrije functie (MPFH) en LLROM helpt beperkingen in de keten zichtbaar maken.",
    "options": [
      {
        "label": "Omdat ze structurele kraakbeenschade objectiveren.",
        "isCorrect": false
      },
      {
        "label": "Omdat ze respectievelijk belastbaarheid en beperkingen in de kinetische keten objectiveren.",
        "isCorrect": true
      },
      {
        "label": "Omdat ze de quadricepskracht direct meten.",
        "isCorrect": false
      },
      {
        "label": "Omdat ze MRI vervangen bij het stellen van de diagnose.",
        "isCorrect": false
      }
    ]
  },
  {
    "module": 4,
    "prompt": "Wat betekent een toename van de gebruikelijke kniepijn de ochtend na training?",
    "explanation": "Volgens de 24-uursregel moet de belasting worden aangepast wanneer klachten toenemen.",
    "options": [
      {
        "label": "Een teken dat de training effectief was.",
        "isCorrect": false
      },
      {
        "label": "Een aanwijzing dat de homeostase waarschijnlijk is overschreden en de belasting moet worden aangepast.",
        "isCorrect": true
      },
      {
        "label": "Een indicatie voor onmiddellijke beeldvorming.",
        "isCorrect": false
      },
      {
        "label": "Een normaal teken van spieradaptatie dat genegeerd moet worden.",
        "isCorrect": false
      }
    ]
  },
  {
    "module": 4,
    "prompt": "Wanneer moet je volgens de richtlijn de diagnose fundamenteel heroverwegen?",
    "explanation": "Na 12 weken zonder relevante vooruitgang wordt diagnostische heroverweging aanbevolen.",
    "options": [
      {
        "label": "Na 2 weken",
        "isCorrect": false
      },
      {
        "label": "Na 6 weken",
        "isCorrect": false
      },
      {
        "label": "Na 12 weken bij uitblijven van klinisch relevante verbetering",
        "isCorrect": true
      },
      {
        "label": "Pas na 1 jaar",
        "isCorrect": false
      }
    ]
  },
  {
    "module": 4,
    "prompt": "Welke boodschap sluit het beste aan bij moderne educatie rondom PFP?",
    "explanation": "Dit sluit aan bij het homeostasemodel en ondersteunt graded exposure. Community opdracht – Jouw klinische samenvatting Kijk terug op een recente patiënt met anterieure kniepijn en beantwoord: - Welke verouderde overtuiging over PFP kwam jij of je patiënt tegen? - Welke objectieve maat (DSDT/LLROM) zou jij voortaan standaard inzetten? - Hoe zou jij in maximaal drie zinnen uitleggen: “niets stuk, wel van slag”?",
    "options": [
      {
        "label": "“Je kraakbeen is beschadigd, maar we kunnen de schade beperken.”",
        "isCorrect": false
      },
      {
        "label": "“Je knieschijf spoort niet goed; we moeten die corrigeren.”",
        "isCorrect": false
      },
      {
        "label": "“Je knie is niet stuk, maar tijdelijk minder belastbaar geworden.”",
        "isCorrect": true
      },
      {
        "label": "“Je moet rust houden tot alle pijn verdwenen is.”",
        "isCorrect": false
      }
    ]
  }
];

const modules = [
  { key: "module-1", title: "Module 1: Een nieuw paradigma", minutes: 290, workForms: ["TEKST", "REFLECTIE", "TOETS"] as const },
  { key: "module-2", title: "Module 2: Diagnostiek", minutes: 300, workForms: ["TEKST", "VIDEO", "REFLECTIE", "TOETS"] as const },
  { key: "module-3", title: "Module 3: Behandeling en educatie", minutes: 50, workForms: ["TEKST", "CASUS", "REFLECTIE", "TOETS"] as const },
  { key: "module-4", title: "Module 4: Samenvatting & klinische kernpunten", minutes: 58, workForms: ["TEKST", "VIDEO", "REFLECTIE", "TOETS"] as const },
];

const moduleObjectives: Record<string, string[]> = {
  "module-1": [
    "De cursist kan PFP duiden vanuit moderne diagnostische criteria en uitleggen waarom structurele MRI-afwijkingen en geïsoleerde VMO-disfunctie de klacht onvoldoende verklaren.",
    "De cursist kan het Envelope of Function-model en vasculaire/intra-ossale pijnmechanismen toepassen in patiëntuitleg en trainingsopbouw.",
  ],
  "module-2": [
    "De cursist kan anterieure kniepijn differentiëren, PFP onderscheiden van patellatendinopathie en DSDT/MPFH correct interpreteren.",
    "De cursist kan LLROM-beperkingen herkennen, subgroepen klinisch duiden en bevindingen vertalen naar behandelkeuzes.",
  ],
  "module-3": [
    "De cursist kan educatie, LLROM-gestuurde interventies, 24-uursregel, irritability en intermitterend trainen inzetten binnen een evidence-based behandelplan.",
  ],
  "module-4": [
    "De cursist kan de volledige PFP-workflow samenvatten, klinische valkuilen herkennen en een heldere evidence-based kernboodschap voor patiënten formuleren.",
  ],
};

const dossierDocuments = [
  ["Volledige reviewversie e-learning", `${ASSET_BASE}/review-complete.pdf`],
  ["Aanleiding en doel", `${ASSET_BASE}/aanleiding-en-doel.pdf`],
  ["Lesopzet en leerdoelen", `${ASSET_BASE}/lesopzet-en-leerdoelen.pdf`],
  ["Urenoverzicht", `${ASSET_BASE}/urenoverzicht.pdf`],
  ["Evaluatieformulier", `${ASSET_BASE}/evaluatieformulier.pdf`],
  ["Zelfstudie-onderdelen format", `${ASSET_BASE}/zelfstudie-onderdelen.docx`],
  ["Onderbouwing zelfstudie/literatuur", `${ASSET_BASE}/zelfstudie-literatuur.xlsx`],
  ["Literatuur: Ophey et al. richtlijn anterior knee pain", `${ASSET_BASE}/ophey-guideline.pdf`],
  ["Literatuur: Dye 2005 tissue homeostasis", `${ASSET_BASE}/dye-2005-homeostasis.pdf`],
] as const;

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function deleteExistingCourse(slug: string) {
  const existing = await prisma.course.findUnique({
    where: { slug },
    include: { versions: { select: { id: true } } },
  });
  if (!existing) return;
  const versionIds = existing.versions.map((version) => version.id);
  await prisma.$transaction([
    prisma.assessmentAnswer.deleteMany({ where: { attempt: { courseVersionId: { in: versionIds } } } }),
    prisma.assessmentAttempt.deleteMany({ where: { courseVersionId: { in: versionIds } } }),
    prisma.questionLearningObjective.deleteMany({ where: { question: { assessment: { courseVersionId: { in: versionIds } } } } }),
    prisma.questionOption.deleteMany({ where: { question: { assessment: { courseVersionId: { in: versionIds } } } } }),
    prisma.question.deleteMany({ where: { assessment: { courseVersionId: { in: versionIds } } } }),
    prisma.assessment.deleteMany({ where: { courseVersionId: { in: versionIds } } }),
    prisma.evaluationAnswer.deleteMany({ where: { submission: { evaluationForm: { courseVersionId: { in: versionIds } } } } }),
    prisma.evaluationSubmission.deleteMany({ where: { evaluationForm: { courseVersionId: { in: versionIds } } } }),
    prisma.evaluationQuestion.deleteMany({ where: { evaluationForm: { courseVersionId: { in: versionIds } } } }),
    prisma.evaluationForm.deleteMany({ where: { courseVersionId: { in: versionIds } } }),
    prisma.lessonProgress.deleteMany({ where: { lesson: { courseVersionId: { in: versionIds } } } }),
    prisma.lesson.deleteMany({ where: { courseVersionId: { in: versionIds } } }),
    prisma.learningObjective.deleteMany({ where: { courseVersionId: { in: versionIds } } }),
    prisma.literatureReference.deleteMany({ where: { courseVersionId: { in: versionIds } } }),
    prisma.competencyReference.deleteMany({ where: { courseVersionId: { in: versionIds } } }),
    prisma.courseModule.deleteMany({ where: { courseVersionId: { in: versionIds } } }),
    prisma.courseChangeLog.deleteMany({ where: { courseId: existing.id } }),
    prisma.courseVersion.deleteMany({ where: { courseId: existing.id } }),
    prisma.enrollment.deleteMany({ where: { courseId: existing.id } }),
    prisma.certificate.deleteMany({ where: { courseId: existing.id } }),
    prisma.course.delete({ where: { id: existing.id } }),
  ]);
}

async function main() {
  const passwordHash = await hashPassword(REVIEWER_PASSWORD);
  const admin =
    (await prisma.user.findFirst({ where: { role: Role.BEHEERDER, isActive: true }, orderBy: { email: "asc" } })) ??
    (await prisma.user.create({
      data: {
        email: "beheer@fy-fit.nl",
        passwordHash,
        name: "Fy-fit Beheer",
        role: Role.BEHEERDER,
        title: "Beheerder",
        location: "Nijmegen",
        bio: "Academy beheeraccount",
        avatarColor: "#1f7a6d",
      },
    }));

  const reviewer = await prisma.user.upsert({
    where: { email: REVIEWER_EMAIL },
    update: {
      passwordHash,
      name: "Accreditatiecommissie reviewer",
      role: Role.REVIEWER,
      title: "Reviewer accreditatiecommissie",
      location: "Extern",
      bio: "Tijdelijk read-only reviewaccount voor e-learning Patellofemorale Pijn.",
      avatarColor: "#256f68",
      isActive: true,
      isOnboarding: false,
    },
    create: {
      email: REVIEWER_EMAIL,
      passwordHash,
      name: "Accreditatiecommissie reviewer",
      role: Role.REVIEWER,
      title: "Reviewer accreditatiecommissie",
      location: "Extern",
      bio: "Tijdelijk read-only reviewaccount voor e-learning Patellofemorale Pijn.",
      avatarColor: "#256f68",
      isActive: true,
      isOnboarding: false,
    },
  });

  await deleteExistingCourse(COURSE_SLUG);

  const course = await prisma.course.create({
    data: {
      title: "E-learning Patellofemorale Pijn",
      slug: COURSE_SLUG,
      description: "Reviewversie voor accreditatie: van structureel denken naar weefselhomeostase bij patellofemorale pijn.",
      audience: "Fysiotherapeuten / accreditatiecommissie",
      visibleToAll: false,
      visibleToRoles: [Role.REVIEWER],
      visibleToAudienceProfiles: [],
      visibleToUserIds: [reviewer.id],
      learningObjectives: "De deelnemer kan PFP modern verklaren vanuit weefselhomeostase, diagnostiek objectiveren met DSDT/LLROM, belastingsmanagement toepassen en behandeling/educatie evidence-based opbouwen.",
      goal: "Fysiotherapeuten helpen om PFP niet meer primair structureel of spoorgericht te benaderen, maar klinisch te redeneren vanuit homeostase, belastbaarheid en richtlijnconforme diagnostiek/behandeling.",
      focus: "PFP, anterior knee pain, DSDT, LLROM, Envelope of Function, weefselhomeostase, belastingsmanagement en patiënteducatie.",
      learnerOutcomes: [
        "Je legt PFP uit als een tijdelijk verstoorde belastbaarheid in plaats van een kapotte knie.",
        "Je gebruikt DSDT en LLROM om diagnostiek en behandeling te objectiveren.",
        "Je doseert oefentherapie met 24-uursregel, irritability en intermitterend trainen.",
        "Je herkent afwijkend beloop en weet wanneer diagnostische heroverweging nodig is.",
      ],
      accreditationRegister: "Kwaliteitshuis Fysiotherapie / KRF NL / SKF",
      accreditationKind: "VAKINHOUDELIJK",
      accreditationActivityId: "AANVRAAG-PFP-2026",
      providerName: "Fy Fit Fysiotherapie Nijmegen",
      providerSignatureName: "Sjoerd Hendriks",
      versionDate: new Date("2026-07-01T08:00:00.000Z"),
      authorExperts: [
        { name: "Sjoerd Hendriks", role: "Sportfysiotherapeut en inhoudsdeskundige", organization: "Fy Fit Fysiotherapie Nijmegen" },
        { name: "Fy-fit Academy", role: "Aanbieder e-learning", organization: "Fy Fit Fysiotherapie Nijmegen" },
      ],
      requiredQuestionCount: 20,
      studyLoadMinutes: 698,
      status: "PUBLISHED",
      isMandatory: false,
      authorId: admin.id,
      reviewerId: reviewer.id,
      publishedAt: new Date("2026-07-01T08:00:00.000Z"),
      revisionDueAt: new Date("2027-07-01T08:00:00.000Z"),
      versions: {
        create: {
          versionNumber: "1.0-review",
          changeSummary: "Eerste volledige reviewversie met 4 modules, literatuur, toetsing, evaluatie en accreditatiedossier.",
          isActive: true,
          createdById: admin.id,
        },
      },
    },
    include: { versions: true },
  });

  const version = course.versions[0];
  const modulesByKey = new Map<string, { id: string }>();
  for (const [index, item] of modules.entries()) {
    const created = await prisma.courseModule.create({
      data: {
        courseVersionId: version.id,
        title: item.title,
        description: index === 0 ? "Nieuw paradigma en homeostasemodel." : index === 1 ? "Diagnostiek, DSDT en LLROM." : index === 2 ? "Behandeling, educatie en belastingsmanagement." : "Samenvatting en klinische kernpunten.",
        introduction: "Onderdeel van de reviewflow voor de accreditatiecommissie.",
        summary: "Module-inhoud is gekoppeld aan leerdoelen, literatuur en toetsvragen.",
        order: index + 1,
        estimatedMinutes: item.minutes,
        workForms: [...item.workForms],
      },
    });
    modulesByKey.set(item.key, created);
  }

  const objectivesByCode = new Map<string, { id: string }>();
  let objectiveOrder = 1;
  for (const item of modules) {
    const courseModule = modulesByKey.get(item.key);
    for (const [idx, text] of moduleObjectives[item.key].entries()) {
      const code = `M${item.key.replace("module-", "")}-LO${idx + 1}`;
      const objective = await prisma.learningObjective.create({
        data: { courseVersionId: version.id, moduleId: courseModule?.id, code, text, order: objectiveOrder++ },
      });
      objectivesByCode.set(code, objective);
    }
  }

  await prisma.literatureReference.createMany({
    data: [
      { courseVersionId: version.id, moduleId: modulesByKey.get("module-1")?.id, title: "The pathophysiology of patellofemoral pain - A tissue homeostasis perspective", source: "Dye, S. F. Clinical Orthopaedics and Related Research", url: `${ASSET_BASE}/dye-2005-homeostasis.pdf`, guideline: "Verplichte literatuur", year: 2005, order: 1 },
      { courseVersionId: version.id, moduleId: modulesByKey.get("module-2")?.id, title: "Dutch multidisciplinary guideline on anterior knee pain: Patellofemoral pain and patellar tendinopathy", source: "Ophey et al. Knee Surgery, Sports Traumatology, Arthroscopy", url: `${ASSET_BASE}/ophey-guideline.pdf`, guideline: "Verplichte literatuur / richtlijn", year: 2025, order: 2 },
    ],
  });

  await prisma.competencyReference.createMany({
    data: modules.map((item, index) => ({
      courseVersionId: version.id,
      moduleId: modulesByKey.get(item.key)?.id,
      name: `Klinisch redeneren PFP module ${index + 1}`,
      framework: "Kwaliteitshuis / vakinhoudelijk fysiotherapeutisch handelen",
      description: "Evidence-based klinisch redeneren, diagnostiek, behandeling en patiënteducatie bij patellofemorale pijn.",
    })),
  });

  await prisma.evaluationForm.create({
    data: {
      courseVersionId: version.id,
      title: "Evaluatieformulier E-learning Patellofemorale Pijn",
      isRequired: true,
      questions: {
        create: [
          { label: "Algehele indruk van de e-learning", type: "SCALE_1_5", order: 1, isRequired: true },
          { label: "Relevantie van het onderwerp voor jouw werk", type: "SCALE_1_5", order: 2, isRequired: true },
          { label: "Gebruiksgemak en toegankelijkheid van de leeromgeving", type: "SCALE_1_5", order: 3, isRequired: true },
          { label: "De leerdoelen waren duidelijk en zijn behaald", type: "SCALE_1_5", order: 4, isRequired: true },
          { label: "De toets sloot aan op de leerdoelen en inhoud", type: "SCALE_1_5", order: 5, isRequired: true },
          { label: "Wat neem je concreet mee naar de praktijk?", type: "TEXT", order: 6, isRequired: false },
          { label: "Welke verbeterpunten zie je voor deze e-learning?", type: "TEXT", order: 7, isRequired: false },
        ],
      },
    },
  });

  const lessons: Array<{ slug: string; moduleKey?: string; title: string; description: string; type: "TEXT" | "VIDEO" | "DOCUMENT" | "REFLECTION" | "ASSESSMENT"; content: string; minutes: number; required: boolean }> = [];
  for (const [index, item] of modules.entries()) {
    const moduleNumber = index + 1;
    const sourcePdf = `${ASSET_BASE}/module-${moduleNumber}.pdf`;
    let content = `${moduleTexts[moduleNumber]}

Bronbestand module ${moduleNumber}: ${sourcePdf}`;
    if (moduleNumber === 2) content += `

Video bij deze module: ${ASSET_BASE}/llrom-dsdt.mp4`;
    if (moduleNumber === 4) content += `

Video bij deze module: ${ASSET_BASE}/klinische-kernpunten-pfp.mp4`;
    lessons.push({
      slug: slugify(item.title),
      moduleKey: item.key,
      title: item.title,
      description: "Stap in de reviewflow: module-inhoud inclusief leerdoelen, opdrachten en bronmateriaal.",
      type: moduleNumber === 2 || moduleNumber === 4 ? "VIDEO" : "TEXT",
      content,
      minutes: item.minutes,
      required: true,
    });
  }
  lessons.push({
    slug: "accreditatiedossier-documenten",
    title: "Accreditatiedossier en ondersteunende documenten",
    description: "Alle ondersteunende documenten, formats, literatuur en downloads voor de accreditatiecommissie.",
    type: "DOCUMENT",
    content: [
      "Deze reviewles bundelt alle accreditatieondersteunende documenten. Open ieder document direct vanuit deze pagina.",
      ...dossierDocuments.map(([label, path]) => `${label}: ${path}`),
    ].join("\n\n"),
    minutes: 0,
    required: true,
  });
  lessons.push({
    slug: "toets-pfp-review",
    title: "Toetsing: vragenbank Patellofemorale Pijn",
    description: "Reviewer-preview van de volledige toetsmatrijs: 20 meerkeuzevragen gekoppeld aan moduleleerdoelen.",
    type: "ASSESSMENT",
    content: "Toetsles voor reviewer-preview. Er worden in previewmodus geen pogingen, scores of certificaten aangemaakt.",
    minutes: 20,
    required: true,
  });

  const createdLessons = [];
  for (const [order, lesson] of lessons.entries()) {
    createdLessons.push(await prisma.lesson.create({
      data: {
        courseVersionId: version.id,
        moduleId: lesson.moduleKey ? modulesByKey.get(lesson.moduleKey)?.id : undefined,
        title: lesson.title,
        slug: lesson.slug,
        description: lesson.description,
        type: lesson.type,
        content: lesson.content,
        order: order + 1,
        isRequired: lesson.required,
        estimatedMinutes: lesson.minutes,
        publishedAt: new Date("2026-07-01T08:00:00.000Z"),
      },
    }));
  }
  const assessmentLesson = createdLessons.find((lesson) => lesson.slug === "toets-pfp-review");
  if (!assessmentLesson) throw new Error("Assessment lesson missing");

  const assessment = await prisma.assessment.create({
    data: {
      courseVersionId: version.id,
      lessonId: assessmentLesson.id,
      title: "Kennistoets Patellofemorale Pijn",
      description: "20 toetsvragen: 5 per module, gekoppeld aan moduleleerdoelen. Cesuur 70%, maximaal 3 pogingen, vragen en antwoordopties worden geschud.",
      passPercentage: 70,
      maxAttempts: 3,
      timeLimitMinutes: 45,
      shuffleQuestions: true,
      shuffleOptions: true,
      showFeedbackImmediately: true,
      isRequiredForCompletion: true,
      questions: {
        create: questions.map((question, index) => ({
          type: "MULTIPLE_CHOICE",
          prompt: question.prompt,
          explanation: question.explanation,
          order: index + 1,
          points: 1,
          options: {
            create: question.options.map((option, optionIndex) => ({
              label: option.label,
              isCorrect: option.isCorrect,
              order: optionIndex + 1,
            })),
          },
        })),
      },
    },
    include: { questions: true },
  });

  for (const [index, seededQuestion] of assessment.questions.entries()) {
    const moduleNumber = questions[index]?.module ?? 1;
    const objectiveCodes = Array.from(objectivesByCode.keys()).filter((code) => code.startsWith(`M${moduleNumber}-`));
    await prisma.questionLearningObjective.createMany({
      data: objectiveCodes.slice(0, 2).map((code) => ({
        questionId: seededQuestion.id,
        learningObjectiveId: objectivesByCode.get(code)!.id,
      })),
    });
  }

  await prisma.courseChangeLog.create({
    data: {
      courseId: course.id,
      courseVersionId: version.id,
      changedById: admin.id,
      changeType: "PUBLISHED",
      summary: "PFP e-learning reviewversie geïmporteerd voor accreditatiecommissie.",
      details: {
        source: "e-learning PFP dropzone",
        modules: 4,
        questions: questions.length,
        dossierDocuments: dossierDocuments.length,
        readOnlyReviewerAccount: REVIEWER_EMAIL,
      },
    },
  });

  console.log(JSON.stringify({
    courseId: course.id,
    slug: course.slug,
    reviewerEmail: REVIEWER_EMAIL,
    reviewerPassword: REVIEWER_PASSWORD,
    lessonCount: lessons.length,
    questionCount: questions.length,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
