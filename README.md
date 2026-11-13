# Ønskelisten ✳

En moderne, mørk og mobilvennlig ønskeliste, klar for gratis publisering på GitHub Pages.

## 1. Rediger ønskene

Åpne `products.js`. Endre navn, kategori, pris (NOK), prioritet (1 = mest ønsket), beskrivelse, bilde-URL og butikk-URL. Hvert ønske må ha en **unik `id`**. Ikke endre en eksisterende ID etter at noen har reservert gaven; reservasjoner kobles til ID-en.

Tekster og årstall kan endres i `index.html`. Farger og utseende kan endres i `style.css`.

## 2. Publiser gratis på GitHub Pages

1. Opprett et offentlig repository på github.com, f.eks. `onskeliste`.
2. Last opp alle filene fra denne mappen **i roten av repositoryet** (ikke bare ZIP-filen).
3. Gå til **Settings → Pages → Build and deployment**. Velg **Deploy from a branch**, `main` og `/ (root)`, og lagre.
4. Nettsiden blir tilgjengelig på `https://DITT-BRUKERNAVN.github.io/onskeliste/` etter publisering.
5. Del lenken med familie og venner.

## 3. Aktiver reservasjonssystemet (Firebase, gratisnivå)

GitHub Pages er statisk og kan ikke alene synkronisere reservasjoner mellom besøkende. Firebase Firestore brukes som database. Gratisnivået har kvoter; se Firebase sin gjeldende prisside.

1. Opprett et prosjekt på https://console.firebase.google.com/.
2. Legg til en **Web app** i Project settings. Kopier verdiene `apiKey`, `authDomain`, `projectId`, `appId` inn i `firebase-config.js`.
3. Gå til **Authentication → Sign-in method** og aktiver **Anonymous**.
4. Gå til **Firestore Database**, opprett databasen, og åpne fanen **Rules**. Erstatt reglene med innholdet fra `firestore.rules` og publiser.
5. Last opp oppdatert `firebase-config.js` til GitHub.
6. Test fra to ulike nettlesere/enheter: Reserver én gave i den ene og sjekk at den blir markert som reservert i den andre.

### Viktige begrensninger

- Uten Firebase-konfigurasjon vises produktlisten, favoritter, sortering og lenker, men **reservasjon er deaktivert**. Det er ikke en falsk lokal reservasjon.
- Reservasjonsstatus synkroniseres i sanntid. Reservasjoner er låst etter opprettelse for å hindre at andre overskriver dem. Ønsker du å oppheve en reservasjon, kan du som prosjekteier slette det aktuelle dokumentet manuelt i Firebase Console under `wishlists / min-juleliste-2026 / reservations / <produkt-id>`.
- Reservasjonsnavnet lagres i databasen og er **ikke vist på selve nettsiden**, men det er **ikke hemmelig**: andre besøkende med tilgang til nettsiden kan teknisk sett lese det fra Firestore. Bruk derfor bare fornavn eller la feltet stå tomt. En ekte hemmelig reservasjon fra listeeieren krever serverbasert tilgangskontroll.
- Alle med lenken kan reservere ønsker; anonym innlogging er ikke identitetsverifisering. Denne løsningen er egnet for en liten familie-/venneliste, ikke for sensitiv informasjon.
- Favoritter lagres lokalt i hver enkelt nettleser og deles ikke med andre.
- Eksempelbildene er eksterne illustrasjoner og er ikke nødvendigvis bilder av de konkrete produktene. Bytt dem gjerne til ekte produktbilder med tillatelse til bruk.

## Test lokalt

ES-moduler fungerer best gjennom en lokal server. Kjør `python -m http.server 8000` i mappen, og åpne `http://localhost:8000`.
