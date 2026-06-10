// ============================================================
// 38-0 — World Cup Player Database
// The spin lands on a NATION + DECADE WINDOW; the pool is that
// country's World Cup legends from those tournaments.
//
// Each player lists the positions they actually played — you can
// only sign them into one of those slots (no Mbappé in goal).
// Position order in P(): [gk, cb, fb, cm, cam, wg, st]
// Ratings are era-relative (graded vs. same-era peers), 0-100,
// and stay hidden until you lock the pick.
// ============================================================

export type PositionKey = 'gk' | 'cb' | 'fb' | 'cm' | 'cam' | 'wg' | 'st';

export interface Position {
  key: PositionKey;
  label: string;
  code: string;
  weight: number;
  desc: string;
}

export interface Player {
  name: string;
  nick: string;
  blurb: string;
  positions: PositionKey[];
  ratings: Record<PositionKey, number>;
}

export interface SoccerCombo {
  division: string; // nation — the first reel
  era: string;      // decade window — the second reel
  tag: string;
  players: Player[];
}

export const POSITIONS: Position[] = [
  { key: 'gk',  label: 'Goalkeeper',  code: 'GK', weight: 0.12, desc: 'Shot-stopping, command of the box, the last line' },
  { key: 'cb',  label: 'Centre-Back', code: 'CB', weight: 0.15, desc: 'Duels, positioning, organizing the back line' },
  { key: 'fb',  label: 'Full-Back',   code: 'FB', weight: 0.10, desc: 'Defend the flank, overlap forward, both boxes' },
  { key: 'cm',  label: 'Midfield',    code: 'CM', weight: 0.16, desc: 'Tempo, control, winning the middle of the park' },
  { key: 'cam', label: 'Playmaker',   code: 'AM', weight: 0.15, desc: 'The final pass, ideas in the last third' },
  { key: 'wg',  label: 'Winger',      code: 'WG', weight: 0.14, desc: 'Width, 1-v-1 dribbling, chance creation' },
  { key: 'st',  label: 'Striker',     code: 'ST', weight: 0.18, desc: 'Finishing. Goals decide everything' },
];

function P(name: string, nick: string, blurb: string, pos: string, r: number[]): Player {
  return {
    name,
    nick,
    blurb,
    positions: pos.split(' ') as PositionKey[],
    ratings: { gk: r[0], cb: r[1], fb: r[2], cm: r[3], cam: r[4], wg: r[5], st: r[6] },
  };
}

export const SOCCER_COMBOS: SoccerCombo[] = [
  {
    division: 'Brazil', era: '1958–1970', tag: 'O Jogo Bonito',
    players: [
      P('Pelé', 'O Rei', 'Three World Cups · 1,000+ goals · football\'s first god', 'cam st', [12, 30, 35, 80, 96, 90, 99]),
      P('Garrincha', 'Alegria do Povo', 'Bent legs, broken ankles · Brazil never lost with him and Pelé together', 'wg', [8, 18, 25, 45, 80, 98, 85]),
      P('Carlos Alberto', 'O Capitão', 'Captain of 1970 · finished THE team goal in the final', 'fb cb', [12, 82, 95, 65, 50, 70, 45]),
      P('Jairzinho', 'The Hurricane', 'Scored in every round of the 1970 World Cup', 'wg st', [8, 22, 30, 48, 72, 93, 90]),
      P('Gérson', 'O Canhotinha', 'The golden left foot · 1970\'s midfield brain', 'cm cam', [10, 35, 40, 93, 90, 65, 55]),
      P('Gilmar', '', 'Two World Cups in goal · the calm behind the beautiful chaos', 'gk', [92, 30, 20, 15, 10, 8, 10]),
    ],
  },
  {
    division: 'Brazil', era: '1978–1986', tag: 'The Beautiful Losers',
    players: [
      P('Zico', 'The White Pelé', 'The purest free-kick technique ever filmed · 1982\'s tragic genius', 'cam st', [8, 25, 28, 82, 95, 78, 86]),
      P('Sócrates', 'O Doutor', 'Heel-flick philosopher with an actual doctorate', 'cm cam', [10, 30, 30, 92, 90, 70, 75]),
      P('Falcão', '', 'The King of Rome · 1982\'s elegant engine', 'cm', [10, 45, 40, 93, 85, 60, 55]),
      P('Júnior', '', 'Samba down the left flank of the greatest team that never won', 'fb cm', [10, 70, 91, 75, 65, 75, 50]),
      P('Éder', '', 'The hardest left foot of España \'82', 'wg st', [8, 20, 28, 45, 70, 88, 82]),
    ],
  },
  {
    division: 'Brazil', era: '1994–2002', tag: 'The Penta',
    players: [
      P('Ronaldo', 'O Fenômeno', 'The most feared striker who ever lived · 8 goals at the 2002 World Cup', 'st', [8, 20, 25, 42, 82, 88, 99]),
      P('Romário', 'O Baixinho', 'Toe-poke assassin · carried USA \'94 · self-declared genius', 'st', [8, 20, 22, 38, 70, 72, 96]),
      P('Rivaldo', '', 'Ballon d\'Or 1999 · 2002 champion · overhead kicks to save seasons', 'cam wg st', [8, 25, 28, 68, 93, 88, 90]),
      P('Roberto Carlos', 'El Hombre Bala', 'The Bullet Man · that free kick against France still hasn\'t landed', 'fb wg', [12, 68, 96, 60, 50, 80, 55]),
      P('Cafu', 'Il Pendolino', 'Only man to play in three straight World Cup finals', 'fb', [12, 80, 95, 68, 50, 72, 40]),
      P('Cláudio Taffarel', '', 'Two World Cup finals · one penalty-shootout sainthood', 'gk', [90, 25, 18, 15, 10, 8, 10]),
    ],
  },
  {
    division: 'Brazil', era: '2006–2026', tag: 'The Eternal Favorites',
    players: [
      P('Ronaldinho', 'O Bruxo', 'The wizard · joy as a tactic · that lob over Seaman', 'cam wg', [8, 22, 30, 70, 96, 94, 88]),
      P('Kaká', '', 'The last Ballon d\'Or before the duopoly · ran through entire defenses', 'cam cm', [8, 25, 30, 75, 96, 88, 86]),
      P('Neymar', 'Ney', 'Brazil\'s record scorer · carried three World Cups on one ankle', 'wg cam st', [8, 20, 30, 62, 93, 96, 88]),
      P('Thiago Silva', 'O Monstro', 'The Monster · cleanest defending of his generation', 'cb', [16, 95, 78, 55, 35, 22, 28]),
      P('Alisson Becker', '', 'Brazil\'s calmest last line since the 70s', 'gk', [96, 35, 25, 25, 18, 12, 20]),
    ],
  },
  {
    division: 'Argentina', era: '1978–1994', tag: 'La Mano de Dios',
    players: [
      P('Diego Maradona', 'El Pibe de Oro', 'Won 1986 nearly alone · the Goal of the Century', 'cam cm', [8, 25, 30, 86, 99, 93, 94]),
      P('Mario Kempes', 'El Matador', 'Top scorer and champion at home in 1978', 'st', [10, 28, 30, 55, 75, 78, 93]),
      P('Daniel Passarella', 'El Gran Capitán', 'Champion captain · a centre-back with 134 career goals', 'cb', [14, 93, 80, 70, 55, 35, 55]),
      P('Gabriel Batistuta', 'Batigol', 'Hat-tricks at two different World Cups', 'st', [8, 25, 25, 40, 65, 68, 94]),
      P('Sergio Goycochea', 'El Vasco', 'The penalty-shootout assassin of Italia \'90', 'gk', [89, 25, 18, 15, 12, 10, 12]),
    ],
  },
  {
    division: 'Argentina', era: '2006–2026', tag: 'La Scaloneta',
    players: [
      P('Lionel Messi', 'La Pulga', 'Finally took the crown in Qatar · the GOAT case, closed', 'cam wg st', [8, 25, 30, 80, 97, 99, 97]),
      P('Juan Román Riquelme', 'El Último 10', 'Played at walking pace and still ran the whole game', 'cam cm', [8, 25, 25, 80, 94, 70, 68]),
      P('Ángel Di María', 'Fideo', 'Scored in every final Argentina won for a decade', 'wg cam', [8, 25, 40, 70, 88, 92, 80]),
      P('Javier Mascherano', 'El Jefecito', '"Today I became a defender" · the 2014 tackle', 'cm cb', [12, 88, 70, 92, 60, 40, 30]),
      P('Emiliano Martínez', 'Dibu', 'World Cup-winning villain · penalty-shootout sorcerer', 'gk', [93, 25, 18, 14, 10, 8, 12]),
    ],
  },
  {
    division: 'West Germany', era: '1954–1974', tag: 'Das Wunder',
    players: [
      P('Franz Beckenbauer', 'Der Kaiser', 'Invented the attacking libero · won everything as captain, then as coach', 'cb cm', [15, 98, 88, 92, 75, 40, 50]),
      P('Gerd Müller', 'Der Bomber', '68 goals in 62 internationals · scored the 1974 winner', 'st', [8, 25, 20, 35, 60, 55, 98]),
      P('Sepp Maier', 'Die Katze', 'The Cat from Anzing · 1974\'s last line', 'gk', [94, 28, 20, 16, 12, 10, 12]),
      P('Paul Breitner', '', 'Scored in two World Cup finals · full-back turned rebel playmaker', 'fb cm', [10, 72, 92, 88, 70, 60, 60]),
      P('Helmut Rahn', 'Der Boss', 'Scored the Miracle of Bern winner in 1954', 'wg st', [8, 20, 25, 40, 62, 88, 86]),
      P('Uwe Seeler', 'Uns Uwe', 'Four World Cups of honest violence in the box', 'st', [10, 30, 28, 50, 65, 55, 90]),
    ],
  },
  {
    division: 'Germany', era: '1980–1996', tag: 'The Tournament Machine',
    players: [
      P('Lothar Matthäus', '', 'Five World Cups · Ballon d\'Or · the colossus of Italia \'90', 'cm cb', [12, 80, 65, 95, 85, 65, 70]),
      P('Andreas Brehme', '', 'Both feet, both flanks · scored the 1990 final winner', 'fb', [10, 72, 93, 75, 65, 72, 55]),
      P('Jürgen Klinsmann', '', 'The golden bomber of 1990', 'st', [8, 25, 28, 45, 68, 75, 92]),
      P('Karl-Heinz Rummenigge', '', 'Two Ballons d\'Or · dragged Germany to back-to-back finals', 'st wg', [10, 28, 32, 55, 78, 86, 93]),
      P('Bodo Illgner', '', 'Kept a clean sheet in the 1990 final at 23', 'gk', [89, 25, 18, 14, 10, 8, 10]),
    ],
  },
  {
    division: 'Germany', era: '2002–2014', tag: 'Die Mannschaft Reborn',
    players: [
      P('Manuel Neuer', '', 'Invented the sweeper-keeper · 2014\'s highest defender wore gloves', 'gk', [98, 55, 40, 35, 22, 15, 18]),
      P('Philipp Lahm', '', 'Pep called him the most intelligent player he ever coached', 'fb cm', [12, 80, 96, 86, 60, 55, 35]),
      P('Bastian Schweinsteiger', '', 'Bled through the 2014 final like a war film', 'cm', [12, 70, 55, 93, 80, 60, 45]),
      P('Mats Hummels', '', 'Rose highest in the 2014 quarterfinal · ball-playing centre-back of the decade', 'cb', [15, 93, 72, 68, 45, 22, 35]),
      P('Miroslav Klose', '', 'Most World Cup goals in history · 16', 'st', [10, 30, 25, 40, 62, 58, 94]),
      P('Thomas Müller', 'Raumdeuter', 'The space interpreter · 10 World Cup goals before turning 25', 'cam wg st', [10, 30, 45, 70, 91, 84, 89]),
    ],
  },
  {
    division: 'Italy', era: '1968–1982', tag: 'Catenaccio & Glory',
    players: [
      P('Dino Zoff', '', 'World Cup-winning captain at 40 · 1,142 international minutes unbeaten', 'gk', [95, 30, 18, 15, 12, 8, 10]),
      P('Gaetano Scirea', '', 'The gentleman libero · never booked, never beaten', 'cb', [14, 95, 82, 72, 50, 28, 30]),
      P('Giacinto Facchetti', '', 'Invented the attacking full-back at 6\'3"', 'fb cb', [12, 88, 94, 65, 45, 60, 50]),
      P('Marco Tardelli', '', 'THE scream · 1982\'s box-to-box heartbeat', 'cm', [10, 70, 65, 91, 70, 55, 60]),
      P('Gianni Rivera', 'The Golden Boy', 'Ballon d\'Or 1969 · the Game of the Century in 1970', 'cam cm', [9, 25, 28, 80, 93, 70, 72]),
      P('Paolo Rossi', 'Pablito', 'Hat-trick against Brazil \'82 · top scorer, champion, redemption', 'st', [8, 20, 22, 40, 65, 60, 93]),
    ],
  },
  {
    division: 'Italy', era: '1990–2006', tag: 'Notti Magiche',
    players: [
      P('Gianluigi Buffon', 'Gigi', 'The 2006 wall · two decades of impossible saves', 'gk', [98, 30, 20, 18, 14, 10, 12]),
      P('Fabio Cannavaro', '', 'Ballon d\'Or as a defender · Berlin 2006 perfection', 'cb', [14, 96, 82, 48, 28, 20, 28]),
      P('Paolo Maldini', 'Il Capitano', '"If I have to tackle, I\'ve already made a mistake"', 'cb fb', [14, 95, 97, 60, 35, 30, 32]),
      P('Roberto Baggio', 'Il Divin Codino', 'The Divine Ponytail · carried Italy to the \'94 final', 'cam st', [8, 22, 28, 68, 95, 85, 90]),
      P('Andrea Pirlo', 'The Architect', '2006\'s puppet master · zero pace required', 'cm cam', [10, 40, 38, 95, 91, 60, 50]),
    ],
  },
  {
    division: 'France', era: '1982–1998', tag: 'Les Bleus Rise',
    players: [
      P('Michel Platini', 'Le Roi', 'Three straight Ballons d\'Or · the Séville \'82 epic', 'cam cm', [10, 30, 30, 90, 97, 75, 82]),
      P('Zinedine Zidane', 'Zizou', 'Two headers in the \'98 final · and one in \'06 nobody mentions', 'cam cm', [10, 30, 35, 90, 98, 82, 80]),
      P('Lilian Thuram', '', 'Scored twice in the \'98 semi and never again · immortal anyway', 'cb fb', [12, 93, 92, 60, 40, 35, 30]),
      P('Marcel Desailly', 'The Rock', 'Back-to-back champion at club and country', 'cb cm', [13, 94, 75, 82, 45, 30, 35]),
      P('Didier Deschamps', 'The Water Carrier', 'Captain in \'98, coach in \'18 · trophies follow him around', 'cm', [12, 65, 60, 90, 65, 45, 35]),
      P('Fabien Barthez', '', 'The bald head Blanc kissed before every \'98 match', 'gk', [90, 25, 18, 15, 10, 8, 10]),
    ],
  },
  {
    division: 'France', era: '2006–2026', tag: 'Génération Mbappé',
    players: [
      P('Thierry Henry', 'Titi', 'France\'s record scorer until Giroud · va-va-voom', 'st wg', [10, 28, 40, 62, 86, 93, 98]),
      P('Kylian Mbappé', '', 'Hat-trick in a World Cup final · teenage champion in \'18', 'st wg', [8, 22, 30, 45, 80, 95, 97]),
      P('Antoine Griezmann', 'Grizou', 'World Cup winner who plays four positions at once', 'cam st cm', [10, 40, 45, 85, 92, 82, 86]),
      P('N\'Golo Kanté', '', '70% of the Earth is covered by water · the rest by Kanté', 'cm', [12, 75, 68, 94, 60, 45, 30]),
      P('Hugo Lloris', '', 'World Cup-winning captain · sweeper-keeper reflexes', 'gk', [92, 25, 18, 15, 12, 10, 10]),
    ],
  },
  {
    division: 'Netherlands', era: '1974–1978', tag: 'Total Football',
    players: [
      P('Johan Cruyff', '', 'Number 14 · invented modern football twice — as a player, then a coach', 'cam wg st', [10, 35, 45, 90, 98, 94, 95]),
      P('Johan Neeskens', '', 'The hammer of Total Football · scored in the \'74 final after 90 seconds', 'cm', [10, 60, 55, 93, 80, 65, 70]),
      P('Ruud Krol', '', 'Libero, left-back, anywhere · elegance under fire', 'cb fb', [13, 91, 90, 75, 55, 45, 35]),
      P('Rob Rensenbrink', '', 'Hit the post in the last minute of the \'78 final · centimeters from immortality', 'wg', [8, 20, 28, 50, 78, 90, 85]),
      P('Johnny Rep', '', 'Big-stage finisher of the Clockwork Orange', 'wg st', [8, 20, 25, 45, 70, 82, 86]),
    ],
  },
  {
    division: 'Netherlands', era: '1990–2014', tag: 'The Orange Machine',
    players: [
      P('Marco van Basten', 'San Marco', 'Three Ballons d\'Or · THE volley · ankles stolen by defenders', 'st', [10, 30, 25, 45, 78, 80, 97]),
      P('Dennis Bergkamp', 'The Iceman', 'THAT touch against Argentina in \'98', 'cam st', [8, 22, 28, 68, 94, 82, 91]),
      P('Arjen Robben', '', 'Cut inside, far corner · everyone knew, nobody stopped it', 'wg', [8, 22, 35, 55, 84, 95, 86]),
      P('Wesley Sneijder', '', 'Dragged the Dutch to the 2010 final · five goals', 'cam cm', [9, 28, 32, 80, 93, 75, 70]),
      P('Edwin van der Sar', '', 'Two decades as the Oranje\'s calmest man', 'gk', [94, 30, 22, 20, 15, 10, 12]),
    ],
  },
  {
    division: 'England', era: '1966–1990', tag: 'The Lions',
    players: [
      P('Bobby Moore', '', 'The defender Pelé called the greatest he ever faced', 'cb', [14, 96, 80, 65, 40, 25, 30]),
      P('Bobby Charlton', '', 'Survived Munich, won the World Cup · thunder from 30 yards', 'cm cam', [10, 32, 35, 92, 93, 80, 85]),
      P('Gordon Banks', '', 'THE save against Pelé · 1966\'s last line', 'gk', [96, 25, 18, 14, 10, 8, 10]),
      P('Gary Lineker', '', 'Golden Boot 1986 · never booked in his entire career', 'st', [8, 22, 25, 38, 60, 55, 92]),
      P('Paul Gascoigne', 'Gazza', 'The tears of Italia \'90 · the most gifted Englishman of his age', 'cam cm', [9, 28, 30, 84, 92, 75, 68]),
    ],
  },
  {
    division: 'England', era: '1998–2026', tag: 'The Golden Generations',
    players: [
      P('David Beckham', 'Becks', 'That free kick against Greece · crosses like guided missiles', 'wg cm', [10, 35, 75, 82, 88, 90, 68]),
      P('Steven Gerrard', 'Stevie G', '30-yard screamers · carried the armband through three World Cups', 'cm cam', [14, 55, 68, 95, 92, 80, 76]),
      P('Wayne Rooney', 'Wazza', 'Feral teenage brilliance · England\'s record scorer until Kane', 'st cam', [10, 35, 40, 70, 87, 75, 91]),
      P('Rio Ferdinand', '', 'Rolls-Royce centre-back of the golden generation', 'cb', [14, 93, 78, 60, 40, 28, 32]),
      P('Ashley Cole', '', 'Three World Cups · the best left-back of his generation', 'fb', [10, 75, 93, 55, 40, 55, 30]),
      P('David Seaman', 'Safe Hands', 'England\'s last line across two World Cups', 'gk', [91, 25, 18, 14, 10, 8, 10]),
      P('Harry Kane', '', 'England\'s record scorer · Golden Boot 2018 · a 10 wearing a 9', 'st cam', [10, 30, 25, 65, 86, 55, 95]),
    ],
  },
  {
    division: 'Spain', era: '2008–2012', tag: 'La Roja',
    players: [
      P('Iker Casillas', 'San Iker', 'The double save in the World Cup final', 'gk', [96, 28, 22, 20, 15, 10, 12]),
      P('Carles Puyol', 'The Caveman', 'The header that beat Germany in 2010 · captain of everything', 'cb fb', [15, 94, 87, 55, 30, 25, 35]),
      P('Xavi', 'The Puppet Master', 'Metronome of the greatest international side ever', 'cm cam', [10, 30, 40, 99, 93, 70, 60]),
      P('Andrés Iniesta', 'El Ilusionista', 'Scored THE goal · Johannesburg, minute 116', 'cm cam wg', [10, 28, 42, 95, 96, 86, 68]),
      P('David Villa', 'El Guaje', 'Spain\'s record scorer · finished what tiki-taka started', 'st wg', [8, 20, 25, 42, 70, 80, 93]),
    ],
  },
  {
    division: 'Spain', era: '2014–2026', tag: 'The Next Wave',
    players: [
      P('Sergio Ramos', '', 'Champion, villain, century of caps — usually in the same match', 'cb fb', [18, 96, 84, 55, 40, 28, 55]),
      P('Sergio Busquets', '', 'Watch him and you see the game', 'cm', [12, 60, 50, 96, 80, 40, 25]),
      P('Rodri', '', 'Ballon d\'Or 2024 · his teams basically forgot how to lose', 'cm', [14, 72, 55, 97, 82, 40, 40]),
      P('Pedri', '', 'Iniesta\'s heir · played 73 games at 18 and never looked tired', 'cm cam', [9, 30, 40, 93, 92, 78, 60]),
      P('Lamine Yamal', '', 'Euro winner as a teenager · the wing already belongs to him', 'wg', [8, 18, 28, 50, 85, 95, 82]),
    ],
  },
  {
    division: 'Hungary', era: '1938–1954', tag: 'The Magical Magyars',
    players: [
      P('Ferenc Puskás', 'The Galloping Major', '84 goals in 85 internationals · the left foot of God', 'st cam', [8, 22, 22, 55, 88, 70, 97]),
      P('Sándor Kocsis', 'Golden Head', '75 goals in 68 games · seven at the \'54 World Cup', 'st', [8, 20, 20, 40, 65, 60, 93]),
      P('Nándor Hidegkuti', '', 'The first false nine · destroyed England 6–3 at Wembley', 'cam st', [8, 25, 25, 72, 93, 70, 85]),
      P('József Bozsik', '', 'The Aranycsapat\'s midfield general', 'cm', [10, 50, 45, 91, 80, 55, 45]),
      P('Gyula Grosics', 'The Black Panther', 'Pioneer sweeper-keeper of the unbeaten years', 'gk', [89, 25, 18, 15, 10, 8, 10]),
    ],
  },
  {
    division: 'Eastern Europe', era: '1958–1994', tag: 'Behind the Curtain',
    players: [
      P('Lev Yashin', 'The Black Spider', 'Only goalkeeper to win the Ballon d\'Or · ~150 penalty saves', 'gk', [99, 30, 20, 18, 12, 10, 10]),
      P('Gheorghe Hagi', 'The Maradona of the Carpathians', 'USA \'94 · the lob from the halfway line', 'cam cm', [8, 22, 25, 75, 94, 82, 80]),
      P('Hristo Stoichkov', 'El Pistolero', 'Dragged Bulgaria to the \'94 semis · Golden Boot and pure fury', 'wg st', [10, 25, 30, 50, 78, 91, 90]),
      P('Zbigniew Boniek', '', 'Poland\'s 1982 semifinal lightning', 'wg st', [9, 25, 30, 60, 80, 88, 84]),
      P('Oleg Blokhin', '', 'The USSR\'s record scorer · Ballon d\'Or 1975', 'wg st', [8, 20, 28, 45, 70, 90, 87]),
    ],
  },
  {
    division: 'Portugal', era: '1966–2026', tag: 'Eusébio to Ronaldo',
    players: [
      P('Eusébio', 'The Black Panther', 'Nine goals at the \'66 World Cup · carried Portugal to third', 'st', [8, 20, 22, 40, 72, 80, 96]),
      P('Luís Figo', '', 'The original Galáctico · wing wizardry across three World Cups', 'wg cam', [9, 25, 35, 70, 88, 94, 78]),
      P('Cristiano Ronaldo', 'CR7', 'Five World Cups · the most international goals ever scored', 'st wg', [8, 30, 32, 50, 80, 93, 98]),
      P('Rui Costa', 'O Maestro', 'The final pass of the golden generation', 'cam', [9, 25, 28, 78, 93, 75, 65]),
      P('Pepe', '', 'Played a World Cup at 39 like a man half his age and twice as angry', 'cb', [13, 91, 72, 50, 28, 20, 25]),
      P('Rui Patrício', '', 'A decade as Portugal\'s last line', 'gk', [89, 25, 18, 14, 10, 8, 10]),
    ],
  },
  {
    division: 'Uruguay', era: '1930–2022', tag: 'La Garra Charrúa',
    players: [
      P('Obdulio Varela', 'El Negro Jefe', 'Silenced 200,000 at the Maracanazo, 1950', 'cm cb', [11, 80, 60, 90, 70, 45, 50]),
      P('Luis Suárez', 'El Pistolero', 'The 2010 handball · villain, genius, both at once', 'st', [8, 25, 25, 45, 75, 72, 95]),
      P('Edinson Cavani', 'El Matador', 'A striker who defends corners · Uruguay\'s tireless No. 21', 'st wg', [10, 40, 35, 55, 68, 72, 93]),
      P('Diego Godín', 'El Faraón', 'Uruguay\'s warrior captain', 'cb', [13, 92, 75, 50, 30, 20, 35]),
      P('Diego Forlán', '', 'Golden Ball at the 2010 World Cup', 'st cam', [9, 22, 25, 50, 80, 75, 90]),
    ],
  },
  {
    division: 'Africa', era: '1990–2026', tag: 'The Indomitable Ones',
    players: [
      P('Roger Milla', '', 'The corner-flag dance · oldest World Cup scorer at 42', 'st', [8, 20, 22, 38, 62, 68, 90]),
      P('Jay-Jay Okocha', '', 'So good they named him twice', 'cam cm', [8, 20, 28, 70, 92, 86, 72]),
      P('Samuel Eto\'o', '', 'Four World Cups for Cameroon · Africa\'s record everything', 'st wg', [8, 25, 28, 45, 70, 78, 94]),
      P('Didier Drogba', '', 'Paused a civil war with one speech · Côte d\'Ivoire\'s colossus', 'st', [9, 35, 25, 45, 65, 60, 93]),
      P('Achraf Hakimi', '', 'Morocco 2022 — engine of Africa\'s first semifinal', 'fb wg', [10, 72, 94, 62, 55, 85, 55]),
    ],
  },
  {
    division: "Women's World Cup", era: '1991–2015', tag: 'The Pioneers',
    players: [
      P('Mia Hamm', '', 'The first global star · two World Cups, two Olympic golds', 'st wg', [10, 25, 35, 55, 82, 88, 95]),
      P('Marta', 'A Rainha', 'Six-time World Player of the Year · most World Cup goals ever', 'wg st', [8, 20, 28, 60, 90, 96, 94]),
      P('Abby Wambach', '', '184 international goals · the header from the heavens in 2011', 'st', [10, 40, 30, 45, 65, 60, 94]),
      P('Homare Sawa', '', 'Captained Japan to the 2011 World Cup · Ballon d\'Or winner', 'cm cam', [10, 40, 40, 93, 91, 68, 72]),
      P('Hope Solo', '', 'The most dominant goalkeeper the women\'s game has seen', 'gk', [96, 25, 18, 15, 10, 8, 10]),
    ],
  },
  {
    division: "Women's World Cup", era: '2015–2026', tag: 'The New Queens',
    players: [
      P('Megan Rapinoe', '', 'Golden Boot, Golden Ball, the pose · 2019 was hers', 'wg', [9, 22, 30, 55, 85, 92, 84]),
      P('Alexia Putellas', 'La Reina', 'Back-to-back Ballons d\'Or · 2023 world champion', 'cm cam', [10, 35, 45, 95, 96, 82, 78]),
      P('Aitana Bonmatí', '', 'Three straight Ballons d\'Or · the Xavi comparison actually fits', 'cm cam', [10, 32, 42, 94, 96, 80, 70]),
      P('Sam Kerr', '', 'The backflip · scored in every league she ever touched', 'st', [8, 22, 25, 40, 68, 72, 95]),
      P('Lucy Bronze', '', 'Best right-back of her generation · five Champions Leagues', 'fb cb', [12, 82, 95, 70, 55, 72, 45]),
      P('Mary Earps', '', 'FIFA Best keeper · saved a penalty in a World Cup final', 'gk', [92, 25, 18, 14, 10, 8, 10]),
    ],
  },
];
