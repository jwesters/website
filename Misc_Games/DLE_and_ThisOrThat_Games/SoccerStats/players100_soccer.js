// 100 POPULAR SOCCER PLAYERS – REAL NAMES, REALISTIC CAREER-LIKE TOTALS
// fields: goals, assists, apps (appearances / games played)

const players = [
  // Modern icons
  { name: "Lionel Messi", goals: 820, assists: 360, apps: 1050 },
  { name: "Cristiano Ronaldo", goals: 880, assists: 250, apps: 1200 },
  { name: "Neymar", goals: 450, assists: 280, apps: 650 },
  { name: "Kylian Mbappé", goals: 310, assists: 140, apps: 450 },
  { name: "Robert Lewandowski", goals: 650, assists: 160, apps: 900 },
  { name: "Luis Suárez", goals: 540, assists: 220, apps: 850 },
  { name: "Karim Benzema", goals: 470, assists: 210, apps: 950 },
  { name: "Zlatan Ibrahimović", goals: 570, assists: 190, apps: 950 },
  { name: "Sergio Agüero", goals: 430, assists: 120, apps: 780 },
  { name: "Harry Kane", goals: 360, assists: 90, apps: 600 },

  // Great attackers / creators
  { name: "Kevin De Bruyne", goals: 160, assists: 260, apps: 600 },
  { name: "Mohamed Salah", goals: 320, assists: 140, apps: 700 },
  { name: "Erling Haaland", goals: 240, assists: 45, apps: 320 },
  { name: "Sadio Mané", goals: 230, assists: 110, apps: 600 },
  { name: "Eden Hazard", goals: 170, assists: 150, apps: 620 },
  { name: "Antoine Griezmann", goals: 290, assists: 140, apps: 850 },
  { name: "Thomas Müller", goals: 250, assists: 260, apps: 850 },
  { name: "Arjen Robben", goals: 210, assists: 120, apps: 600 },
  { name: "Franck Ribéry", goals: 160, assists: 210, apps: 700 },
  { name: "Gareth Bale", goals: 190, assists: 120, apps: 550 },

  // Legends (attack / midfield)
  { name: "Pelé", goals: 760, assists: 220, apps: 820 },
  { name: "Diego Maradona", goals: 350, assists: 210, apps: 600 },
  { name: "Johan Cruyff", goals: 340, assists: 240, apps: 620 },
  { name: "Alfredo Di Stéfano", goals: 380, assists: 180, apps: 650 },
  { name: "Ferenc Puskás", goals: 610, assists: 170, apps: 720 },
  { name: "Gerd Müller", goals: 565, assists: 120, apps: 680 },
  { name: "Eusébio", goals: 475, assists: 150, apps: 620 },
  { name: "George Best", goals: 240, assists: 130, apps: 520 },
  { name: "Ronaldinho", goals: 210, assists: 170, apps: 680 },
  { name: "Ronaldo Nazário", goals: 410, assists: 120, apps: 620 },

  // More elite names
  { name: "Zinedine Zidane", goals: 125, assists: 160, apps: 700 },
  { name: "Andrés Iniesta", goals: 85, assists: 160, apps: 950 },
  { name: "Xavi", goals: 110, assists: 210, apps: 950 },
  { name: "Luka Modrić", goals: 95, assists: 150, apps: 950 },
  { name: "Toni Kroos", goals: 90, assists: 160, apps: 900 },
  { name: "Steven Gerrard", goals: 190, assists: 150, apps: 850 },
  { name: "Frank Lampard", goals: 300, assists: 170, apps: 950 },
  { name: "Paul Scholes", goals: 155, assists: 110, apps: 720 },
  { name: "David Beckham", goals: 130, assists: 200, apps: 800 },
  { name: "Andrea Pirlo", goals: 75, assists: 140, apps: 850 },

  // Strikers / scorers across eras
  { name: "Thierry Henry", goals: 360, assists: 175, apps: 800 },
  { name: "Raúl", goals: 400, assists: 120, apps: 950 },
  { name: "Marco van Basten", goals: 280, assists: 90, apps: 430 },
  { name: "Ruud van Nistelrooy", goals: 350, assists: 90, apps: 600 },
  { name: "Didier Drogba", goals: 300, assists: 90, apps: 750 },
  { name: "Samuel Eto'o", goals: 370, assists: 100, apps: 820 },
  { name: "David Villa", goals: 320, assists: 95, apps: 720 },
  { name: "Wayne Rooney", goals: 310, assists: 180, apps: 900 },
  { name: "Robin van Persie", goals: 260, assists: 100, apps: 650 },
  { name: "Dennis Bergkamp", goals: 210, assists: 160, apps: 740 },

  // Contemporary stars / popular names
  { name: "Son Heung-min", goals: 220, assists: 110, apps: 650 },
  { name: "Virgil van Dijk", goals: 55, assists: 25, apps: 550 },
  { name: "Sergio Ramos", goals: 130, assists: 45, apps: 950 },
  { name: "Gerard Piqué", goals: 55, assists: 20, apps: 700 },
  { name: "Dani Alves", goals: 70, assists: 160, apps: 1000 },
  { name: "Marcelo", goals: 60, assists: 110, apps: 750 },
  { name: "Philipp Lahm", goals: 25, assists: 80, apps: 650 },
  { name: "Xabi Alonso", goals: 55, assists: 75, apps: 800 },
  { name: "Bastian Schweinsteiger", goals: 75, assists: 95, apps: 750 },
  { name: "Sergio Busquets", goals: 25, assists: 65, apps: 900 },

  // Add more well-known names (filled to 100)
  { name: "Rivaldo", goals: 300, assists: 110, apps: 720 },
  { name: "Kaká", goals: 190, assists: 110, apps: 590 },
  { name: "Luis Figo", goals: 135, assists: 170, apps: 850 },
  { name: "Michael Laudrup", goals: 150, assists: 210, apps: 700 },
  { name: "Hristo Stoichkov", goals: 320, assists: 95, apps: 620 },
  { name: "Roberto Baggio", goals: 290, assists: 110, apps: 700 },
  { name: "Alessandro Del Piero", goals: 340, assists: 150, apps: 900 },
  { name: "Francesco Totti", goals: 320, assists: 210, apps: 900 },
  { name: "Gianluigi Buffon", goals: 0, assists: 0, apps: 1100 }, // (goalie; remove if you only want outfield)
  { name: "Iker Casillas", goals: 0, assists: 0, apps: 950 },   // (goalie; remove if you only want outfield)

  { name: "Sergio Agüero (Alt)", goals: 0, assists: 0, apps: 1 }, // placeholder removed below
// ---- ADDITIONAL SOCCER PLAYERS ----
{ name: "Erik ten Hag", goals: 45, assists: 60, apps: 350 }, // player career (pre-manager)
{ name: "Paulo Dybala", goals: 230, assists: 110, apps: 520 },
{ name: "Lautaro Martínez", goals: 190, assists: 75, apps: 420 },
{ name: "Ángel Di María", goals: 220, assists: 240, apps: 800 },
{ name: "Bernardo Silva", goals: 95, assists: 150, apps: 520 },

{ name: "Federico Chiesa", goals: 120, assists: 65, apps: 300 },
{ name: "Rodrygo", goals: 110, assists: 75, apps: 280 },
{ name: "Vinícius Júnior", goals: 160, assists: 140, apps: 360 },
{ name: "Riyad Mahrez", goals: 190, assists: 140, apps: 620 },
{ name: "Christian Pulisic", goals: 120, assists: 75, apps: 360 },

{ name: "Bukayo Saka", goals: 135, assists: 120, apps: 350 },
{ name: "Martin Ødegaard", goals: 95, assists: 140, apps: 330 },
{ name: "Bruno Fernandes", goals: 230, assists: 180, apps: 520 },
{ name: "Casemiro", goals: 75, assists: 60, apps: 650 },
{ name: "Joshua Kimmich", goals: 65, assists: 120, apps: 600 },

{ name: "Declan Rice", goals: 45, assists: 55, apps: 430 },
{ name: "Ilkay Gündogan", goals: 120, assists: 95, apps: 650 },
{ name: "Cesc Fàbregas", goals: 125, assists: 260, apps: 800 },
{ name: "Juan Mata", goals: 160, assists: 220, apps: 750 },
{ name: "Mesut Özil", goals: 120, assists: 280, apps: 650 },

{ name: "Edinson Cavani", goals: 430, assists: 90, apps: 780 },
{ name: "Pierre-Emerick Aubameyang", goals: 350, assists: 95, apps: 650 },
{ name: "Romelu Lukaku", goals: 380, assists: 95, apps: 700 },
{ name: "Radamel Falcao", goals: 330, assists: 65, apps: 550 },
{ name: "Fernando Torres", goals: 310, assists: 95, apps: 700 },

{ name: "Roberto Firmino", goals: 185, assists: 120, apps: 580 },
{ name: "Thomas Partey", goals: 45, assists: 55, apps: 420 },
{ name: "James Rodríguez", goals: 135, assists: 140, apps: 500 },
{ name: "Xherdan Shaqiri", goals: 125, assists: 140, apps: 650 },
{ name: "Ivan Rakitić", goals: 110, assists: 160, apps: 750 },

];

// Remove the two goalie “fun” entries and the placeholder if you want strictly outfield only:
(function cleanup() {
  const banned = new Set(["Sergio Agüero (Alt)"]);
  for (let i = players.length - 1; i >= 0; i--) {
    if (banned.has(players[i].name)) players.splice(i, 1);
  }
})();
