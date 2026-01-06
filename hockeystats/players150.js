// 150 NHL PLAYERS – GENERATED CAREER-LIKE TOTALS
// Balanced mix of stars, solid players, defenders, grinders
// Values are intentionally realistic for gameplay

const players = [
  // --- ELITE / LEGENDS ---
  {name:"Wayne Gretzky",goals:894,assists:1963,points:2857,pim:577},
  {name:"Jaromir Jagr",goals:766,assists:1155,points:1921,pim:1926},
  {name:"Gordie Howe",goals:801,assists:1049,points:1850,pim:1685},
  {name:"Mario Lemieux",goals:690,assists:1033,points:1723,pim:834},
  {name:"Mark Messier",goals:694,assists:1193,points:1887,pim:1910},
  {name:"Steve Yzerman",goals:692,assists:1063,points:1755,pim:971},
  {name:"Joe Sakic",goals:625,assists:1016,points:1641,pim:1078},
  {name:"Sidney Crosby",goals:592,assists:1010,points:1602,pim:818},
  {name:"Alex Ovechkin",goals:853,assists:707,points:1560,pim:822},
  {name:"Ron Francis",goals:549,assists:1249,points:1798,pim:1798},

  // --- MODERN STARS ---
  {name:"Connor McDavid",goals:331,assists:611,points:942,pim:264},
  {name:"Leon Draisaitl",goals:357,assists:468,points:825,pim:364},
  {name:"Nathan MacKinnon",goals:341,assists:513,points:854,pim:364},
  {name:"Patrick Kane",goals:451,assists:836,points:1287,pim:460},
  {name:"Steven Stamkos",goals:566,assists:604,points:1170,pim:840},
  {name:"Evgeni Malkin",goals:498,assists:829,points:1327,pim:924},
  {name:"Auston Matthews",goals:373,assists:263,points:636,pim:250},
  {name:"Mitch Marner",goals:194,assists:489,points:683,pim:188},
  {name:"David Pastrnak",goals:343,assists:332,points:675,pim:330},
  {name:"Nikita Kucherov",goals:336,assists:553,points:889,pim:510},

  // --- STRONG ALL-AROUND PLAYERS ---
  {name:"Jarome Iginla",goals:625,assists:675,points:1300,pim:1040},
  {name:"Claude Giroux",goals:365,assists:697,points:1062,pim:900},
  {name:"Patrice Bergeron",goals:427,assists:613,points:1040,pim:770},
  {name:"Anze Kopitar",goals:415,assists:790,points:1205,pim:512},
  {name:"Patrick Marleau",goals:566,assists:631,points:1197,pim:566},
  {name:"Brad Marchand",goals:424,assists:546,points:970,pim:1080},
  {name:"Pavel Datsyuk",goals:314,assists:604,points:918,pim:514},
  {name:"Henrik Sedin",goals:240,assists:830,points:1070,pim:456},
  {name:"Daniel Sedin",goals:393,assists:648,points:1041,pim:640},
  {name:"Mike Modano",goals:561,assists:813,points:1374,pim:561},

  // --- DEFENSE & PHYSICAL ---
  {name:"Nicklas Lidstrom",goals:264,assists:878,points:1142,pim:514},
  {name:"Ray Bourque",goals:410,assists:1169,points:1579,pim:1141},
  {name:"Chris Chelios",goals:185,assists:763,points:948,pim:1891},
  {name:"Scott Stevens",goals:196,assists:712,points:908,pim:2785},
  {name:"Zdeno Chara",goals:209,assists:471,points:680,pim:2085},
  {name:"Duncan Keith",goals:106,assists:540,points:646,pim:736},
  {name:"Shea Weber",goals:224,assists:365,points:589,pim:1229},
  {name:"Victor Hedman",goals:150,assists:500,points:650,pim:680},
  {name:"Erik Karlsson",goals:181,assists:640,points:821,pim:430},
  {name:"Brian Leetch",goals:247,assists:781,points:1028,pim:1242},

  // --- SOLID CAREER PLAYERS (GENERATED, REALISTIC) ---
// ---- ADDITIONAL NHL PLAYERS (REAL NAMES, GENERATED STATS) ----
{name:"Jonathan Toews",goals:372,assists:511,points:883,pim:526},
{name:"Corey Perry",goals:421,assists:493,points:914,pim:1228},
{name:"Ryan Getzlaf",goals:282,assists:737,points:1019,pim:846},
{name:"Eric Staal",goals:441,assists:603,points:1044,pim:1036},
{name:"John Tavares",goals:447,assists:590,points:1037,pim:490},
{name:"Jamie Benn",goals:371,assists:452,points:823,pim:688},
{name:"Steven Stamkos",goals:566,assists:604,points:1170,pim:840},
{name:"Brent Burns",goals:261,assists:595,points:856,pim:1000},
{name:"Drew Doughty",goals:156,assists:495,points:651,pim:722},
{name:"Roman Josi",goals:170,assists:503,points:673,pim:460},

{name:"Alex Pietrangelo",goals:160,assists:470,points:630,pim:520},
{name:"Victor Hedman",goals:150,assists:500,points:650,pim:680},
{name:"Ryan Suter",goals:106,assists:369,points:475,pim:540},
{name:"Shea Theodore",goals:83,assists:285,points:368,pim:210},
{name:"Morgan Rielly",goals:91,assists:374,points:465,pim:300},

{name:"Zach Parise",goals:400,assists:393,points:793,pim:620},
{name:"Phil Kessel",goals:413,assists:579,points:992,pim:462},
{name:"Blake Wheeler",goals:321,assists:550,points:871,pim:588},
{name:"Jakub Voracek",goals:223,assists:584,points:807,pim:460},
{name:"Mats Zuccarello",goals:193,assists:405,points:598,pim:320},

{name:"Patrick Sharp",goals:287,assists:331,points:618,pim:460},
{name:"Marian Hossa",goals:525,assists:609,points:1134,pim:1100},
{name:"Ilya Kovalchuk",goals:443,assists:433,points:876,pim:920},
{name:"Paul Stastny",goals:293,assists:531,points:824,pim:420},
{name:"Vincent Lecavalier",goals:421,assists:528,points:949,pim:864},

{name:"Taylor Hall",goals:281,assists:424,points:705,pim:398},
{name:"Claude Lemieux",goals:379,assists:433,points:812,pim:1215},
{name:"Theo Fleury",goals:455,assists:635,points:1090,pim:1840},
{name:"Keith Tkachuk",goals:538,assists:527,points:1065,pim:2089},
{name:"Brendan Shanahan",goals:656,assists:698,points:1354,pim:2489},

{name:"Gary Roberts",goals:438,assists:469,points:907,pim:1700},
{name:"Rick Tocchet",goals:440,assists:512,points:952,pim:2972},
{name:"Jeremy Roenick",goals:513,assists:703,points:1216,pim:1463},
{name:"Pierre Turgeon",goals:515,assists:812,points:1327,pim:452},
{name:"Pat Verbeek",goals:522,assists:541,points:1063,pim:2905},

// ---- MORE NHL PLAYERS (REAL NAMES, GENERATED-REALISTIC STATS) ----
{name:"Sebastian Aho",goals:252,assists:331,points:583,pim:280},
{name:"Mikko Rantanen",goals:286,assists:356,points:642,pim:320},
{name:"Mark Stone",goals:214,assists:371,points:585,pim:360},
{name:"Jack Eichel",goals:221,assists:324,points:545,pim:260},
{name:"Brayden Point",goals:243,assists:274,points:517,pim:220},
{name:"Johnny Gaudreau",goals:243,assists:405,points:648,pim:160},
{name:"Matthew Tkachuk",goals:261,assists:324,points:585,pim:510},
{name:"Elias Pettersson",goals:178,assists:297,points:475,pim:210},
{name:"Aleksander Barkov",goals:243,assists:466,points:709,pim:350},
{name:"Kyle Connor",goals:281,assists:270,points:551,pim:160},

{name:"Jason Robertson",goals:176,assists:254,points:430,pim:180},
{name:"Artemi Panarin",goals:261,assists:482,points:743,pim:300},
{name:"Timo Meier",goals:227,assists:206,points:433,pim:420},
{name:"Kevin Fiala",goals:198,assists:252,points:450,pim:240},
{name:"Claude Giroux",goals:365,assists:697,points:1062,pim:900},

{name:"Joe Pavelski",goals:476,assists:592,points:1068,pim:520},
{name:"Patrice Brisebois",goals:103,assists:321,points:424,pim:1020},
{name:"Ryan Kesler",goals:258,assists:335,points:593,pim:1024},
{name:"Bo Horvat",goals:235,assists:208,points:443,pim:360},
{name:"Sean Couturier",goals:192,assists:326,points:518,pim:480},

{name:"Evander Kane",goals:326,assists:246,points:572,pim:1530},
{name:"Nazem Kadri",goals:260,assists:340,points:600,pim:760},
{name:"David Backes",goals:248,assists:248,points:496,pim:1200},
{name:"Andrew Ladd",goals:256,assists:294,points:550,pim:600},
{name:"Milan Lucic",goals:233,assists:356,points:589,pim:1250},

{name:"Ryan Smyth",goals:386,assists:455,points:841,pim:1240},
{name:"Shawn Horcoff",goals:186,assists:325,points:511,pim:680},
{name:"Rod Brind'Amour",goals:452,assists:732,points:1184,pim:1460},
{name:"Eric Lindros",goals:372,assists:493,points:865,pim:1398},
{name:"Mark Recchi",goals:577,assists:956,points:1533,pim:1214},

{name:"Doug Gilmour",goals:450,assists:964,points:1414,pim:1400},
{name:"Glenn Anderson",goals:498,assists:602,points:1100,pim:1120},
{name:"Lanny McDonald",goals:500,assists:506,points:1006,pim:1000},
{name:"Brian Trottier",goals:524,assists:901,points:1425,pim:1325},
{name:"Denis Savard",goals:473,assists:865,points:1338,pim:738},

{name:"Sergei Fedorov",goals:483,assists:696,points:1179,pim:706},
{name:"Mats Sundin",goals:564,assists:785,points:1349,pim:1090},
{name:"Pat LaFontaine",goals:468,assists:545,points:1013,pim:453},
{name:"Vincent Damphousse",goals:432,assists:773,points:1205,pim:900},
{name:"Alex Kovalev",goals:430,assists:599,points:1029,pim:1100},

{name:"Alex DeBrincat",goals:225,assists:222,points:447,pim:180},
{name:"William Nylander",goals:240,assists:235,points:475,pim:200},
{name:"Brandon Saad",goals:260,assists:248,points:508,pim:520},
{name:"Jeff Skinner",goals:357,assists:293,points:650,pim:380},
{name:"Max Pacioretty",goals:330,assists:323,points:653,pim:400},

{name:"Tyler Seguin",goals:350,assists:415,points:765,pim:460},
{name:"Logan Couture",goals:323,assists:378,points:701,pim:540},
{name:"Jordan Eberle",goals:316,assists:384,points:700,pim:300},
{name:"Jakob Silfverberg",goals:170,assists:206,points:376,pim:240},
{name:"Nino Niederreiter",goals:214,assists:236,points:450,pim:380},

{name:"Kyle Palmieri",goals:275,assists:245,points:520,pim:460},
{name:"Reilly Smith",goals:224,assists:309,points:533,pim:300},
{name:"Tomas Hertl",goals:230,assists:239,points:469,pim:340},
{name:"Brock Boeser",goals:204,assists:226,points:430,pim:190},
{name:"Andrei Svechnikov",goals:192,assists:196,points:388,pim:420},

{name:"Zach Hyman",goals:235,assists:202,points:437,pim:460},
{name:"Ryan Nugent-Hopkins",goals:275,assists:478,points:753,pim:300},
{name:"Matt Duchene",goals:342,assists:378,points:720,pim:420},
{name:"Mika Zibanejad",goals:303,assists:343,points:646,pim:360},
{name:"Chris Kreider",goals:368,assists:239,points:607,pim:620},

{name:"Paul Kariya",goals:402,assists:587,points:989,pim:274},
{name:"Scott Gomez",goals:181,assists:576,points:757,pim:430},
{name:"Valeri Bure",goals:334,assists:425,points:759,pim:440},
{name:"Alexei Yashin",goals:337,assists:444,points:781,pim:784},
{name:"Olli Jokinen",goals:321,assists:428,points:749,pim:1000},

{name:"Tomas Plekanec",goals:233,assists:375,points:608,pim:520},
{name:"Martin St. Louis",goals:391,assists:642,points:1033,pim:524},
{name:"Brad Richards",goals:298,assists:634,points:932,pim:600},
{name:"Simon Gagne",goals:264,assists:291,points:555,pim:390},
{name:"Mike Ribeiro",goals:243,assists:476,points:719,pim:420},

{name:"Jason Spezza",goals:363,assists:632,points:995,pim:680},
{name:"Petr Sykora",goals:323,assists:398,points:721,pim:420},
{name:"Vinny Prospal",goals:256,assists:509,points:765,pim:430},

{name:"Joe Nieuwendyk",goals:564,assists:564,points:1128,pim:1240},
{name:"Pierre Larouche",goals:375,assists:508,points:883,pim:510}
];

// Auto-generate remaining players to reach 150
while (players.length < 150) {
  const base = players.length + 1;
  const goals = Math.floor(120 + Math.random()*350);
  const assists = Math.floor(200 + Math.random()*450);
  const points = goals + assists;
  const pim = Math.floor(200 + Math.random()*1400);

  players.push({
    name: `NHL Skater ${base}`,
    goals,
    assists,
    points,
    pim
  });
}