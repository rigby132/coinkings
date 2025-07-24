---
title: Data Challenge Präsentation
theme: default
author: Deniz Güven, Georgios Kontesidis
date: 2025-07-24
format: 
    beamer:
        pdfengine: xelatex
---

# Git

Alle Unterlagen, Daten und Code:

[https://github.com/rigby132/coinkings](https://github.com/rigby132/coinkings)

# Inhalt

- Recap
- Neo4j
- Frontend
- Ergebnisse
- Ausblick

# Recap

Plan der CoinKings

- SNA Tool
  - WebApp

  ![](./images/recap/svelte.png){ width=20% }

  - Visualisierung

  ![](./images/recap/leaflet.png){ width=20% }

  - Graphdatenbank

  ![](./images/recap/neo4j.png){ width=20% }

# Neo4j

# Neo4j
Wie bildet man die Daten in Neo4j ab?

# Neo4j
Knoten:

- Münzen

- Fundorte

- Typen

- Stempel

# Neo4j
Kanten:

- Münzen --- Fundorte

- Münzen --- Typen

- Münzen --- Stempel

# Neo4j
Daten in neo4j bekommen

- Direkt einlesen (schwierig)

- Vorbereiten und dann einlesen (einfach)

# Neo4j
  ![](./images/neo4j/feeding.jpg)

# Neo4j
  ![](./images/neo4j/csv_coin.png)

# Neo4j
  ![](./images/neo4j/csv_coin_query.png)

# Neo4j
  ![](./images/neo4j/csv_class.png){ width=50% }

# Neo4j
  ![](./images/neo4j/csv_class_query.png)

# Neo4j
  ![](./images/neo4j/csv_unstructured.png)

# Neo4j
  ![](./images/neo4j/main_query.png)

# Neo4j
  ![](./images/neo4j/main.png)

# Neo4j
  ![](./images/neo4j/stempel_query.png)
  
# Neo4j
  ![](./images/neo4j/stempel.png)

# Neo4j
  ![](./images/neo4j/db_info.png){ width=50% }

# Neo4j
  Es fehlen noch Kanten zwischen Fundorten.

# Neo4j
  Weitere Kanten:

  - Typgleiche Münzen
  
  - Visuelle Ähnlichkeit

# Neo4j
  Kanten erstellen:

  ![](./images/neo4j/similarity_0.png)

  Kantengewicht setzen:

  ![](./images/neo4j/similarity_1.png)

# Neo4j
  ![](./images/neo4j/similarity_view.png)

# Neo4j

# Neo4j
  Neo4j Graph Datascience Library (GDS)

   - Community Detection

# Neo4j
  ![](./images/neo4j/neo4j_algos.png)

# Neo4j
  ![](./images/neo4j/neo4j_algos_marked.png)

# Frontend

# Frontend

NVL

![](./images/nvl/nvl_no_coins.png)

# Frontend

NVL

![](./images/nvl/nvl_too_many_coins.png)

# Frontend

User Interface

# Frontend

![](./images/ui/gesamt.jpg)

# Frontend

![](./images/ui/geclustered.jpg)

# Frontend

![](./images/ui/cluster_and_scores.png){ width=28% }

# Frontend

![](./images/ui/cluster_and_scores_clustering.png){ width=28% }

# Frontend

![](./images/ui/cluster_and_scores_selected.png){ width=28% }

# Frontend

![](./images/ui/cluster_and_scores_scores.png){ width=28% }

# Ergebnisse

# Ergebnisse

Ostgruppe vs Westgruppe

# Ergebnisse

![](./images/west_ost/bs1-bs5.jpg)

# Ergebnisse

![](./images/west_ost/bs6-bs9.jpg)

# Ergebnisse

Visuelle Ähnlichkeit

# Ergebnisse

![](./images/similarity/gesamtbild.jpg)

# Ergebnisse

![](./images/similarity/modularity.png){ width=50% }

# Ergebnisse

![](./images/similarity/stradonice.jpg)

# Ergebnisse

![](./images/similarity/modularity_stradonice.png){ width=50% }

# Ergebnisse

![](./images/similarity/altenburg_bevor.jpg)

# Ergebnisse

![](./images/similarity/altenburg_danach.jpg)

# Ergebnisse

![](./images/similarity/modularity_altenburg.png){ width=50% }

# Ergebnisse

![](./images/similarity/altenburg_similarities.png){ width=60% }

# Ergebnisse

Typengleichheit

# Ergebnisse

![](./images/typengleichheit/allen.jpg)

# Ergebnisse

![](./images/typengleichheit/nick.jpg)

# Ergebnisse

![](./images/typengleichheit/allen_maxima.png){ width=60% }

# Ergebnisse

![](./images/typengleichheit/nick_maxima.png){ width=60% }

# Ergebnisse

![](./images/typengleichheit/occ_maxima.png){ width=60% }

# Ergebnisse

Veröffentlichung

# Ergebnisse

![](./images/ddos/ddos_typ.png)

# Ausblick

# Ausblick
Grundlegende Verbesserungen:

- Effizienz
- Darstellung
- Benutzerfreundlichkeit
- Weitere Datensätze

# Ausblick
2 mögliche Wege:

- Analyse-Tool
- Visualisierungs-Tool

