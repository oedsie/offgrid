# Off-grid Energiesystemen – website

One-page website voor Off-grid Energiesystemen.

## Structuur

```
offgrid-website/
├── index.html              De pagina
├── .nojekyll               Zorgt dat GitHub Pages de bestanden ongewijzigd toont
├── README.md
└── assets/
    ├── css/style.css       Opmaak en animaties
    ├── js/main.js          Scroll-animaties (elementen verschijnen bij scrollen)
    └── images/
        ├── logo-licht.png  Logo voor lichte achtergrond (menubalk)
        ├── logo-donker.png Logo voor donkere achtergrond (footer)
        └── favicon.svg     Icoon in het browsertabblad
```

## Online zetten met GitHub Pages

1. Upload alle bestanden en mappen naar de hoofdmap van de repository (`index.html` moet bovenaan staan, niet in een submap).
2. Ga naar **Settings → Pages**.
3. Kies bij **Source** voor *Deploy from a branch*, selecteer de branch (bijv. `main`) en de map `/ (root)`, en klik op **Save**.
4. Na een minuut of twee staat de site op `https://<gebruikersnaam>.github.io/<repository>/`.

## Nog in te vullen

Zoek in `index.html` op blokhaken `[` en vul in: telefoonnummer, e-mailadres, werkgebied en KvK-nummer.
Het contactformulier verstuurt nog niets; koppel het aan een formulierdienst zoals Formspree.
