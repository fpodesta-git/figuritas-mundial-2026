// Panini FIFA World Cup 2026™ Official Sticker Collection
// Structure based on the actual Panini 2026 album

const ALBUM_DATA = {
  title: "FIFA World Cup 2026™",
  sections: [
    {
      id: "intro",
      name: "Introducción",
      color: "#1a237e",
      stickers: [
        { n: 1,  desc: "Presentación del álbum" },
        { n: 2,  desc: "FIFA World Cup 2026™ Logo", shiny: true },
        { n: 3,  desc: "Mascota Oficial", shiny: true },
        { n: 4,  desc: "El Trofeo FIFA", shiny: true },
        { n: 5,  desc: "Historia del Mundial" },
        { n: 6,  desc: "Historia del Mundial" },
        { n: 7,  desc: "Países anfitriones: USA" },
        { n: 8,  desc: "Países anfitriones: Canadá" },
        { n: 9,  desc: "Países anfitriones: México" },
        { n: 10, desc: "Mapa de sedes" },
      ]
    },
    {
      id: "sedes",
      name: "Sedes y Estadios",
      color: "#37474f",
      stickers: [
        { n: 11, desc: "SoFi Stadium - Los Ángeles" },
        { n: 12, desc: "SoFi Stadium - Los Ángeles" },
        { n: 13, desc: "MetLife Stadium - Nueva York/New Jersey" },
        { n: 14, desc: "MetLife Stadium - Nueva York/New Jersey" },
        { n: 15, desc: "AT&T Stadium - Dallas" },
        { n: 16, desc: "AT&T Stadium - Dallas" },
        { n: 17, desc: "NRG Stadium - Houston" },
        { n: 18, desc: "NRG Stadium - Houston" },
        { n: 19, desc: "Levi's Stadium - San Francisco" },
        { n: 20, desc: "Levi's Stadium - San Francisco" },
        { n: 21, desc: "Arrowhead Stadium - Kansas City" },
        { n: 22, desc: "Arrowhead Stadium - Kansas City" },
        { n: 23, desc: "Lincoln Financial Field - Filadelfia" },
        { n: 24, desc: "Lincoln Financial Field - Filadelfia" },
        { n: 25, desc: "Empower Field - Denver" },
        { n: 26, desc: "Empower Field - Denver" },
        { n: 27, desc: "Gillette Stadium - Boston" },
        { n: 28, desc: "Gillette Stadium - Boston" },
        { n: 29, desc: "Seattle - Lumen Field" },
        { n: 30, desc: "Seattle - Lumen Field" },
        { n: 31, desc: "BC Place - Vancouver" },
        { n: 32, desc: "BC Place - Vancouver" },
        { n: 33, desc: "BMO Field - Toronto" },
        { n: 34, desc: "BMO Field - Toronto" },
        { n: 35, desc: "Estadio Azteca - Ciudad de México" },
        { n: 36, desc: "Estadio Azteca - Ciudad de México" },
        { n: 37, desc: "Estadio Guadalajara - Guadalajara" },
        { n: 38, desc: "Estadio Guadalajara - Guadalajara" },
        { n: 39, desc: "Estadio BBVA - Monterrey" },
        { n: 40, desc: "Estadio BBVA - Monterrey" },
        { n: 41, desc: "Hard Rock Stadium - Miami" },
        { n: 42, desc: "Hard Rock Stadium - Miami" },
        { n: 43, desc: "Mercedes-Benz Stadium - Atlanta" },
        { n: 44, desc: "Mercedes-Benz Stadium - Atlanta" },
        { n: 45, desc: "Allegiant Stadium - Las Vegas" },
        { n: 46, desc: "Allegiant Stadium - Las Vegas" },
        { n: 47, desc: "Globe Life Field - Arlington" },
        { n: 48, desc: "Globe Life Field - Arlington" },
        { n: 49, desc: "Panorama de sedes" },
        { n: 50, desc: "Panorama de sedes" },
      ]
    }
  ],
  groups: [
    {
      id: "grupo_a", name: "Grupo A", color: "#b71c1c",
      teams: [
        {
          id: "mex", name: "México", flag: "🇲🇽", confederation: "CONCACAF",
          start: 51,
          players: ["Ochoa","Sánchez","Moreno","Montes","Gallardo","Herrera","Álvarez","Lozano","Vega","Martín","Antuna"]
        },
        {
          id: "bel", name: "Bélgica", flag: "🇧🇪", confederation: "UEFA",
          start: 64,
          players: ["Casteels","Alderweireld","Vertonghen","Castagne","Tielemans","Witsel","De Bruyne","Mertens","Lukaku","Batshuayi","Carrasco"]
        },
        {
          id: "sen", name: "Senegal", flag: "🇸🇳", confederation: "CAF",
          start: 77,
          players: ["Mendy","Koulibaly","Diallo","Jakobs","Kouyaté","Gueye","Diatta","Sarr","Mané","Dia","Diedhiou"]
        },
        {
          id: "jpn", name: "Japón", flag: "🇯🇵", confederation: "AFC",
          start: 90,
          players: ["Gonda","Yoshida","Tomiyasu","Nagatomo","Endo","Morita","Doan","Kubo","Minamino","Ueda","Maeda"]
        }
      ]
    },
    {
      id: "grupo_b", name: "Grupo B", color: "#1b5e20",
      teams: [
        {
          id: "usa", name: "Estados Unidos", flag: "🇺🇸", confederation: "CONCACAF",
          start: 103,
          players: ["Turner","Zimmerman","Ream","Robinson","Adams","McKennie","Reyna","Pulisic","Weah","Ferreira","Balogun"]
        },
        {
          id: "cro", name: "Croacia", flag: "🇭🇷", confederation: "UEFA",
          start: 116,
          players: ["Livaković","Vida","Lovren","Gvardiol","Brozović","Modrić","Kovačić","Perišić","Vlašić","Petković","Kramarić"]
        },
        {
          id: "mar", name: "Marruecos", flag: "🇲🇦", confederation: "CAF",
          start: 129,
          players: ["Bono","Hakimi","Aguerd","Saiss","Mazraoui","Ounahi","Amrabat","Ziyech","Boufal","En-Nesyri","Sabiri"]
        },
        {
          id: "kor", name: "Corea del Sur", flag: "🇰🇷", confederation: "AFC",
          start: 142,
          players: ["Kim S.","Kim M.","Kim Y.","Lee Y.","Jung","Son","Lee J.","Hwang I.","Hwang H.","Cho","Kwon"]
        }
      ]
    },
    {
      id: "grupo_c", name: "Grupo C", color: "#0d47a1",
      teams: [
        {
          id: "can", name: "Canadá", flag: "🇨🇦", confederation: "CONCACAF",
          start: 155,
          players: ["Borjan","Johnston","Vitória","Laryea","Hutchinson","Eustáquio","Buchanan","Davies","David","Cavallini","Osorio"]
        },
        {
          id: "por", name: "Portugal", flag: "🇵🇹", confederation: "UEFA",
          start: 168,
          players: ["Costa","Cancelo","Pepe","Rúben Dias","Guerreiro","Palhinha","Vitinha","Bernardo","B.Fernandes","Ronaldo","Leão"]
        },
        {
          id: "aus", name: "Australia", flag: "🇦🇺", confederation: "AFC",
          start: 181,
          players: ["Ryan","Degenek","Souttar","Rowles","Behich","Mooy","Irvine","Leckie","McGree","Hrustic","Duke"]
        },
        {
          id: "col", name: "Colombia", flag: "🇨🇴", confederation: "CONMEBOL",
          start: 194,
          players: ["Vargas","Muñoz","Sánchez","Mina","Mojica","Barrios","Lerma","Cuadrado","James","Díaz","Córdoba"]
        }
      ]
    },
    {
      id: "grupo_d", name: "Grupo D", color: "#e65100",
      teams: [
        {
          id: "bra", name: "Brasil", flag: "🇧🇷", confederation: "CONMEBOL",
          start: 207,
          players: ["Alisson","Danilo","Marquinhos","Silva","Alex Sandro","Casemiro","Paquetá","Raphinha","Neymar","Vinicius Jr.","Rodrygo"]
        },
        {
          id: "den", name: "Dinamarca", flag: "🇩🇰", confederation: "UEFA",
          start: 220,
          players: ["Schmeichel","Andersen","Christensen","Maehle","Højbjerg","Eriksen","Delaney","Wind","Damsgaard","Cornelius","Lindstrøm"]
        },
        {
          id: "nga", name: "Nigeria", flag: "🇳🇬", confederation: "CAF",
          start: 233,
          players: ["Uzoho","Ola Aina","Ekong","Troost-Ekong","Zaidu","Ndidi","Aribo","Iwobi","Lookman","Osimhen","Chukwueze"]
        },
        {
          id: "jor", name: "Jordania", flag: "🇯🇴", confederation: "AFC",
          start: 246,
          players: ["Shafy","Khraisat","Al-Rawabdeh","Taha","Alnawas","Bani Attiah","Zyod","Al-Dmeiri","Barakat","Al-Tamari","Musa"]
        }
      ]
    },
    {
      id: "grupo_e", name: "Grupo E", color: "#880e4f",
      teams: [
        {
          id: "arg", name: "Argentina", flag: "🇦🇷", confederation: "CONMEBOL",
          start: 259,
          players: ["Martínez E.","Molina","Romero","Otamendi","Acuña","De Paul","Enzo","Mac Allister","Di María","Álvarez","Messi"]
        },
        {
          id: "sui", name: "Suiza", flag: "🇨🇭", confederation: "UEFA",
          start: 272,
          players: ["Sommer","Widmer","Akanji","Elvedi","Ricardo","Freuler","Granit Xhaka","Vargas","Ndoye","Shaqiri","Embolo"]
        },
        {
          id: "egy", name: "Egipto", flag: "🇪🇬", confederation: "CAF",
          start: 285,
          players: ["El Shenawy","Hegazy","El Wensh","Farag","Mohamed Hany","Hamdi","Elneny","Zizo","Salah","Trezeguet","Mostafa"]
        },
        {
          id: "bol", name: "Bolivia", flag: "🇧🇴", confederation: "CONMEBOL",
          start: 298,
          players: ["Lampe","Jusino","Quinteros","Bejarano","Sagredo","Saucedo","Ramallo","Arce","Vaca","Algarañaz","Fernández"]
        }
      ]
    },
    {
      id: "grupo_f", name: "Grupo F", color: "#004d40",
      teams: [
        {
          id: "esp", name: "España", flag: "🇪🇸", confederation: "UEFA",
          start: 311,
          players: ["Unai Simón","Carvajal","Laporte","Pau Torres","Alba","Rodri","Pedri","Gavi","Yamal","Morata","Torres"]
        },
        {
          id: "irn", name: "Irán", flag: "🇮🇷", confederation: "AFC",
          start: 324,
          players: ["Beiranvand","Moharrami","Hosseini","Pouraliganji","Hajsafi","Ezatolahi","Nourollahi","Gholizadeh","Taremi","Azmoun","Jahanbakhsh"]
        },
        {
          id: "cmr", name: "Camerún", flag: "🇨🇲", confederation: "CAF",
          start: 337,
          players: ["Onana","Fai","Castelletto","Ngadeu","Tolo","Anguissa","Oum Gouet","Choupo-Moting","Mbeumo","Aboubakar","Ekambi"]
        },
        {
          id: "ecu", name: "Ecuador", flag: "🇪🇨", confederation: "CONMEBOL",
          start: 350,
          players: ["Galíndez","Preciado","Pacho","Hincapié","Espinoza","Gruezo","Caicedo","Plata","Sarmiento","Valencia","Enner V."]
        }
      ]
    },
    {
      id: "grupo_g", name: "Grupo G", color: "#1a237e",
      teams: [
        {
          id: "fra", name: "Francia", flag: "🇫🇷", confederation: "UEFA",
          start: 363,
          players: ["Maignan","Pavard","Varane","Upamecano","T.Hernández","Tchouaméni","Rabiot","Griezmann","Dembélé","Giroud","Mbappé"]
        },
        {
          id: "srb", name: "Serbia", flag: "🇷🇸", confederation: "UEFA",
          start: 376,
          players: ["Rajković","Milenkovic","Pavlović","Veljković","Živković","Lukić","Tošić","S.Milinković-Savić","V.Milinković-Savić","Mitrović","Vlahović"]
        },
        {
          id: "tun", name: "Túnez", flag: "🇹🇳", confederation: "CAF",
          start: 389,
          players: ["Dahmen","Bronn","Meriah","Ben Romdhane","Abdi","Ben Slimane","Laidouni","Msakni","Sliti","Jaziri","Khazri"]
        },
        {
          id: "ven", name: "Venezuela", flag: "🇻🇪", confederation: "CONMEBOL",
          start: 402,
          players: ["Romo","Mago","Osorio","González","Navarro","Herrera","Velásquez","Soteldo","Bello","Rondón","Martínez"]
        }
      ]
    },
    {
      id: "grupo_h", name: "Grupo H", color: "#bf360c",
      teams: [
        {
          id: "eng", name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", confederation: "UEFA",
          start: 415,
          players: ["Pickford","Alexander-Arnold","Maguire","Stones","Shaw","Rice","Bellingham","Saka","Foden","Kane","Rashford"]
        },
        {
          id: "aut", name: "Austria", flag: "🇦🇹", confederation: "UEFA",
          start: 428,
          players: ["Pentz","Lainer","Dragovic","Hinteregger","Alaba","Laimer","Grillitsch","Sabitzer","Baumgartner","Arnautovic","Kalajdzic"]
        },
        {
          id: "rsa", name: "Sudáfrica", flag: "🇿🇦", confederation: "CAF",
          start: 441,
          players: ["Williams","Xulu","Tau","Mokoena","Mudau","Notoane","Zungu","Shalulile","Dolly","Mhlongo","Mothiba"]
        },
        {
          id: "uru", name: "Uruguay", flag: "🇺🇾", confederation: "CONMEBOL",
          start: 454,
          players: ["Rochet","Nández","Giménez","Godín","Olivera","Bentancur","Valverde","De Arrascaeta","Cavani","Suárez","Núñez"]
        }
      ]
    },
    {
      id: "grupo_i", name: "Grupo I", color: "#212121",
      teams: [
        {
          id: "ger", name: "Alemania", flag: "🇩🇪", confederation: "UEFA",
          start: 467,
          players: ["Neuer","Kimmich","Rüdiger","Schlotterbeck","Raum","Goretzka","Gündoğan","Gnabry","Müller","Havertz","Wirtz"]
        },
        {
          id: "hun", name: "Hungría", flag: "🇭🇺", confederation: "UEFA",
          start: 480,
          players: ["Gulácsi","Botka","Orbán","Willi Orbán","Fiola","Kerkez","Nagy","Kleinheisler","Sallai","Szoboszlai","Ádám"]
        },
        {
          id: "gha", name: "Ghana", flag: "🇬🇭", confederation: "CAF",
          start: 493,
          players: ["Wollacott","Lamptey","Salisu","Amartey","Mensah","Partey","Samed","Ayew J.","Ayew A.","Kudus","Opoku"]
        },
        {
          id: "nzl", name: "Nueva Zelanda", flag: "🇳🇿", confederation: "OFC",
          start: 506,
          players: ["Paulsen","Bozhikov","Boxall","Daley","Cacace","Waine","Garbett","De Vries","Wood","Barbarouses","Antz"]
        }
      ]
    },
    {
      id: "grupo_j", name: "Grupo J", color: "#e65100",
      teams: [
        {
          id: "ned", name: "Países Bajos", flag: "🇳🇱", confederation: "UEFA",
          start: 519,
          players: ["Flekken","Dumfries","De Vrij","Van Dijk","Blind","De Jong F.","De Jong L.","Bergwijn","Gakpo","Depay","Zirkzee"]
        },
        {
          id: "sco", name: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", confederation: "UEFA",
          start: 532,
          players: ["Gordon","O'Donnell","McTominay","Hanley","Robertson","Jack","Ferguson","McGinn","Christie","Adams","Dykes"]
        },
        {
          id: "ksa", name: "Arabia Saudita", flag: "🇸🇦", confederation: "AFC",
          start: 545,
          players: ["Al-Owais","Al-Tambakti","Al-Amri","Abdulhamid","Al-Shahrani","Al-Malki","Al-Dawsari","Kanno","Al-Shehri","Al-Buraikan","Bahebri"]
        },
        {
          id: "pan", name: "Panamá", flag: "🇵🇦", confederation: "CONCACAF",
          start: 558,
          players: ["Penedo","Murillo","Millón","Davis","Blackman","Aráuz","Carrasquilla","Godoy","Fajardo","Córdoba","Tejada"]
        }
      ]
    },
    {
      id: "grupo_k", name: "Grupo K", color: "#4a148c",
      teams: [
        {
          id: "rou", name: "Rumania", flag: "🇷🇴", confederation: "UEFA",
          start: 571,
          players: ["Niță","Rațiu","Drăguşin","Burcă","Bancu","Stanciu","Marin","Man","Mihăilă","Pușcaș","Drăguș"]
        },
        {
          id: "tur", name: "Turquía", flag: "🇹🇷", confederation: "UEFA",
          start: 584,
          players: ["Çakır","Müldür","Söyüncü","Demiral","Zeki Çelik","Kalkavan","Özcan","Arda Güler","Yılmaz","Aktürkoğlu","Tosun"]
        },
        {
          id: "civ", name: "Costa de Marfil", flag: "🇨🇮", confederation: "CAF",
          start: 597,
          players: ["Sangaré G.","Aurier","Boly","Deli","Koné","Sangaré I.","Gbamin","Cornet","Gradel","Péan","Haller"]
        },
        {
          id: "hon", name: "Honduras", flag: "🇭🇳", confederation: "CONCACAF",
          start: 610,
          players: ["Moreira","Figueroa","Salinas","Meléndez","Bengtson","Álvarez","Aceituno","Bengtson R.","Pereira","Quioto","Rivas"]
        }
      ]
    },
    {
      id: "grupo_l", name: "Grupo L", color: "#01579b",
      teams: [
        {
          id: "uzb", name: "Uzbekistán", flag: "🇺🇿", confederation: "AFC",
          start: 623,
          players: ["Nesterov","Ashurmatov","Jaloliddinov","Khaytov","Yusupov","Shomurodov","Saidov","Tursunov","Masharipov","Djeparov","Botirov"]
        },
        {
          id: "irq", name: "Iraq", flag: "🇮🇶", confederation: "AFC",
          start: 636,
          players: ["Doham","Salam","Ameen","Hamad","Saad","Karrar","Fadhil","Al-Shammari","Al-Hashimi","Al-Khalidi","Bashar"]
        },
        {
          id: "jam", name: "Jamaica", flag: "🇯🇲", confederation: "CONCACAF",
          start: 649,
          players: ["Blake","Latibeaudiere","Mitchell","Morrison","McAnuff","Bailey","Antonio","Nicholson","Junior Flemmings","Lawrence","Green"]
        },
        {
          id: "cri", name: "Costa Rica", flag: "🇨🇷", confederation: "CONCACAF",
          start: 662,
          players: ["Navas","Duarte","González","Calvo","Oviedo","Borges","Tejeda","Campbell","Torres","Contreras","Ruiz"]
        }
      ]
    }
  ]
};

// Build flat sticker lookup: stickerNumber -> sticker object
function buildStickerMap() {
  const map = {};

  // Intro + sedes sections
  for (const section of ALBUM_DATA.sections) {
    for (const s of section.stickers) {
      map[s.n] = {
        n: s.n,
        desc: s.desc,
        shiny: s.shiny || false,
        sectionId: section.id,
        sectionName: section.name,
        teamId: null,
        teamName: null,
        localN: null
      };
    }
  }

  // Team stickers: 13 per team (1 badge shiny + 1 squad + 11 players)
  for (const group of ALBUM_DATA.groups) {
    for (const team of group.teams) {
      const s = team.start;
      // Badge (shiny)
      map[s] = {
        n: s, desc: `${team.name} - Escudo`, shiny: true,
        sectionId: group.id, sectionName: group.name,
        teamId: team.id, teamName: team.name, localN: 1
      };
      // Squad photo
      map[s + 1] = {
        n: s + 1, desc: `${team.name} - Foto del equipo`, shiny: false,
        sectionId: group.id, sectionName: group.name,
        teamId: team.id, teamName: team.name, localN: 2
      };
      // Players
      for (let i = 0; i < 11; i++) {
        map[s + 2 + i] = {
          n: s + 2 + i,
          desc: `${team.name} - ${team.players[i] || "Jugador " + (i + 1)}`,
          shiny: false,
          sectionId: group.id,
          sectionName: group.name,
          teamId: team.id,
          teamName: team.name,
          localN: i + 3
        };
      }
    }
  }

  return map;
}

// Build team name → team object lookup (supports multiple language variants)
function buildTeamLookup() {
  const lookup = {};
  const aliases = {
    "argentina": "arg", "arg": "arg",
    "brasil": "bra", "brazil": "bra", "bra": "bra",
    "colombia": "col", "col": "col",
    "uruguay": "uru", "uru": "uru",
    "ecuador": "ecu", "ecu": "ecu",
    "venezuela": "ven", "ven": "ven",
    "bolivia": "bol", "bol": "bol",
    "mexico": "mex", "méxico": "mex", "mex": "mex",
    "estados unidos": "usa", "usa": "usa", "eeuu": "usa", "estados_unidos": "usa",
    "canada": "can", "canadá": "can", "can": "can",
    "panama": "pan", "panamá": "pan", "pan": "pan",
    "jamaica": "jam", "jam": "jam",
    "honduras": "hon", "hon": "hon",
    "costa rica": "cri", "costa_rica": "cri", "cri": "cri",
    "españa": "esp", "spain": "esp", "esp": "esp",
    "francia": "fra", "france": "fra", "fra": "fra",
    "inglaterra": "eng", "england": "eng", "ing": "eng", "eng": "eng",
    "alemania": "ger", "germany": "ger", "ger": "ger",
    "portugal": "por", "por": "por",
    "paises bajos": "ned", "países bajos": "ned", "holanda": "ned", "ned": "ned",
    "belgica": "bel", "bélgica": "bel", "bel": "bel",
    "croacia": "cro", "croatia": "cro", "cro": "cro",
    "suiza": "sui", "switzerland": "sui", "sui": "sui",
    "austria": "aut", "aut": "aut",
    "serbia": "srb", "srb": "srb",
    "hungria": "hun", "hungría": "hun", "hun": "hun",
    "dinamarca": "den", "denmark": "den", "den": "den",
    "escocia": "sco", "scotland": "sco", "sco": "sco",
    "rumania": "rou", "rumanía": "rou", "rou": "rou",
    "turquia": "tur", "turquía": "tur", "tur": "tur",
    "marruecos": "mar", "morocco": "mar", "mar": "mar",
    "senegal": "sen", "sen": "sen",
    "egipto": "egy", "egypt": "egy", "egy": "egy",
    "costa de marfil": "civ", "marfil": "civ", "ivory coast": "civ", "civ": "civ",
    "ghana": "gha", "gha": "gha",
    "nigeria": "nga", "nga": "nga",
    "camerun": "cmr", "camerún": "cmr", "cameroon": "cmr", "cmr": "cmr",
    "tunez": "tun", "túnez": "tun", "tunezez": "tun", "tun": "tun",
    "sudafrica": "rsa", "sudáfrica": "rsa", "south africa": "rsa", "rsa": "rsa",
    "japon": "jpn", "japón": "jpn", "japan": "jpn", "jpn": "jpn",
    "corea del sur": "kor", "corea": "kor", "south korea": "kor", "kor": "kor",
    "iran": "irn", "irán": "irn", "irn": "irn",
    "australia": "aus", "aus": "aus",
    "arabia saudita": "ksa", "arabia_saudita": "ksa", "arabia saudi": "ksa", "ksa": "ksa",
    "jordania": "jor", "jordan": "jor", "jor": "jor",
    "uzbekistan": "uzb", "uzbekistán": "uzb", "uzb": "uzb",
    "irak": "irq", "iraq": "irq", "irq": "irq",
    "nueva zelanda": "nzl", "nueva_zelanda": "nzl", "new zealand": "nzl", "nzl": "nzl",
  };

  // Map alias -> team start sticker
  const teamStartMap = {};
  for (const group of ALBUM_DATA.groups) {
    for (const team of group.teams) {
      teamStartMap[team.id] = team.start;
    }
  }

  for (const [alias, teamId] of Object.entries(aliases)) {
    lookup[alias] = teamStartMap[teamId] ? { id: teamId, start: teamStartMap[teamId] } : null;
  }

  return lookup;
}

const STICKER_MAP = buildStickerMap();
const TEAM_LOOKUP = buildTeamLookup();
const TOTAL_STICKERS = Object.keys(STICKER_MAP).length;
