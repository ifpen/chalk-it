from taipy.gui import Gui
from chlkt import *

geoJsonParkings = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          2.342773091449471,
          48.85565848878775
        ]
      },
      "properties": {
        "mis_a_jour": "2018-02-01",
        "tel": "01 46 33 97 48",
        "objectid": 84,
        "tmoto_1ehe": "ND",
        "abmoto_1me": "89",
        "pr_1a_maxe": "ND",
        "adress_geo": "40 BIS QUAI DES ORFEVRES",
        "tf_res_1am": "ND",
        "tf_15mn_e": "1,1",
        "tf_2h_e": "8,8",
        "tf_12h_e": "39,6",
        "id": 41,
        "abmoto_1ae": "925,6",
        "pr_1a_maxm": "ND",
        "abpmr_1t_e": "ND",
        "deleg": "INDIGO",
        "tf_11h_e": "39,6",
        "autopart": "OUI",
        "tf_15mn_mo": "ND",
        "ab_1m_e": "246",
        "tf_res_mo": "NON",
        "h_parc_cm": 190,
        "tf_30mn_e": "2,2",
        "tf_24h_e": "39,6",
        "horaire_na": "24h / 24",
        "tf_30mn_mo": "ND",
        "tf_1h_e": "4,4",
        "v_elec_ch": "NON",
        "tf_9h_e": "39,6",
        "parc_amod": "NON"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          2.341282707608166,
          48.8621266179414
        ]
      },
      "properties": {
        "mis_a_jour": "2018-02-01",
        "tel": "01 42 60 19 14",
        "objectid": 85,
        "tmoto_1ehe": "1,5",
        "abmoto_1me": "94,5",
        "pr_1a_maxe": "2160",
        "adress_geo": "7 PLACE DU LOUVRE",
        "tf_res_1am": "ND",
        "tf_15mn_e": "1,1",
        "tf_2h_e": "8,8",
        "tf_12h_e": "39,6",
        "id": 46,
        "abmoto_1ae": "945",
        "pr_1a_maxm": "756",
        "abpmr_1t_e": "376,5",
        "deleg": "SPIE AUTOCITE",
        "tf_11h_e": "39,6",
        "autopart": "NON",
        "tf_15mn_mo": "0,4",
        "ab_1m_e": "270",
        "tf_res_mo": "NON",
        "h_parc_cm": 190,
        "tf_30mn_e": "2,2",
        "tf_24h_e": "39,6",
        "horaire_na": "24h / 24",
        "tf_30mn_mo": "0,8",
        "tf_1h_e": "4,4",
        "v_elec_ch": "OUI",
        "tf_9h_e": "39,6",
        "parc_amod": "NON"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          2.333777698372947,
          48.866242960394615
        ]
      },
      "properties": {
        "mis_a_jour": "2018-02-01",
        "tel": "01 47 03 02 88",
        "objectid": 87,
        "tmoto_1ehe": "1,4",
        "abmoto_1me": "94,5",
        "pr_1a_maxe": "2000",
        "adress_geo": "29 TER RUE DES PYRAMIDES",
        "tf_res_1am": "ND",
        "tf_15mn_e": "1",
        "tf_2h_e": "8",
        "tf_12h_e": "36",
        "id": 177,
        "abmoto_1ae": "954,45",
        "pr_1a_maxm": "700",
        "abpmr_1t_e": "371,5",
        "deleg": "SAEMES",
        "tf_11h_e": "36",
        "autopart": "NON",
        "tf_15mn_mo": "0,35",
        "ab_1m_e": "270",
        "tf_res_mo": "NON",
        "h_parc_cm": 190,
        "tf_30mn_e": "2",
        "tf_24h_e": "36",
        "horaire_na": "24h / 24",
        "tf_30mn_mo": "0,7",
        "tf_1h_e": "4",
        "v_elec_ch": "OUI",
        "tf_9h_e": "36",
        "parc_amod": "NON"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          2.34937911467182,
          48.86101522004842
        ]
      },
      "properties": {
        "mis_a_jour": "2018-02-01",
        "tel": "01 40 13 00 65",
        "objectid": 88,
        "tmoto_1ehe": "ND",
        "abmoto_1me": "72",
        "pr_1a_maxe": "ND",
        "adress_geo": "37 TER BOULEVARD SEBASTOPOL",
        "tf_res_1am": "ND",
        "tf_15mn_e": "1,1",
        "tf_2h_e": "8,8",
        "tf_12h_e": "39,6",
        "id": 147,
        "abmoto_1ae": "728",
        "pr_1a_maxm": "ND",
        "abpmr_1t_e": "ND",
        "deleg": "INDIGO",
        "tf_11h_e": "39,6",
        "autopart": "NON",
        "tf_15mn_mo": "ND",
        "ab_1m_e": "245",
        "tf_res_mo": "NON",
        "h_parc_cm": 190,
        "tf_30mn_e": "2,2",
        "tf_24h_e": "39,6",
        "horaire_na": "24h / 24",
        "tf_30mn_mo": "ND",
        "tf_1h_e": "4,4",
        "v_elec_ch": "OUI",
        "tf_9h_e": "39,6",
        "parc_amod": "NON"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          2.3301979075673183,
          48.8678975600126
        ]
      },
      "properties": {
        "mis_a_jour": "2018-02-01",
        "tel": "01 42 60 50 00",
        "objectid": 89,
        "tmoto_1ehe": "1,6",
        "abmoto_1me": "76,5",
        "pr_1a_maxe": "ND",
        "adress_geo": "26 TER PLACE VENDOME",
        "tf_res_1am": "ND",
        "tf_15mn_e": "1,2",
        "tf_2h_e": "9,6",
        "tf_12h_e": "39,6",
        "id": 6,
        "abmoto_1ae": "795,6",
        "pr_1a_maxm": "ND",
        "abpmr_1t_e": "ND",
        "deleg": "INDIGO",
        "tf_11h_e": "39,6",
        "autopart": "NON",
        "tf_15mn_mo": "0,4",
        "ab_1m_e": "294",
        "tf_res_mo": "NON",
        "h_parc_cm": 190,
        "tf_30mn_e": "2,4",
        "tf_24h_e": "39,6",
        "horaire_na": "24h / 24",
        "tf_30mn_mo": "0,8",
        "tf_1h_e": "4,8",
        "v_elec_ch": "NON",
        "tf_9h_e": "39,6",
        "parc_amod": "NON"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          2.346551896305018,
          48.86014793509658
        ]
      },
      "properties": {
        "mis_a_jour": "2018-02-01",
        "tel": "01 42 36 57 37",
        "objectid": 31,
        "tmoto_1ehe": "1,3",
        "abmoto_1me": "91",
        "pr_1a_maxe": "2080",
        "adress_geo": "22 RUE DES HALLES",
        "tf_res_1am": "765",
        "tf_15mn_e": "0,95",
        "tf_2h_e": "7,6",
        "tf_12h_e": "34,2",
        "id": 8,
        "abmoto_1ae": "910",
        "pr_1a_maxm": "ND",
        "abpmr_1t_e": "360",
        "deleg": "SAEMES",
        "tf_11h_e": "34,2",
        "autopart": "OUI",
        "tf_15mn_mo": "0,35",
        "ab_1m_e": "260",
        "tf_res_mo": "OUI",
        "h_parc_cm": 185,
        "tf_30mn_e": "1,9",
        "tf_24h_e": "34,2",
        "point_x": 652057.879,
        "point_y": 6862433.174,
        "tf_30mn_mo": "0,7",
        "tf_1h_e": "3,8",
        "v_elec_ch": "OUI",
        "tarif_pr": "OUI",
        "tf_9h_e": "34,2",
        "parc_amod": "NON"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          2.339968016158395,
          48.86325431210127
        ]
      },
      "properties": {
        "mis_a_jour": "2018-02-01",
        "tel": "01 47 03 92 21",
        "objectid": 83,
        "tmoto_1ehe": "1,6",
        "abmoto_1me": "112,2",
        "pr_1a_maxe": "ND",
        "adress_geo": "14 RUE CROIX DES PETITS CHAMPS",
        "tf_res_1am": "ND",
        "tf_15mn_e": "1,15",
        "tf_2h_e": "9,2",
        "tf_12h_e": "39,6",
        "id": 104,
        "abmoto_1ae": "1167,7",
        "pr_1a_maxm": "ND",
        "abpmr_1t_e": "537",
        "deleg": "INDIGO",
        "tf_11h_e": "39,6",
        "autopart": "OUI",
        "tf_15mn_mo": "0,4",
        "ab_1m_e": "377",
        "tf_res_mo": "NON",
        "h_parc_cm": 190,
        "tf_30mn_e": "2,3",
        "tf_24h_e": "39,6",
        "horaire_na": "24h / 24",
        "tf_30mn_mo": "0,8",
        "tf_1h_e": "4,6",
        "v_elec_ch": "NON",
        "tf_9h_e": "39,6",
        "parc_amod": "NON"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          2.333264515214272,
          48.865102106721615
        ]
      },
      "properties": {
        "mis_a_jour": "2018-02-01",
        "tel": "01 47 03 02 88",
        "objectid": 86,
        "tmoto_1ehe": "1,4",
        "abmoto_1me": "94,5",
        "pr_1a_maxe": "2000",
        "adress_geo": "14 TER RUE DES PYRAMIDES",
        "tf_res_1am": "ND",
        "tf_15mn_e": "1",
        "tf_2h_e": "8",
        "tf_12h_e": "36",
        "id": 52,
        "abmoto_1ae": "954,45",
        "pr_1a_maxm": "700",
        "abpmr_1t_e": "371,5",
        "deleg": "SAEMES",
        "tf_11h_e": "36",
        "autopart": "NON",
        "tf_15mn_mo": "0,35",
        "ab_1m_e": "270",
        "tf_res_mo": "NON",
        "h_parc_cm": 190,
        "tf_30mn_e": "2",
        "tf_24h_e": "36",
        "horaire_na": "24h / 24",
        "tf_30mn_mo": "0,7",
        "tf_1h_e": "4",
        "v_elec_ch": "OUI",
        "tf_9h_e": "36",
        "parc_amod": "NON"
      }
    }
  ],
  "properties": {
    "description": "Some parkings information in Paris"
  }
}

gui = Gui()
page = ChalkitPage("osm-geojson-points_modif.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)