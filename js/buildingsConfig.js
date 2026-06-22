(function () {
    const MODEL_LINE = "3D model vytvorený pre projekt Virtuálne Košice (vlastná tvorba).";
    const INFO_LINE = "Informácie o objekte: Wikipédia (SK).";
    const SOURCE_NOTE = MODEL_LINE + "\n" + INFO_LINE;

    window.SOURCE_NOTE_MODEL = MODEL_LINE;
    window.SOURCE_NOTE = SOURCE_NOTE;

    window.sourceNote = function sourceNote() {
        return SOURCE_NOTE;
    };

    window.formatSourceNote = function formatSourceNote() {
        return SOURCE_NOTE;
    };

    window.BUILDINGS = [
    {
        id: "historicke_model_hlavna",
        zone: "historicke-centrum",
        name: "Hlavná ulica",
        modelPath: "assets/models/Hlavna.glb",
        description: "Hlavný objekt historického centra.",
        wikiInfoSK: "Hlavná ulica je hlavná pešia a obchodná os historického centra Košíc, siahajúca od Dómu svätej Alžbety smerom na východ. Je známa pestrou štýlovou architektúrou domov z rôznych storočí.",
        wikiInfoEN: "Hlavná Street is the main pedestrian and commercial axis of Košice's historic centre, running east from St Elizabeth's Cathedral. It is known for its varied period architecture along both sides.",
        location: "Hlavná ulica, Košice",
        type: "Historická budova",
        style: "Mestská historická architektúra",
        period: "Súčasný digitálny model",
        architect: "Neuvedené",
        sourceUrl: "https://sk.wikipedia.org/wiki/Hlavn%C3%A1_uli%C4%8Da_(Ko%C5%A1ice)",
        sourceNote: sourceNote(),
        audioSk: "assets/audio/sk/hlavna.mp3",
        audioEn: "assets/audio/en/hlavna.mp3",
        modelOffset: {
            scale: "0.3 0.3 0.3",
            position: "0 0 0",
            rotation: "0 0 0"
        }
    },
    {
        id: "historicke_krizovatka",
        zone: "historicke-centrum",
        name: "Východoslovenské múzeum",
        modelPath: "assets/models/MUZEUM_NM.glb",
        description: "Záložný objekt pre historické centrum.",
        wikiInfoSK: "Východoslovenské múzeum v Košiciach je najväčšia múzejná inštitúcia na východnom Slovensku so zbierkami dejín, umenia a prírody regiónu. Sídli v historických budovách v centre mesta.",
        wikiInfoEN: "The East Slovak Museum in Košice is the largest museum institution in eastern Slovakia, with collections on regional history, art and nature. It is housed in historic buildings in the city centre.",
        location: "Historické centrum, Košice",
        type: "Historický objekt",
        style: "Mestská architektúra",
        period: "Súčasný digitálny model",
        architect: "Neuvedené",
        sourceUrl: "https://sk.wikipedia.org/wiki/V%C3%BDchodoslovensk%C3%A9_m%C3%BAzeum",
        sourceNote: sourceNote(),
        audioSk: "assets/audio/sk/muzeum.mp3",
        audioEn: "assets/audio/en/muzeum.mp3",
        modelOffset: {
            scale: "1 1 1",
            position: "0 0 0",
            rotation: "0 0 0"
        }
    },
    {
        id: "historicke_model_of_streets",
        zone: "historicke-centrum",
        name: "Hotel Gloria Palac",
        modelPath: "assets/models/pepsi.glb",
        description: "Hotel Gloria Palac *** — ubytovanie pri historickom centre Košíc.",
        wikiInfoSK: "Hotel Gloria Palac je trojhviezdičkový hotel na Bottovej 1 v Starom Meste, na okraji historického centra Košíc. Ponúka izby a apartmány, reštauráciu, kaviareň a konferenčné priestory; priamo pri objekte je nákupné centrum Aupark, k Dómu svätej Alžbety je to približne sedem minút pešo.",
        wikiInfoEN: "Hotel Gloria Palac is a three-star hotel at Bottova 1 in Staré Mesto, on the edge of Košice's historic centre. It offers rooms and apartments, a restaurant, café and conference facilities; the Aupark shopping centre stands next to the building, and St Elizabeth's Cathedral is about a seven-minute walk away.",
        location: "Bottova 1, Košice",
        type: "Hotel",
        style: "Súčasná mestská zástavba",
        period: "Súčasný prevádzkový objekt",
        architect: "Neuvedené",
        sourceUrl: "https://www.gloriapalac.sk/",
        sourceNote: sourceNote(),
        audioSk: "assets/audio/sk/gloaria_palac_sk.mp3",
        audioEn: "assets/audio/en/gloria_palac_en.mp3",
        centerModelXZ: true,
        modelOffset: {
            scale: "1 1 1",
            position: "0 0 0",
            rotation: "0 0 0"
        }
    },
    {
        id: "historicke_dom_alzbety",
        zone: "historicke-centrum",
        name: "Dóm sv. Alžbety",
        modelPath: "assets/models/kostol.glb",
        description: "Najväčší gotický chrám na Slovensku.",
        wikiInfoSK: "Dóm svätej Alžbety v Košiciach je najväčší gotický chrám na Slovensku a dominanta Hlavnej ulice; výstavba sa začala v 14. storočí. Patrí medzi najvýznamnejšie sakrálne pamiatky v krajine.",
        wikiInfoEN: "St Elizabeth's Cathedral in Košice is the largest Gothic church in Slovakia and a landmark on Hlavná Street; construction began in the 14th century. It ranks among the country's foremost sacred monuments.",
        location: "Hlavná ulica, Košice",
        type: "Historická pamiatka",
        style: "Gotická architektúra",
        period: "14.–15. storočie",
        architect: "Neuvedené",
        sourceUrl: "https://sk.wikipedia.org/wiki/D%C3%B3m_sv%C3%A4tej_Al%C5%BEbety_(Ko%C5%A1ice)",
        sourceNote: sourceNote(),
        audioSk: "assets/audio/sk/dom_svatej_alzbety.mp3",
        audioEn: "assets/audio/en/svatej%20alzbety.mp3",
        modelOffset: {
            scale: "5 5 5",
            position: "0 0 0",
            rotation: "0 0 0"
        }
    },

    {
        id: "univerzitna_amfik_final",
        zone: "univerzitna-zona",
        name: "Amfiteáter UPJŠ",
        modelPath: "assets/models/amfik.glb",
        description: "Model amfiteátra.",
        wikiInfoSK: "Amfiteáter Univerzity Pavla Jozefa Šafárika v Košiciach slúži študentským podujatiam, promóciám a kultúrnym akciám na univerzitnom kampuse. Je súčasťou modernej areálovej zástavby školského mesta.",
        wikiInfoEN: "The Pavol Jozef Šafárik University amphitheatre in Košice hosts student events, graduations and cultural programmes on the university campus. It forms part of the modern university quarter.",
        location: "Univerzitná zóna, Košice",
        type: "Univerzitný objekt",
        style: "Moderná architektúra",
        period: "Súčasný digitálny model",
        architect: "Neuvedené",
        sourceUrl: "",
        sourceNote: sourceNote(),
        audioSk: "assets/audio/sk/amfiteatr.mp3",
        audioEn: "assets/audio/en/amfiteatr.mp3",
        modelOffset: {
            scale: "1 1 1",
            position: "0 0 0",
            rotation: "0 0 0"
        }
    },
    {
        id: "univerzitna_both",
        zone: "univerzitna-zona",
        name: "TUKE",
        modelPath: "assets/models/tuke.glb",
        lazyLoad: true,
        description: "Technická univerzita v Košiciach (TUKE) — areál univerzitnej zóny.",
        wikiInfoSK: "Technická univerzita v Košiciach (TUKE) je verejná vysoká škola so sídlom v mestskej časti Košice – Staré Mesto. Vzdeláva v technických, ekonomických, umeleckých a prírodnovedných odboroch; jej areál tvorí významnú súčasť univerzitnej zóny mesta.",
        wikiInfoEN: "The Technical University of Košice (TUKE) is a public university based in the Staré Mesto district. It offers programmes in engineering, economics, arts and natural sciences; its campus is a major part of the city's university zone.",
        location: "TUKE, Košice",
        type: "Vysoká škola",
        style: "Univerzitná architektúra",
        period: "Súčasný digitálny model",
        architect: "Neuvedené",
        sourceUrl: "",
        sourceNote: sourceNote(),
        audioSk: "assets/audio/sk/tuke_sk.mp3",
        audioEn: "assets/audio/en/tuke_en.mp3",
        modelOffset: {
            scale: "1 1 1",
            position: "0 0 0",
            rotation: "0 0 0"
        }
    },
    {
        id: "univerzitna_botanicka_zahrada",
        zone: "univerzitna-zona",
        name: "Botanická záhrada",
        modelPath: "assets/models/Botanicka_zahrada.glb",
        lazyLoad: true,
        description: "Model botanickej záhrady.",
        wikiInfoSK: "Botanická záhrada Univerzity Pavla Jozefa Šafárika v Košiciach sprístupňuje vonkajšie aj skleníkové zbierky rastlín pre štúdium i verejnosť. Sídli pri univerzitnom kampuse na sídlisku mestských častí Šaca a Mier.",
        wikiInfoEN: "The Pavol Jozef Šafárik University Botanical Garden in Košice maintains outdoor and glasshouse plant collections for study and the public. It lies near the university campus in the Šaca and Mier area.",
        location: "Univerzitná zóna, Košice",
        type: "Prírodný areál",
        style: "Krajinný priestor",
        period: "Súčasný digitálny model",
        architect: "Neuvedené",
        sourceUrl: "https://sk.wikipedia.org/wiki/Botanick%C3%A1_z%C3%A1hrada_Univerzity_Pavla_Jozefa_%C5%A0af%C3%A1rika_v_Ko%C5%A1iciach",
        sourceNote: sourceNote(),
        audioSk: "assets/audio/sk/botanicka-zahrada.mp3",
        audioEn: "assets/audio/en/botanicka-zahrada.mp3",
        modelOffset: {
            scale: "1 1 1",
            position: "0 0 0",
            rotation: "0 0 0"
        }
    },
    {
        id: "mestska_model_palackeho_final",
        zone: "mestska-zona",
        name: "Aupark",
        modelPath: "assets/models/AUPARK_model.glb",
        description: "Obchodné centrum Aupark Košice — nákupná zóna pri Toryse.",
        wikiInfoSK: "Aupark Košice je jedno z najväčších nákupných centier na východnom Slovensku. Nachádza sa pri rieke Torysa v mestskej časti Juh a ponúka desiatky obchodov, reštaurácií, kino a služby pre návštevníkov z Košíc aj okolia. Je dôležitým mestským bodom obchodu a voľného času mimo historického centra.",
        wikiInfoEN: "Aupark Košice is one of the largest shopping centres in eastern Slovakia. It stands by the Torysa River in the Juh district and offers dozens of shops, restaurants, a cinema and services for visitors from Košice and the wider region. It is a major retail and leisure hub outside the historic city centre.",
        location: "Aupark, Juh, Košice",
        type: "Obchodné centrum",
        style: "Súčasná mestská zástavba",
        period: "Súčasný digitálny model",
        architect: "Neuvedené",
        sourceUrl: "",
        sourceNote: sourceNote(),
        audioSk: "assets/audio/sk/aupark_sk.mp3",
        audioEn: "assets/audio/en/aupark_en.mp3",
        centerModelXZ: true,
        modelOffset: {
            scale: "0.4 0.4 0.4",
            position: "0 0 0",
            rotation: "0 0 0"
        }
    },
    {
        id: "mestska_final_3_budovi",
        zone: "mestska-zona",
        name: "Železničná stanica Košice",
        modelPath: "assets/models/Zeleznicna Stanica.glb",
        description: "Model mestského dopravného objektu.",
        wikiInfoSK: "Železničná stanica Košice je hlavná osobná stanica východného Slovenska a dopravný uzol medzinárodnej aj regionálnej železničnej siete. Reprezentatívna historická budova pochádza z 19. storočia.",
        wikiInfoEN: "Košice railway station is the main passenger station of eastern Slovakia and a hub on international and regional rail lines. Its representative historic main building dates from the 19th century.",
        location: "Mestská zóna, Košice",
        type: "Dopravný objekt",
        style: "Urbanistický model",
        period: "Súčasný digitálny model",
        architect: "Neuvedené",
        sourceUrl: "https://sk.wikipedia.org/wiki/%C5%BElezni%C4%8Dn%C3%A1_stanica_Ko%C5%A1ice",
        sourceNote: sourceNote(),
        audioSk: "assets/audio/sk/zeleznicna-stanica.mp3",
        audioEn: "assets/audio/en/zeleznicna-stanica.mp3",
        centerModelXZ: true,
        modelOffset: {
            scale: "0.3 0.3 0.3",
            position: "0 0 0",
            rotation: "0 0 0"
        }
    },
    {
        id: "mestska_ceskoslovenskej_armady",
        zone: "mestska-zona",
        name: "ul. Československej armády",
        modelPath: "assets/models/center.glb",
        description: "Neogotická pamiatka (1899–1903); v roku 1945 sídlo prezidenta Edvarda Beneša.",
        wikiInfoSK: "Ul. Československej armády v Košiciach — neogotická národná kultúrna pamiatka z rokov 1899–1903. Pri výstavbe boli použité kamenné časti z Dómu svätej Alžbety; v roku 1945 tu sídlil prezident Edvard Beneš.",
        wikiInfoEN: "Československej armády Street in Košice — a neo-Gothic national cultural monument from 1899–1903. Stone elements from St. Elizabeth Cathedral were reused in its construction; in 1945 it served as the residence of President Edvard Beneš.",
        location: "ul. Československej armády, Košice",
        type: "Historická pamiatka",
        style: "Neogotika",
        period: "1899–1903",
        architect: "Peter Jakab",
        sourceUrl: "https://sk.wikipedia.org/wiki/Jakabov_pal%C3%A1c",
        sourceNote: sourceNote(),
        audioSk: "assets/audio/sk/cecho_slovenskej_armady_sk.mp3",
        audioEn: "assets/audio/en/cecho_slovenskej_armady_en.mp3",
        modelOffset: {
            scale: "1 1 1",
            position: "0 0 0",
            rotation: "0 0 0"
        }
    }
];
    window.BUILDINGS.forEach(function (b) {
        b.sourceNote = SOURCE_NOTE;
    });
})();
