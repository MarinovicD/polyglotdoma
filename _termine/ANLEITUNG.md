# Terminbuchung einrichten (Google Apps Script)

Einmalig, ca. 10 Minuten. Alles im Konto **info@talaqa-lab.com**.

1. **Projekt anlegen:** script.google.com öffnen → „Neues Projekt“. Oben links den Namen ändern in `polyglot.doma Termine`.
2. **Manifest sichtbar machen:** links auf das Zahnrad (Projekteinstellungen) → Haken bei „Manifestdatei ‚appsscript.json‘ im Editor anzeigen“.
3. **Code einfügen:** links auf „Editor“ (`< >`).
   - `Code.gs` öffnen, alles löschen, den Inhalt von `_termine/Code.gs` einfügen.
   - `appsscript.json` öffnen, alles löschen, den Inhalt von `_termine/appsscript.json` einfügen.
   - Speichern (Strg/Cmd + S).
4. **Einmal ausführen:** oben in der Auswahl die Funktion `setup` wählen → „Ausführen“.
   - Google fragt nach Berechtigungen (Kalender, Gmail, Auslöser) → zulassen.
   - Falls „Google hat diese App nicht überprüft“ erscheint: „Erweitert“ → „Zu polyglot.doma Termine wechseln“. Das ist normal, die App gehört dir.
   - Im Protokoll steht danach: „Fertig. Freie Zeitfenster in den nächsten Tagen: …“
5. **Veröffentlichen:** oben rechts „Bereitstellen“ → „Neue Bereitstellung“ → Zahnrad → „Web-App“.
   - Ausführen als: **Ich (info@talaqa-lab.com)**
   - Zugriff: **Jeder**
   - „Bereitstellen“ → die **Web-App-URL** kopieren (endet auf `/exec`) und Claude schicken.
   - Fehlt die Option „Jeder“: In der Admin-Konsole unter Apps → Google Workspace → Drive und Docs → Freigabeeinstellungen das Teilen außerhalb der Organisation erlauben.

## Gut zu wissen

- **Dein Google-Kalender bestimmt alles.** Gebucht werden kann zwischen 9 und 21 Uhr, nur wo dein Hauptkalender frei ist, mit 10 Minuten Puffer davor und danach, frühestens 24 Stunden und höchstens 4 Wochen im Voraus.
- Termine, die in Google auf **„Verfügbar“** stehen, blockieren nicht. Das gilt auch für **ganztägige Termine** (die stehen in Google meist auf „Verfügbar“). Willst du einen ganzen Tag sperren, stell den Termin auf „Beschäftigt“.
- **Offene Anfragen** stehen grau als „⏳ Anfrage: Kennenlerngespräch – Name“ in deinem Kalender und halten das Zeitfenster frei. **Bestätigte Termine** werden blau, mit Google-Meet-Link und dem Schüler als Gast.
- Nach **48 Stunden** ohne Antwort (oder wenn der Termin schon begonnen hat) wird die Anfrage automatisch freigegeben. Der Schüler bekommt eine freundliche Mail, du eine kurze Info.
- Den Kalendereintrag einer offenen Anfrage bitte **nicht von Hand löschen**, sondern über „Ablehnen“ – sonst bekommt der Schüler keine Nachricht.
- **Änderungen am Code später:** Code ersetzen → „Bereitstellen“ → „Bereitstellungen verwalten“ → Stift → Version „Neue Version“ → „Bereitstellen“. Die Adresse bleibt gleich.
