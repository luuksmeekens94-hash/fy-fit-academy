# LMS media-uploads

Deze Academy gebruikt **Vercel Blob** voor LMS-media in de accreditatiebuilder.

## Waarom Vercel Blob

- De applicatie draait op Vercel.
- De integratie is klein en betrouwbaar voor documenten, afbeeldingen en normale MP4-video's.
- De upload-URL kan direct in het bestaande lesformulier worden opgeslagen.

Voor zware videoproductie, adaptive streaming of striktere video-privacy kan later Vimeo, Mux of Cloudflare Stream worden toegevoegd. Documenten blijven dan alsnog via Blob of object storage lopen.

## Benodigde environment variable

```env
BLOB_READ_WRITE_TOKEN=[REDACTED]
```

Zet deze in:

1. Vercel project `fy-fit-academy` → Storage → Blob store koppelen of aanmaken.
2. Vercel project settings → Environment Variables.
3. Voeg `BLOB_READ_WRITE_TOKEN` toe voor Production, Preview en Development als nodig.
4. Lokaal mag dezelfde naam in `.env.local`, maar commit nooit echte waarden.

## Admin-flow

1. Ga als beheerder naar `/academybeheer`.
2. Open een cursus/e-learning in de accreditatiebuilder.
3. Open of maak een les.
4. Kies bij media-upload een bestand.
5. Klik **Uploaden**.
6. Controleer de preview.
7. De Blob-URL wordt automatisch ingevuld in `lessonMediaUrl`.
8. Sla de les op.
9. Deelnemer/reviewer ziet daarna een nette video, afbeelding of documentkaart in de les.

## Ondersteunde bestanden

- Video: `.mp4`
- Afbeeldingen: `.png`, `.jpg`, `.jpeg`, `.webp`
- Documenten: `.pdf`, `.doc`, `.docx`, `.ppt`, `.pptx`, `.xls`, `.xlsx`

Maximaal: **250 MB per upload**.

## Beveiliging

De uploadroute `/lms/media-upload`:

- vereist een ingelogde gebruiker;
- staat alleen `BEHEERDER` toe;
- controleert of de cursus bestaat;
- controleert optioneel of de les bij de cursus hoort;
- weigert onbekende bestandstypen;
- weigert bestanden boven 250 MB;
- geeft geen secrets terug aan de browser.

## Smoke-check zonder login

Een niet-ingelogde request naar `/lms/media-upload` hoort naar `/login` te redirecten. Dat betekent dat de route bestaat en door auth wordt beschermd.

```bash
curl -sS -X POST -o /tmp/fyfit-upload.html -w '%{http_code} %{redirect_url}\n' https://fy-fit-academy.vercel.app/lms/media-upload
```

Verwacht zonder sessie: `307 https://fy-fit-academy.vercel.app/login`.

## Als uploaden faalt

- Fout `BLOB_TOKEN_MISSING`: `BLOB_READ_WRITE_TOKEN` ontbreekt in Vercel of lokaal.
- Fout `Bestandstype wordt niet ondersteund`: converteer video naar MP4 of upload een toegestaan documenttype.
- Fout `Bestand is te groot`: comprimeer video of kies later Vimeo/Mux/Cloudflare Stream voor professionele videostreaming.
