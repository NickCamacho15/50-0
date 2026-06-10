// ============================================================
// 50-0 — Fighter Database
// Trait order in F(): [striking, power, wrestling, grappling, cardio, chin, iq]
// Ratings are era-relative (graded vs. same-era peers), 0-100.
// ============================================================

export type TraitKey = 'str' | 'pow' | 'wre' | 'gra' | 'car' | 'chn' | 'iq';

export interface Trait {
  key: TraitKey;
  label: string;
  icon: string;
  weight: number;
  desc: string;
}

export interface Fighter {
  name: string;
  nick: string;
  blurb: string;
  traits: Record<TraitKey, number>;
}

export interface Combo {
  division: string;
  era: string;
  tag: string;
  fighters: Fighter[];
}

export const TRAITS: Trait[] = [
  { key: 'str', label: 'Striking',   icon: '\u{1F94A}', weight: 0.20, desc: 'Volume, accuracy, technique on the feet' },
  { key: 'pow', label: 'KO Power',   icon: '\u{1F4A5}', weight: 0.15, desc: 'One-shot fight-ending ability' },
  { key: 'wre', label: 'Wrestling',  icon: '\u{1F93C}', weight: 0.18, desc: 'Takedowns, top control, takedown defense' },
  { key: 'gra', label: 'Grappling',  icon: '\u{1F40D}', weight: 0.15, desc: 'Submissions, scrambles, ground craft' },
  { key: 'car', label: 'Cardio',     icon: '\u{1FAC0}', weight: 0.12, desc: 'Pace, output, championship rounds' },
  { key: 'chn', label: 'Durability', icon: '\u{1F5FF}', weight: 0.10, desc: 'Chin, toughness, damage absorption' },
  { key: 'iq',  label: 'Fight IQ',   icon: '\u{1F9E0}', weight: 0.10, desc: 'Game-planning, adjustments, ring craft' },
];

function F(name: string, nick: string, blurb: string, t: number[]): Fighter {
  return { name, nick, blurb, traits: { str: t[0], pow: t[1], wre: t[2], gra: t[3], car: t[4], chn: t[5], iq: t[6] } };
}

export const COMBOS: Combo[] = [
  {
    division: 'Heavyweight', era: '1993–2000', tag: 'The Pioneers',
    fighters: [
      F('Mark Coleman', 'The Hammer', 'Godfather of ground-and-pound · UFC 10 & 11 · Pride GP 2000 champ', [55, 74, 93, 70, 60, 80, 70]),
      F('Randy Couture', 'The Natural', 'Olympic-caliber Greco · 3× UFC HW champ across three decades', [72, 68, 91, 78, 84, 86, 93]),
      F('Bas Rutten', 'El Guapo', '21-fight unbeaten streak · liver-shot artist · UFC HW champ', [89, 85, 55, 82, 78, 87, 88]),
      F('Ken Shamrock', "The World's Most Dangerous Man", 'UFC 1 pioneer · Pancrase King · leglock specialist', [64, 72, 76, 86, 64, 78, 72]),
      F('Maurice Smith', 'Mo', 'First pure striker to dethrone a grappler · UFC 14 HW champ', [86, 80, 45, 55, 82, 84, 83]),
    ],
  },
  {
    division: 'Heavyweight', era: '2001–2007', tag: 'The PRIDE Wars',
    fighters: [
      F('Fedor Emelianenko', 'The Last Emperor', '28-fight unbeaten run · PRIDE HW champ · the GOAT heavyweight case', [88, 91, 85, 92, 85, 93, 96]),
      F('Mirko Cro Cop', 'Cro Cop', '"Right leg hospital, left leg cemetery" · PRIDE 2006 GP champ', [94, 96, 55, 62, 80, 82, 85]),
      F('Antônio Rodrigo Nogueira', 'Minotauro', 'Greatest submission HW ever · survived everything', [72, 72, 66, 96, 84, 97, 90]),
      F('Andrei Arlovski', 'The Pitbull', 'UFC HW champ · fastest hands in the division', [87, 90, 60, 70, 75, 70, 78]),
      F('Tim Sylvia', 'The Maine-iac', '2× UFC HW champ · 6\'8" range bully', [78, 85, 56, 52, 66, 80, 72]),
    ],
  },
  {
    division: 'Heavyweight', era: '2008–2015', tag: 'The Cain Era',
    fighters: [
      F('Cain Velasquez', 'Cardio Cain', 'Broke the HW cardio scale · 2× UFC champ · relentless pace', [84, 83, 95, 80, 96, 82, 88]),
      F('Junior dos Santos', 'Cigano', 'UFC HW champ · cleanest boxing the division ever saw', [92, 93, 62, 58, 82, 84, 82]),
      F('Fabrício Werdum', 'Vai Cavalo', 'Submitted Fedor · UFC HW champ · elite BJJ at heavyweight', [80, 78, 66, 97, 82, 84, 86]),
      F('Brock Lesnar', 'The Beast Incarnate', 'NCAA D1 champ · UFC HW champ · 280 lbs of takedown', [52, 86, 96, 58, 72, 66, 65]),
      F('Alistair Overeem', 'The Demolition Man', 'K-1 GP champ · horse-meat era knees', [91, 94, 60, 76, 70, 62, 80]),
    ],
  },
  {
    division: 'Heavyweight', era: '2016–2021', tag: 'Stipe vs. The World',
    fighters: [
      F('Stipe Miocic', '', 'Most HW title defenses ever · firefighter with a piston right hand', [88, 89, 85, 75, 90, 85, 91]),
      F('Francis Ngannou', 'The Predator', 'Hardest recorded punch on Earth · UFC HW champ', [80, 100, 58, 55, 66, 86, 75]),
      F('Daniel Cormier', 'DC', 'Double champ · Olympic wrestler · suplexes heavyweights', [83, 84, 96, 88, 86, 90, 93]),
      F('Derrick Lewis', 'The Black Beast', 'Most KOs in UFC history · one-hitter-quitter', [70, 97, 45, 42, 58, 82, 65]),
      F('Alexander Volkov', 'Drago', '6\'7" technician · Bellator & M-1 champ', [86, 84, 58, 66, 84, 80, 80]),
    ],
  },
  {
    division: 'Heavyweight', era: '2022–2026', tag: 'The New Breed',
    fighters: [
      F('Tom Aspinall', '', 'Fastest finisher in HW history · UFC HW champ · moves like a middleweight', [91, 94, 83, 87, 84, 82, 90]),
      F('Ciryl Gane', 'Bon Gamin', 'Balletic footwork at 250 lbs · interim HW champ', [91, 82, 58, 64, 88, 84, 85]),
      F('Sergei Pavlovich', '', 'Six straight first-round KOs · 84-inch wrecking balls', [78, 97, 52, 52, 66, 75, 68]),
      F('Jailton Almeida', 'Malhadinho', 'Submission machine · drowns heavyweights on top', [60, 70, 90, 95, 84, 70, 78]),
      F('Curtis Blaydes', 'Razor', 'Most takedowns in UFC HW history', [74, 84, 93, 60, 78, 66, 74]),
    ],
  },
  {
    division: 'Light Heavyweight', era: '2003–2009', tag: 'The Iceman Cometh',
    fighters: [
      F('Chuck Liddell', 'The Iceman', 'UFC LHW champ · sprawl-and-brawl blueprint · KO\'d everyone twice', [92, 95, 80, 48, 74, 87, 82]),
      F('Wanderlei Silva', 'The Axe Murderer', 'PRIDE MW champ · most violent man of his generation', [90, 93, 56, 70, 78, 84, 70]),
      F('Maurício Rua', 'Shogun', 'PRIDE 2005 GP champ · soccer kicks and stomps', [91, 91, 60, 82, 72, 82, 80]),
      F('Quinton Jackson', 'Rampage', 'Slam KOs · UFC LHW champ · granite chin', [86, 93, 76, 55, 74, 91, 76]),
      F('Lyoto Machida', 'The Dragon', 'Karate era LHW champ · "Machida era" elusiveness', [91, 85, 72, 70, 80, 84, 91]),
    ],
  },
  {
    division: 'Light Heavyweight', era: '2010–2016', tag: 'The Bones Dynasty',
    fighters: [
      F('Jon Jones', 'Bones', 'Youngest champ ever · cleared two generations of LHW', [91, 86, 96, 92, 90, 95, 98]),
      F('Alexander Gustafsson', 'The Mauler', 'Pushed Jones to the brink · elite Swedish boxing', [89, 84, 78, 60, 85, 82, 82]),
      F('Rashad Evans', 'Suga', 'UFC LHW champ · wrestle-boxing blueprint', [84, 87, 89, 65, 82, 76, 84]),
      F('Glover Teixeira', '', 'Brazilian brawler-grappler · oldest first-time champ at 42', [82, 87, 72, 88, 76, 83, 80]),
      F('Anthony Johnson', 'Rumble', 'Scariest power LHW ever produced', [84, 98, 70, 40, 66, 74, 68]),
    ],
  },
  {
    division: 'Light Heavyweight', era: '2019–2025', tag: 'The Poatan Problem',
    fighters: [
      F('Alex Pereira', 'Poatan', 'GLORY 2-division king · UFC 2-division champ · the left hook', [94, 98, 42, 48, 76, 85, 83]),
      F('Jiří Procházka', 'Denisa', 'Samurai chaos · RIZIN & UFC LHW champ', [88, 93, 55, 70, 86, 74, 76]),
      F('Magomed Ankalaev', '', 'Dagestani technician · unbeaten across a decade', [87, 86, 84, 80, 82, 85, 84]),
      F('Jan Błachowicz', '', 'Legendary Polish power · handed Adesanya his first MMA loss', [84, 88, 72, 75, 76, 84, 80]),
      F('Jamahal Hill', 'Sweet Dreams', 'DWCS to champ · southpaw heat', [86, 89, 50, 55, 78, 76, 72]),
    ],
  },
  {
    division: 'Middleweight', era: '2006–2012', tag: 'The Spider Era',
    fighters: [
      F('Anderson Silva', 'The Spider', '16 straight UFC wins · longest title reign ever · The Matrix', [99, 92, 60, 80, 84, 88, 94]),
      F('Dan Henderson', 'Hendo', 'The H-Bomb · 2× Olympian · champ in two PRIDE divisions', [76, 96, 89, 70, 74, 93, 80]),
      F('Vitor Belfort', 'The Phenom', 'Fastest hands of the era · UFC champ at 19 and 37', [90, 94, 58, 82, 68, 78, 72]),
      F('Chael Sonnen', 'The American Gangster', 'Smothered The Spider for 23 minutes · elite pressure wrestling', [62, 55, 94, 68, 89, 80, 78]),
      F('Rich Franklin', 'Ace', 'UFC MW champ · math teacher turned destroyer', [84, 80, 70, 72, 86, 82, 84]),
    ],
  },
  {
    division: 'Middleweight', era: '2013–2019', tag: 'The Contender Gauntlet',
    fighters: [
      F('Robert Whittaker', 'The Reaper', 'UFC MW champ · ANZAC speed and counters', [90, 86, 81, 66, 86, 84, 87]),
      F('Yoel Romero', 'Soldier of God', 'Olympic silver wrestler · most explosive 40-year-old alive', [84, 97, 94, 78, 68, 91, 76]),
      F('Luke Rockhold', '', 'UFC & Strikeforce MW champ · lethal left kick to mount', [85, 85, 76, 91, 80, 66, 80]),
      F('Chris Weidman', 'The All-American', 'Ended the Silva streak twice · UFC MW champ', [78, 79, 91, 86, 80, 76, 82]),
      F('Ronaldo Souza', 'Jacaré', 'World-champion BJJ · top-position nightmare', [72, 81, 76, 96, 76, 80, 78]),
    ],
  },
  {
    division: 'Middleweight', era: '2020–2026', tag: 'The Stylebender Years',
    fighters: [
      F('Israel Adesanya', 'The Last Stylebender', '2× UFC MW champ · kickboxing wizardry, untouchable at range', [97, 90, 56, 50, 88, 84, 93]),
      F('Dricus du Plessis', 'Stillknocks', 'Awkward, relentless, undefeated in title fights', [78, 86, 88, 90, 95, 84, 80]),
      F('Khamzat Chimaev', 'Borz', '"Smash everybody" · terrifying chain wrestling', [84, 90, 97, 93, 78, 84, 80]),
      F('Sean Strickland', 'Tarzan', 'Cyborg pressure jab · upset Adesanya for the belt', [86, 72, 62, 62, 92, 87, 78]),
      F('Jared Cannonier', 'The Killa Gorilla', 'HW-to-MW power puncher', [82, 90, 62, 58, 76, 84, 74]),
    ],
  },
  {
    division: 'Welterweight', era: '1997–2006', tag: 'The Old Guard',
    fighters: [
      F('Matt Hughes', '', '9 title defenses across two reigns · farm-strong slams', [64, 75, 96, 85, 84, 82, 80]),
      F('Pat Miletich', 'The Croatian Sensation', 'First UFC WW champ · godfather of MFS camp', [72, 68, 83, 85, 82, 80, 87]),
      F('Carlos Newton', 'The Ronin', 'UFC WW champ · Dragon-Ball jiu-jitsu', [70, 72, 72, 89, 70, 76, 78]),
      F('Matt Serra', 'The Terror', 'Pulled the greatest upset in UFC history at UFC 69', [74, 87, 70, 87, 64, 80, 75]),
      F('Frank Trigg', 'Twinkle Toes', 'Two wars with Hughes · heavy top game', [68, 72, 86, 74, 78, 78, 72]),
    ],
  },
  {
    division: 'Welterweight', era: '2007–2013', tag: 'The GSP Reign',
    fighters: [
      F('Georges St-Pierre', 'Rush', '9 straight title defenses · greatest game-planner in MMA history', [88, 80, 97, 90, 93, 88, 98]),
      F('Nick Diaz', '', 'Stockton volume · triathlete cardio · "Don\'t be scared homie"', [89, 76, 55, 88, 97, 92, 80]),
      F('Carlos Condit', 'The Natural Born Killer', 'Interim champ · most violent scrambler at 170', [88, 84, 58, 80, 90, 86, 82]),
      F('Josh Koscheck', 'Kos', '4× All-American · blast double into overhand right', [72, 78, 93, 68, 84, 86, 70]),
      F('Jon Fitch', '', 'The original grind · 23-minute blanket', [60, 55, 93, 80, 91, 84, 76]),
    ],
  },
  {
    division: 'Welterweight', era: '2014–2019', tag: 'Violence at 170',
    fighters: [
      F('Robbie Lawler', 'Ruthless', 'UFC WW champ · fights of the year on demand', [90, 92, 72, 60, 88, 95, 76]),
      F('Tyron Woodley', 'The Chosen One', 'UFC WW champ · fence-walking counter bombs', [84, 94, 87, 72, 74, 86, 78]),
      F('Stephen Thompson', 'Wonderboy', '57-0 kickboxer · karate sniping clinic', [95, 84, 58, 40, 84, 82, 85]),
      F('Demian Maia', '', 'Purest jiu-jitsu run in UFC history · took backs at will', [50, 40, 84, 99, 78, 78, 83]),
      F('Rory MacDonald', 'Red King', 'GSP heir · clinical violence', [85, 80, 84, 84, 84, 84, 84]),
    ],
  },
  {
    division: 'Welterweight', era: '2020–2026', tag: 'The Nigerian Nightmare & After',
    fighters: [
      F('Kamaru Usman', 'The Nigerian Nightmare', '15 straight UFC wins · 5 title defenses', [88, 88, 94, 76, 90, 90, 88]),
      F('Leon Edwards', 'Rocky', 'Headshot, dead. · UFC WW champ · 12-fight unbeaten run', [90, 83, 78, 72, 84, 82, 86]),
      F('Colby Covington', 'Chaos', 'Endless pressure and pace · interim champ', [70, 58, 93, 72, 97, 87, 74]),
      F('Shavkat Rakhmonov', 'Nomad', '100% finish rate · undefeated · hunts you everywhere', [88, 87, 90, 94, 86, 84, 88]),
      F('Jack Della Maddalena', 'JDM', 'UFC WW champ · nastiest boxing combinations at 170', [91, 86, 68, 70, 86, 82, 82]),
    ],
  },
  {
    division: 'Lightweight', era: '2001–2009', tag: 'The Prodigy Years',
    fighters: [
      F('BJ Penn', 'The Prodigy', 'Champ at 155 and 170 · black belt in 3 years · licked his gloves clean', [90, 84, 72, 95, 64, 95, 88]),
      F('Takanori Gomi', 'The Fireball Kid', 'PRIDE LW GP champ · Japan\'s knockout king', [85, 91, 60, 62, 72, 84, 70]),
      F('Sean Sherk', 'The Muscle Shark', 'UFC LW champ · double-leg perpetual motion', [62, 60, 93, 72, 94, 85, 70]),
      F('Kenny Florian', 'KenFlo', 'Elbows that "finish fights" · title challenger at 4 weights', [81, 72, 66, 86, 84, 76, 81]),
      F('Jens Pulver', 'Lil\' Evil', 'First UFC LW champ · southpaw spite', [78, 85, 55, 60, 70, 72, 68]),
    ],
  },
  {
    division: 'Lightweight', era: '2010–2015', tag: 'The Showtime Era',
    fighters: [
      F('Benson Henderson', 'Smooth', 'UFC & WEC LW champ · toothpick-chewing scramble god', [80, 72, 87, 84, 94, 89, 78]),
      F('Anthony Pettis', 'Showtime', 'The Showtime Kick · UFC & WEC LW champ', [93, 88, 50, 81, 76, 80, 78]),
      F('Rafael dos Anjos', 'RDA', 'UFC LW champ · body-kick pressure machine', [86, 84, 82, 84, 92, 82, 80]),
      F('Donald Cerrone', 'Cowboy', 'Most wins, most finishes · anytime, anywhere', [88, 82, 58, 83, 84, 82, 72]),
      F('Frankie Edgar', 'The Answer', 'UFC LW champ · smallest man in the room, never stopped moving', [82, 70, 88, 78, 96, 86, 88]),
    ],
  },
  {
    division: 'Lightweight', era: '2016–2021', tag: 'The Khabib Era',
    fighters: [
      F('Khabib Nurmagomedov', 'The Eagle', '29-0 · maul, control, neck. Retired undefeated on top', [78, 76, 99, 95, 96, 92, 93]),
      F('Conor McGregor', 'The Notorious', 'First simultaneous two-division champ · the left hand heard worldwide', [95, 96, 55, 62, 70, 82, 88]),
      F('Tony Ferguson', 'El Cucuy', '12-fight win streak · cardio from another dimension', [85, 76, 52, 89, 98, 91, 72]),
      F('Dustin Poirier', 'The Diamond', 'Interim champ · elite boxing, elite heart', [90, 88, 62, 80, 88, 88, 84]),
      F('Justin Gaethje', 'The Highlight', 'Human violence · leg kicks and overhands at full sprint', [89, 95, 74, 48, 86, 90, 70]),
    ],
  },
  {
    division: 'Lightweight', era: '2022–2026', tag: 'The Dagestani Handoff',
    fighters: [
      F('Islam Makhachev', '', 'Khabib\'s heir · most dominant champ of the decade · P4P #1', [86, 84, 96, 95, 94, 88, 94]),
      F('Charles Oliveira', 'Do Bronx', 'Most submissions in UFC history · UFC LW champ', [88, 87, 58, 98, 86, 72, 84]),
      F('Ilia Topuria', 'El Matador', 'Undefeated · KO\'d Volkanovski, Holloway & Oliveira · 2-division champ', [93, 95, 85, 88, 86, 90, 90]),
      F('Arman Tsarukyan', 'Ahalkalakets', 'Complete Armenian wrecking machine', [86, 84, 92, 86, 88, 84, 84]),
      F('Justin Gaethje', 'The Highlight', 'BMF champ · still the most violent man at 155', [89, 94, 74, 48, 84, 87, 72]),
    ],
  },
  {
    division: 'Featherweight', era: '2009–2015', tag: 'The Aldo Dynasty',
    fighters: [
      F('José Aldo', 'Junior', '18-fight unbeaten decade · WEC & UFC champ · leg kicks that ended careers', [93, 90, 87, 78, 80, 88, 90]),
      F('Chad Mendes', 'Money', 'NCAA All-American · FW power-wrestling prototype', [76, 89, 93, 70, 80, 80, 76]),
      F('Cub Swanson', 'Killer Cub', 'Highlight-reel violence · fight-of-the-night machine', [85, 84, 55, 72, 82, 80, 70]),
      F('Chan Sung Jung', 'The Korean Zombie', 'Twister sub · walks through hell forward', [86, 84, 55, 83, 86, 88, 74]),
      F('Ricardo Lamas', 'The Bully', 'Title challenger · all-around grinder', [78, 78, 75, 80, 80, 78, 74]),
    ],
  },
  {
    division: 'Featherweight', era: '2016–2022', tag: 'Blessed vs. The Great',
    fighters: [
      F('Alexander Volkanovski', 'The Great', '3 wins over Holloway · 5 title defenses · pound-for-pound king', [91, 84, 89, 76, 97, 90, 95]),
      F('Max Holloway', 'Blessed', 'Most significant strikes in UFC history · unkillable · BMF', [95, 83, 70, 58, 98, 97, 90]),
      F('Brian Ortega', 'T-City', 'Triangle from anywhere · never out of a fight', [70, 78, 45, 94, 84, 90, 72]),
      F('Yair Rodríguez', 'El Pantera', 'No-look elbow KO · most creative striker at 145', [89, 86, 42, 72, 84, 82, 70]),
      F('Zabit Magomedsharipov', '', 'Flying everything · Dagestan\'s showman', [90, 82, 74, 88, 76, 78, 82]),
    ],
  },
  {
    division: 'Bantamweight', era: '2010–2016', tag: 'The Dominator Years',
    fighters: [
      F('Dominick Cruz', 'The Dominator', 'Invented a footwork language · UFC & WEC BW champ', [88, 70, 86, 62, 94, 84, 95]),
      F('Renan Barão', 'The Baron', '33-fight unbeaten run · UFC BW champ', [86, 84, 62, 87, 84, 82, 78]),
      F('TJ Dillashaw', '', '2× UFC BW champ · shape-shifting angles', [90, 85, 81, 72, 92, 82, 85]),
      F('Urijah Faber', 'The California Kid', 'Face of the lighter weight classes · WEC king', [78, 82, 85, 87, 86, 90, 82]),
      F('Joseph Benavidez', 'Joe B', 'Perennial top dog across two divisions', [82, 78, 82, 84, 88, 80, 78]),
    ],
  },
  {
    division: 'Bantamweight', era: '2017–2026', tag: 'Suga & The Machine',
    fighters: [
      F("Sean O'Malley", 'Suga', 'UFC BW champ · sniper range control and swagger', [93, 88, 55, 62, 84, 80, 83]),
      F('Merab Dvalishvili', 'The Machine', '6 takedowns a round, every round, forever', [62, 52, 99, 72, 100, 92, 84]),
      F('Petr Yan', 'No Mercy', 'UFC BW champ · cold-blooded boxing craft', [91, 86, 78, 74, 88, 88, 85]),
      F('Aljamain Sterling', 'Funk Master', 'UFC BW champ · back-take funk grappling', [70, 62, 89, 93, 90, 82, 78]),
      F('Henry Cejudo', 'Triple C', 'Olympic gold + two UFC belts · cringe & gold', [82, 79, 96, 72, 86, 85, 88]),
    ],
  },
  {
    division: 'Flyweight', era: '2012–2026', tag: 'The Mighty Division',
    fighters: [
      F('Demetrious Johnson', 'Mighty Mouse', '11 title defenses · the most complete fighter who ever lived', [91, 72, 92, 93, 97, 86, 98]),
      F('Brandon Moreno', 'The Assassin Baby', 'First Mexican-born UFC champ · heart of the division', [86, 78, 68, 89, 90, 88, 80]),
      F('Alexandre Pantoja', 'The Cannibal', 'UFC FLW champ · swarms and strangles', [84, 80, 78, 93, 90, 86, 78]),
      F('Deiveson Figueiredo', 'Deus da Guerra', 'FLW champ with BW power', [86, 90, 70, 86, 78, 84, 74]),
      F('Kai Kara-France', '', 'City Kickboxing speed at 125', [88, 86, 60, 62, 84, 80, 76]),
    ],
  },
  {
    division: "Women's MMA", era: '2013–2018', tag: 'The Rousey Revolution',
    fighters: [
      F('Ronda Rousey', 'Rowdy', 'Olympic judo bronze · 12 straight finishes · armbar inevitability', [60, 74, 91, 95, 70, 66, 70]),
      F('Amanda Nunes', 'The Lioness', 'Two-division champ · beat every champ before her', [92, 96, 80, 85, 80, 86, 85]),
      F('Cris Cyborg', '', 'Grand Slam champ across 4 promotions · 13-year unbeaten run', [90, 95, 70, 72, 84, 86, 76]),
      F('Holly Holm', 'The Preacher\'s Daughter', '18-time boxing world champ · THE head kick at UFC 193', [89, 78, 72, 55, 90, 86, 83]),
      F('Joanna Jędrzejczyk', '', '5 strawweight defenses · Muay Thai clinic every night', [93, 76, 70, 60, 94, 85, 87]),
    ],
  },
  {
    division: "Women's MMA", era: '2019–2026', tag: 'The Bullet & Magnum',
    fighters: [
      F('Valentina Shevchenko', 'Bullet', 'Most dominant FLW reign ever · Muay Thai world champ', [93, 84, 87, 87, 88, 90, 95]),
      F('Zhang Weili', 'Magnum', 'China\'s first UFC champ · strongest pound-for-pound athlete at 115', [90, 89, 86, 83, 93, 88, 86]),
      F('Rose Namajunas', 'Thug Rose', '2× strawweight champ · "I\'m the best!"', [90, 81, 62, 80, 84, 78, 82]),
      F('Alexa Grasso', '', 'Shocked the Bullet · sharp Mexican boxing', [85, 76, 60, 83, 84, 82, 80]),
      F('Kayla Harrison', '', '2× Olympic judo GOLD · PFL & UFC champ', [64, 82, 96, 93, 84, 84, 78]),
    ],
  },
];
