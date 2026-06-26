# Guide for code refactoring

Ensure all the following points are addressed. Consider the current codebase finished, just refactor 
where its needed and limit changing style/components to only when necessary. Follow the current 
structure, style and conventions, and reuse any existing component where needed.

Before starting, analyze the codebase and make sure you understand all the existing code, so that 
any new change or implementation follows the current style and conventions. All of your changes 
should not break the app, if you are quite unsure of it, prioritize not breaking the app instead.

When done, create a RESULT.md file in the root directory with all the changes made and a brief 
description of them.

## New screen header layout

In the four section screens (Tornei, Partite, Squadre and Giocatori), the top bar always shows a 
"createButton" in the right side.

This button should be hidden when inside any of the modal views (view, create and edit).
Also, when in "view" or "edit" mode, it should be replaced with a redirect button (same style, choose 
an ideal Lucide icon) which opens a link based on the following format:
- Tornei: https://torneo-citta-di-trento.vercel.app/classifiche?edizione=ID
- Partite: https://torneo-citta-di-trento.vercel.app/partite/dettagli?id=ID
- Squadre: https://torneo-citta-di-trento.vercel.app/squadre/dettagli?id=ID
- Giocatori: https://torneo-citta-di-trento.vercel.app/giocatori/dettagli?id=ID

where ID is the id of the object.


## Multiple 'iscrizioni' for the same player

Currently, a player can register to only one squad in one tournament. Following a similar logic/structure 
to the CreateCategoriesStep from TorneoModalForm.tsx, implement a way to allow multiple registrations.
One registration must be associated to a squad and a tournament. A player cannot have multiple 
registrations for the same tournament, and it must have at least one registration.

## Notifications

Implement a multiplatform notification system, or at least for the Android platform if not possible.

The notification system should send a well formatted notification to the user's device when:
- a match is about to start (reminder 10 minutes before)
- a match has started
- a match has ended, so it informs the admin to confirm the match report

Try to keep this system simple, and connect the notification permission to the related setting in the
settings screen.


## Tooltips

In the various inputs components, add an optional tooltip prop (you choose the type and structure).
This tooltip should be shown when the user hovers a small "?" icon next to the input label.
The tooltip should be shown only when additional information is needed (for example, the format of the
squad acronym being three capital letters), and not everywhere.

## Feedback system

In the four section screens (Tornei, Partite, Squadre and Giocatori), the top bar always shows a
"createButton" in the right side.

I want you to add a feedback button alongside it, perhaps with a "?" icon, to all to four screens.
This button simply opens a modal with various contacts links (devs emails and torunament ig page)
so that the user can contact the developers/organizers for eventual feedback.

## README.md

The README.md file should be updated with the current updated content. Without changing its style or
structure, and following the same writing style, update all obsolete/wrong info where needed.

## Bugs and problems

#### Wrong captain in SquadraCard.tsx
The shown captain is just a randomly selected player from the squad. If no captain is assigned,
show a dedicated label (ex: "Nessun capitano assegnato").

#### Prevent destructive "back"
Prevent the user from going back to the previous screen when clicking a "go back" button by showing
a confirmation dialog first. This should not be shown on intermediate step screens but only on the first
(or whenever the button makes it so that the form resets).

#### Other possible bugs or problems
If you find any other bugs, issues or possible optimizations, feel free to fix/apply them when necessary,
but ensure they do not break or change the current codebase style/structure/functionality.