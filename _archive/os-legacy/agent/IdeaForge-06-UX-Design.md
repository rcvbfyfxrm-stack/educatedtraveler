---
tags: source, ideaforge, ux, design, interface, accessibilite, typographie
type: compilation
domaine: ux-design
date_extraction: 2026-01-23
sources: The Design of Everyday Things, Don't Make Me Think, Laws of UX, Refactoring UI, About Face, Lean UX, Atomic Design, The Non-Designer's Design Book, Thinking with Type, Grid Systems in Graphic Design
---

# IdeaForge 06: UX & Design Visuel
## L'Invisible Qui Fait Tout Le Travail

> *"Design is not just what it looks like and feels like. Design is how it works."* — Steve Jobs

---

## Vue d'ensemble

Cette bibliothèque couvre un spectre large: de l'UX fondamental (Norman, Krug) au design système (Frost), en passant par la typographie (Lupton, Bringhurst) et la psychologie appliquée (Yablonski). Le fil conducteur: **le design n'est jamais neutre — il encode des choix qui façonnent les comportements**.

---

## Idée Majeure 1: Les Affordances et Signifiers (L'Invisible Qui Guide)

### Le Concept

**Norman** a introduit le concept d'affordance dans le design: ce qu'un objet *permet* de faire. Mais plus important encore, il distingue les **signifiers** — les indices qui *communiquent* ce qui est possible.

Une porte a l'affordance d'être poussée ou tirée. La barre horizontale ou la poignée verticale est le signifier qui indique comment.

### Citations et concepts clés

> **Norman:** "The term affordance refers to the perceived and actual properties of the thing... that determine just how the thing could possibly be used."

> **Norman:** "Good design is actually a lot harder to notice than poor design, in part because good designs fit our needs so well that the design is invisible."

**Les 7 principes fondamentaux de Norman:**
1. Discoverability — Qu'est-ce qui est possible?
2. Feedback — Que se passe-t-il?
3. Conceptual Model — Comment ça marche?
4. Affordances — Qu'est-ce qui est permis?
5. Signifiers — Où agir?
6. Mappings — Quelle relation action/résultat?
7. Constraints — Qu'est-ce qui est empêché?

### Analyse critique

**Le génie:** Norman a transformé des intuitions vagues en vocabulaire précis. Avant lui, on disait "c'est mal conçu". Après lui, on peut diagnostiquer *pourquoi*.

**La limitation:** Le livre date de 1988 (révisé en 2013). Les affordances digitales sont plus subtiles — un bouton web n'a pas d'affordance physique, seulement des signifiers visuels.

**Le paradoxe du bon design:** Plus il est réussi, moins on le remarque. Le designer excellent est invisible.

---

## Idée Majeure 2: Don't Make Me Think (La Règle d'Or)

### Le Concept

**Krug** a résumé des décennies de recherche UX en une phrase: si l'utilisateur doit réfléchir, vous avez échoué.

Chaque question que l'interface pose ("Est-ce cliquable?", "Où suis-je?", "Comment revenir?") consomme de la charge cognitive. La charge cognitive est limitée. Minimisez-la.

### Citations et concepts clés

> **Krug:** "Don't make me think. As far as possible, a web page should be self-evident, obvious, self-explanatory."

> **Krug:** "Get rid of half the words on each page, then get rid of half of what's left."

**Les lois de Krug:**
1. Les gens ne lisent pas, ils scannent
2. Les gens ne font pas des choix optimaux, ils satisficent
3. Les gens ne cherchent pas comment les choses fonctionnent, ils bidouillent

### Analyse critique

**Ce qui vieillit bien:** L'insight sur le scanning et le satisficing est validé par les eye-tracking modernes.

**Ce qui a évolué:** Le mobile a changé les conventions. Le "hamburger menu" est maintenant compris. Les swipes sont intuitifs pour une génération.

**Le danger:** "Don't make me think" peut être interprété comme "ne faites rien d'original". L'innovation UX requiert parfois un apprentissage.

---

## Idée Majeure 3: Les Lois Psychologiques du Design

### Le Concept

**Yablonski** a compilé les principes psychologiques les plus pertinents pour les designers. Ce ne sont pas des suggestions — ce sont des lois cognitives.

### Citations et concepts clés

**Les 10 lois essentielles:**

1. **Fitts's Law:** Le temps pour atteindre une cible dépend de la distance et de la taille. (Boutons importants = grands et proches)

2. **Hick's Law:** Le temps de décision augmente avec le nombre d'options. (Moins de choix = décisions plus rapides)

3. **Miller's Law:** La mémoire de travail contient 7±2 éléments. (Chunking obligatoire)

4. **Jakob's Law:** Les utilisateurs passent plus de temps sur d'autres sites. Ils préfèrent que le vôtre fonctionne pareil.

5. **Aesthetic-Usability Effect:** Les designs beaux semblent plus faciles à utiliser. (La beauté n'est pas cosmétique)

6. **Peak-End Rule:** Les gens jugent une expérience par son pic et sa fin, pas par la moyenne.

7. **Doherty Threshold:** La productivité explose quand le temps de réponse < 400ms.

8. **Tesler's Law:** La complexité a une conservation. Quelqu'un doit la gérer — soit l'utilisateur, soit le système.

9. **Postel's Law:** Soyez conservateur dans ce que vous faites, libéral dans ce que vous acceptez des autres.

10. **Parkinson's Law of Triviality:** Les gens passent plus de temps sur les détails triviaux que sur les décisions importantes.

### Analyse critique

**La valeur:** Ces lois fournissent une grille d'évaluation objective. Au lieu de "je n'aime pas ce bouton", on peut dire "ce bouton viole Fitts's Law".

**Le piège:** Les lois peuvent être utilisées pour justifier la médiocrité. "C'est comme tous les autres sites" (Jakob's Law) devient une excuse pour ne pas innover.

**La nuance:** Ces lois sont des *heuristiques*, pas des absolus. Les meilleures expériences les violent parfois consciemment.

---

## Idée Majeure 4: Le CRAP Principle (Pour Non-Designers)

### Le Concept

**Robin Williams** (la designeuse, pas l'acteur) a codifié les 4 principes qui séparent le design amateur du professionnel:

- **C**ontrast — Si c'est différent, rendez-le VRAIMENT différent
- **R**epetition — Répétez les éléments visuels pour créer cohérence
- **A**lignment — Rien n'est placé au hasard. Tout est aligné sur quelque chose
- **P**roximity — Groupez ce qui va ensemble. Séparez ce qui est distinct

### Citations et concepts clés

> **Williams:** "The simple rule is this: Find something nice about the piece and repeat it."

> **Williams:** "Nothing should be placed on the page arbitrarily. Every element should have a visual connection with another element on the page."

### Analyse critique

**Le pouvoir de la simplicité:** CRAP est assez simple pour être mémorisé, assez puissant pour transformer n'importe quel design amateur.

**L'application universelle:** Ces principes s'appliquent aux slides, aux documents, aux interfaces, aux posters. C'est la grammaire visuelle de base.

**La limite:** CRAP vous fait passer de "mauvais" à "correct". Pour aller de "correct" à "excellent", il faut plus.

---

## Idée Majeure 5: Atomic Design (Penser en Systèmes)

### Le Concept

**Frost** a proposé une métaphore chimique pour construire des interfaces: on ne design pas des pages, on design des **atomes** qui forment des **molécules** qui forment des **organismes** qui forment des **templates** qui forment des **pages**.

### Les 5 niveaux

1. **Atoms:** Éléments HTML de base (label, input, button)
2. **Molecules:** Groupes d'atomes fonctionnels (search form = label + input + button)
3. **Organisms:** Sections complexes (header = logo + nav + search form)
4. **Templates:** Structures de page sans contenu réel
5. **Pages:** Templates avec contenu réel

### Analyse critique

**La révolution mentale:** Atomic Design force à penser "composant d'abord". Au lieu de designer 50 pages, on design 50 composants réutilisables.

**L'alignement avec le code:** Les frameworks modernes (React, Vue) fonctionnent exactement comme ça. Le designer et le développeur parlent le même langage.

**Le danger:** La sur-abstraction. Créer 47 variantes de boutons "pour la flexibilité" produit un design system que personne ne maintient.

**La réalité:** La plupart des design systems meurent de négligence, pas de mauvaise architecture.

---

## Idée Majeure 6: Refactoring UI (Pratique > Théorie)

### Le Concept

**Wathan & Schoger** ont pris l'approche inverse: pas de théorie, que des *tricks* visuels applicables immédiatement.

### Insights actionnables

1. **Espacement:** Utilisez une échelle limitée (4, 8, 12, 16, 24, 32, 48, 64, 96)
2. **Couleurs:** Commencez par le gris. Ajoutez une couleur principale. C'est tout.
3. **Typographie:** 2 tailles, 2 poids maximum pour commencer
4. **Ombres:** Les ombres définissent l'élévation, pas la décoration
5. **Hierarchy:** Si tout est important, rien n'est important

> **Wathan:** "Good design isn't about making everything look the same — it's about making differences intentional."

### Analyse critique

**La force:** Refactoring UI est pour les développeurs ce que CRAP est pour les marketeurs. Des résultats immédiats sans années d'étude.

**La philosophie cachée:** Le livre prouve que le design visuel est largement *mécanique*. Les "bons designers" appliquent des recettes. Elles peuvent s'apprendre.

**La limite:** Ces tricks produisent des interfaces "propres" mais pas "mémorables". Pour le mémorable, il faut une vision.

---

## Idée Majeure 7: Lean UX (Discovery Continue)

### Le Concept

**Gothelf** a fusionné l'UX avec l'agile. Au lieu du modèle "research → design → build → test", il propose des cycles courts et continus.

### Le shift mental

- De "deliverables" à "outcomes"
- De "spécifications" à "hypothèses"
- De "documentation" à "conversations"
- De "expert designer" à "équipe collaborative"

> **Gothelf:** "Our goal is not to create a deliverable, it's to change something in the world — to create an outcome."

### Analyse critique

**Le problème résolu:** L'UX "cascade" produit des specs magnifiques... implémentées 6 mois plus tard dans un contexte différent.

**Le risque:** Sans discipline, "Lean UX" devient "pas d'UX". L'excuse "on itère" justifie de shipper n'importe quoi.

**La tension:** Les stakeholders veulent des certitudes. Lean UX offre des hypothèses. La vente interne est difficile.

---

## Synthèse: Le Méta-Pattern

### Les 3 Couches du Design

1. **Cognitive:** Comment le cerveau perçoit et traite (Norman, Yablonski)
2. **Visuelle:** Comment les yeux scannent et jugent (Krug, Williams, Wathan)
3. **Systémique:** Comment les composants s'assemblent (Frost, Gothelf)

### La Tension Centrale

Le design vit entre deux pôles:

| Standardisation | Différenciation |
|-----------------|-----------------|
| Jakob's Law | Purple Cow |
| Design systems | Vision unique |
| Conventions | Innovation |
| Prévisibilité | Mémorabilité |

Le mauvais design ignore les conventions. Le bon design les respecte. L'excellent design sait quand les transcender.

---

## Question Provocante

> **Si les principes UX sont documentés depuis 40 ans, pourquoi la majorité des interfaces restent-elles frustrantes?**

Hypothèses:
- Les décideurs ne sont pas les utilisateurs
- Les métriques récompensent l'engagement, pas la satisfaction
- La dette UX s'accumule comme la dette technique — invisible jusqu'à ce qu'elle tue
- "Utilisable" n'est pas un objectif business sexy

La vraie question: **le bon design est-il un avantage compétitif, ou une commodité ignorée?**

---

## Hiérarchie des Idées

| Rang | Idée | Valeur | Risque | Action |
|------|------|--------|--------|--------|
| 1 | Don't Make Me Think | 10/10 | 1/10 | Audit de charge cognitive |
| 2 | Affordances/Signifiers | 9/10 | 2/10 | Vocabulaire d'équipe |
| 3 | Laws of UX | 9/10 | 3/10 | Checklist de validation |
| 4 | CRAP Principles | 8/10 | 1/10 | Formation rapide |
| 5 | Atomic Design | 8/10 | 4/10 | Design system |
| 6 | Refactoring UI | 8/10 | 2/10 | Amélioration immédiate |
| 7 | Lean UX | 7/10 | 5/10 | Intégration agile |

---

## Tags

#auteur/norman #auteur/krug #auteur/yablonski #auteur/williams #auteur/frost #auteur/gothelf #auteur/wathan #auteur/lupton
#source/livre #domaine/ux #domaine/ui #domaine/design-system
#concept/affordance #concept/cognitive-load #concept/atomic-design #concept/crap
#theme/accessibilite #theme/composants #theme/psychologie
#impact/positif #critique/forte #perennite/durable

---

*Extraction réalisée par IdeaForge-Cosmos | 2026-01-23*
*"Le design invisible est le design réussi."*
