// Panini FIFA World Cup 2026™ - Estructura oficial del álbum

const GROUPS = [
  { id: "A", name: "Grupo A", color: "#c0392b", teams: [
      { code: "MEX", name: "México",           flag: "🇲🇽" },
      { code: "RSA", name: "Sudáfrica",         flag: "🇿🇦" },
      { code: "KOR", name: "Corea del Sur",     flag: "🇰🇷" },
      { code: "CZE", name: "Rep. Checa",        flag: "🇨🇿" },
  ]},
  { id: "B", name: "Grupo B", color: "#27ae60", teams: [
      { code: "CAN", name: "Canadá",            flag: "🇨🇦" },
      { code: "BIH", name: "Bosnia y Herz.",    flag: "🇧🇦" },
      { code: "QAT", name: "Qatar",             flag: "🇶🇦" },
      { code: "SUI", name: "Suiza",             flag: "🇨🇭" },
  ]},
  { id: "C", name: "Grupo C", color: "#2980b9", teams: [
      { code: "BRA", name: "Brasil",            flag: "🇧🇷" },
      { code: "MAR", name: "Marruecos",         flag: "🇲🇦" },
      { code: "HAI", name: "Haití",             flag: "🇭🇹" },
      { code: "SCO", name: "Escocia",           flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  ]},
  { id: "D", name: "Grupo D", color: "#8e44ad", teams: [
      { code: "USA", name: "Estados Unidos",    flag: "🇺🇸" },
      { code: "PAR", name: "Paraguay",          flag: "🇵🇾" },
      { code: "AUS", name: "Australia",         flag: "🇦🇺" },
      { code: "TUR", name: "Turquía",           flag: "🇹🇷" },
  ]},
  { id: "E", name: "Grupo E", color: "#d35400", teams: [
      { code: "GER", name: "Alemania",          flag: "🇩🇪" },
      { code: "CUW", name: "Curazao",           flag: "🇨🇼" },
      { code: "CIV", name: "Costa de Marfil",   flag: "🇨🇮" },
      { code: "ECU", name: "Ecuador",           flag: "🇪🇨" },
  ]},
  { id: "F", name: "Grupo F", color: "#16a085", teams: [
      { code: "NED", name: "Países Bajos",      flag: "🇳🇱" },
      { code: "JAP", name: "Japón",             flag: "🇯🇵" },
      { code: "SWE", name: "Suecia",            flag: "🇸🇪" },
      { code: "TUN", name: "Túnez",             flag: "🇹🇳" },
  ]},
  { id: "G", name: "Grupo G", color: "#2c3e50", teams: [
      { code: "BEL", name: "Bélgica",           flag: "🇧🇪" },
      { code: "EGY", name: "Egipto",            flag: "🇪🇬" },
      { code: "IRN", name: "Irán",              flag: "🇮🇷" },
      { code: "NZL", name: "Nueva Zelanda",     flag: "🇳🇿" },
  ]},
  { id: "H", name: "Grupo H", color: "#c0392b", teams: [
      { code: "ESP", name: "España",            flag: "🇪🇸" },
      { code: "CPV", name: "Cabo Verde",        flag: "🇨🇻" },
      { code: "KSA", name: "Arabia Saudita",    flag: "🇸🇦" },
      { code: "URU", name: "Uruguay",           flag: "🇺🇾" },
  ]},
  { id: "I", name: "Grupo I", color: "#1a237e", teams: [
      { code: "FRA", name: "Francia",           flag: "🇫🇷" },
      { code: "SEN", name: "Senegal",           flag: "🇸🇳" },
      { code: "IRQ", name: "Iraq",              flag: "🇮🇶" },
      { code: "NOR", name: "Noruega",           flag: "🇳🇴" },
  ]},
  { id: "J", name: "Grupo J", color: "#27ae60", teams: [
      { code: "ARG", name: "Argentina",         flag: "🇦🇷" },
      { code: "ALG", name: "Argelia",           flag: "🇩🇿" },
      { code: "AUT", name: "Austria",           flag: "🇦🇹" },
      { code: "JOR", name: "Jordania",          flag: "🇯🇴" },
  ]},
  { id: "K", name: "Grupo K", color: "#8e44ad", teams: [
      { code: "POR", name: "Portugal",          flag: "🇵🇹" },
      { code: "COD", name: "RD Congo",          flag: "🇨🇩" },
      { code: "UZB", name: "Uzbekistán",        flag: "🇺🇿" },
      { code: "COL", name: "Colombia",          flag: "🇨🇴" },
  ]},
  { id: "L", name: "Grupo L", color: "#d35400", teams: [
      { code: "ENG", name: "Inglaterra",        flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { code: "CRO", name: "Croacia",           flag: "🇭🇷" },
      { code: "GHA", name: "Ghana",             flag: "🇬🇭" },
      { code: "PAN", name: "Panamá",            flag: "🇵🇦" },
  ]},
];

const FW_COUNT = 19;
const CC_COUNT = 14;

function buildStickerMap() {
  const map = {};
  for (let i = 1; i <= FW_COUNT; i++) {
    const code = `FW${i}`;
    map[code] = { code, section: "FW", sectionName: "FIFA Especiales", teamCode: null, teamName: "FIFA", flag: "🏆", localN: i };
  }
  for (const group of GROUPS) {
    for (const team of group.teams) {
      for (let i = 1; i <= 20; i++) {
        const code = `${team.code}${i}`;
        map[code] = { code, section: team.code, sectionName: team.name, teamCode: team.code, teamName: team.name, flag: team.flag, localN: i, groupId: group.id, groupName: group.name, groupColor: group.color };
      }
    }
  }
  for (let i = 1; i <= CC_COUNT; i++) {
    const code = `CC${i}`;
    map[code] = { code, section: "CC", sectionName: "Coca-Cola", teamCode: null, teamName: "CC", flag: "🥤", localN: i };
  }
  return map;
}

const TEAM_LOOKUP = {
  "mexico":"MEX","méxico":"MEX","mex":"MEX",
  "sudafrica":"RSA","sudáfrica":"RSA","south africa":"RSA","rsa":"RSA",
  "corea del sur":"KOR","corea":"KOR","korea":"KOR","kor":"KOR",
  "republica checa":"CZE","república checa":"CZE","czech":"CZE","cze":"CZE",
  "canada":"CAN","canadá":"CAN","can":"CAN",
  "bosnia":"BIH","bosnia y herzegovina":"BIH","bih":"BIH",
  "qatar":"QAT","qat":"QAT",
  "suiza":"SUI","switzerland":"SUI","sui":"SUI",
  "brasil":"BRA","brazil":"BRA","bra":"BRA",
  "marruecos":"MAR","morocco":"MAR","mar":"MAR",
  "haiti":"HAI","haití":"HAI","hai":"HAI",
  "escocia":"SCO","scotland":"SCO","sco":"SCO",
  "estados unidos":"USA","eeuu":"USA","usa":"USA",
  "paraguay":"PAR","par":"PAR",
  "australia":"AUS","aus":"AUS",
  "turquia":"TUR","turquía":"TUR","turkey":"TUR","tur":"TUR",
  "alemania":"GER","germany":"GER","ger":"GER",
  "curazao":"CUW","curacao":"CUW","cuw":"CUW",
  "costa de marfil":"CIV","marfil":"CIV","ivory coast":"CIV","civ":"CIV",
  "ecuador":"ECU","ecu":"ECU",
  "paises bajos":"NED","países bajos":"NED","holanda":"NED","ned":"NED",
  "japon":"JAP","japón":"JAP","japan":"JAP","jap":"JAP",
  "suecia":"SWE","sweden":"SWE","swe":"SWE",
  "tunez":"TUN","túnez":"TUN","tunisia":"TUN","tun":"TUN",
  "belgica":"BEL","bélgica":"BEL","belgium":"BEL","bel":"BEL",
  "egipto":"EGY","egypt":"EGY","egy":"EGY",
  "iran":"IRN","irán":"IRN","irn":"IRN",
  "nueva zelanda":"NZL","new zealand":"NZL","nzl":"NZL",
  "españa":"ESP","spain":"ESP","esp":"ESP",
  "cabo verde":"CPV","cape verde":"CPV","cpv":"CPV",
  "arabia saudita":"KSA","saudi arabia":"KSA","ksa":"KSA",
  "uruguay":"URU","uru":"URU",
  "francia":"FRA","france":"FRA","fra":"FRA",
  "senegal":"SEN","sen":"SEN",
  "iraq":"IRQ","irak":"IRQ","irq":"IRQ",
  "noruega":"NOR","norway":"NOR","nor":"NOR",
  "argentina":"ARG","arg":"ARG",
  "argelia":"ALG","algeria":"ALG","alg":"ALG",
  "austria":"AUT","aut":"AUT",
  "jordania":"JOR","jordan":"JOR","jor":"JOR",
  "portugal":"POR","por":"POR",
  "rd congo":"COD","congo":"COD","dr congo":"COD","cod":"COD",
  "uzbekistan":"UZB","uzbekistán":"UZB","uzb":"UZB",
  "colombia":"COL","col":"COL",
  "inglaterra":"ENG","england":"ENG","eng":"ENG",
  "croacia":"CRO","croatia":"CRO","cro":"CRO",
  "ghana":"GHA","gha":"GHA",
  "panama":"PAN","panamá":"PAN","pan":"PAN",
};

const STICKER_MAP    = buildStickerMap();
const TOTAL_STICKERS = Object.keys(STICKER_MAP).length; // 19 FW + 960 equipos + 14 CC = 993
