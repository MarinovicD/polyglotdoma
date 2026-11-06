# polyglot.doma – Website

Statische Website (HTML, CSS, etwas JavaScript), läuft kostenlos über GitHub Pages.

## Branches

| Branch | Zweck |
|---|---|
| `main` | **Live-Fassung.** Das ist die Seite, die online ist. Alles, wofür noch Inhalte fehlen (Foto, Stimmen, Video, Instagram, Preise, Fristen, Sprachumschalter), ist ausgeblendet. |
| `entwurf` | **Arbeitsfassung.** Die komplette Landingpage mit allen Platzhaltern in `[eckigen Klammern]`. Hier wird weitergearbeitet. Sobald ein Teil fertig ist, wandert er nach `main`. |

GitHub Pages veröffentlicht nur `main` (Settings → Pages → Branch: `main`, Ordner: `/ (root)`).

## Dateien

```
index.html          Startseite
impressum.html      Impressum (Vorlage – ausfüllen!)
datenschutz.html    Datenschutzerklärung (Vorlage – ausfüllen und prüfen lassen!)
favicon.svg         Symbol im Browser-Tab
assets/css/style.css
assets/js/main.js   Menü + Kontaktformular (Einstellungen ganz oben)
assets/img/         Logo-Varianten; hier kommen später Fotos hinein
.nojekyll           sagt GitHub, die Dateien unverändert auszuliefern
```

## Vor dem Livegang

- [ ] Impressum ausfüllen (Name, Anschrift, Kontakt)
- [ ] Datenschutzerklärung ausfüllen und prüfen lassen
- [ ] Web3Forms-Access-Key (web3forms.com, kostenlos) in `assets/js/main.js` bei `WEB3FORMS_KEY` eintragen. Bis dahin öffnet das Formular ersatzweise das E-Mail-Programm der Besucher.
- [ ] `CONTACT_EMAIL` in `assets/js/main.js` prüfen
- [ ] Schriften lokal einbinden statt von Google Fonts laden (Datenschutz)

## Offene Inhalte (nur in `entwurf` sichtbar)

Foto (Hero), Zitate + Sprachen von Ayman/Dante/Celal, Video, Instagram-Link, Preise, Verschiebe-Frist, Antwortzeit „[X] Tage“, Übersetzungen EN/BS/AR.
