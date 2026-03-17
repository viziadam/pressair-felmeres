# Field Forms Demo

Gyors demó egy **terepi kérdőív-készítő** alkalmazáshoz:
- Kérdőív-választó (lista, státusz, kitöltés, törlés).
- In-app kérdőív-szerkesztő: **drag & drop** rács, ütközésmentes (react-grid-layout).
- Alapelemek: **Szöveg**, **Legördülő**, **Komment**.
- Külön **Állomás** és **Kompresszor** modulok: a kitöltő felületen
  tetszőleges számú példány hozzáadása/törlése, kinyitás/bezárás (accordion).
- Tárolás **localStorage**-ban (egyszerű demó).
- Tech: React + TypeScript + Vite.

## Futtatás

```bash
npm i
npm run dev
```

Nyisd meg: http://localhost:5173

## Felépítés

- `src/pages/FormSelector.tsx` – kezdő nézet, kérdőívlista.
- `src/pages/FormBuilder.tsx` – szerkesztő, drag & drop elrendezés.
- `src/pages/FormFiller.tsx` – kitöltő felület, modul példányokkal.
- `src/types.ts`, `src/storage.ts` – típusok és egyszerű tárolás.

> Figyelem: PDF export, felhasználókezelés és szerveroldali mentés **nincs** a demóban – ezeket gyorsan hozzá lehet tenni (pl. Flask/Express backend és `pdfmake`/`puppeteer` vagy server-side PDF).
