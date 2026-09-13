# Import JSON z SimDxf.html do 2D_AI.html

## Popis funkce

Přidána nová funkčnost do souboru **2D_AI.html** umožňující import JSON souborů vytvořených v **SimDxf.html**.

### Co bylo přidáno:

1. **Nové tlačítko v UI**

   - Tlačítko "📥 Import SimDxf" v sekci "⚡ Akce"
   - Nachází se hned vedle tlačítka "📂 Načíst projekt"

2. **File input element**

   - ID: `importSimDxfInput`
   - Přijímá pouze `.json` soubory

3. **Funkce pro konverzi**
   - `importSimDxfProject(input)` - Hlavní funkce pro načtení souboru
   - `convertSimDxfToShapes(simDxfData)` - Konverze formátu SimDxf → 2D_AI
   - `convertCoordinate(value, axis)` - Mapování souřadnic
   - `fitCanvasToShapes()` - Automatické přizpůsobení pohledu

## Jak funguje konverze

### SimDxf formát JSON:

```json
{
  "version": "1.0",
  "timestamp": "2024-01-20T...",
  "machineType": "KARUSEL|SOUSTRUH",
  "points": [
    { "x": 0, "z": 10, "type": "line", "break": false, "id": 1 },
    {
      "x": 1,
      "z": 15,
      "type": "arc",
      "r": 0.5,
      "cx": 0.5,
      "cz": 12.5,
      "cw": true,
      "id": 2
    }
  ],
  "dimensions": []
}
```

### Mapování souřadnic:

- **SimDxf.x** (Z-osa/Axiální) → **2D_AI.x** (Horizontální)
- **SimDxf.z** (X-osa/Radiální) → **2D_AI.y** (Vertikální)

### Konverze typů:

- **type: "line"** → 2D_AI line `{type: "line", x1, y1, x2, y2}`
- **type: "arc"** → 2D_AI circle `{type: "circle", cx, cy, r}`
- **break flag** → 2D_AI point `{type: "point", x, y}`

## Postup importu

1. V **SimDxf.html** vytvořit DXF → JSON konverzi
2. Exportovat JSON z SimDxf.html pomocí tlačítka "Export JSON"
3. V **2D_AI.html** kliknout na tlačítko "📥 Import SimDxf"
4. Vybrat JSON soubor z SimDxf.html
5. Potvrdit (pokud je v 2D_AI.html již něco nakresleného)
6. JSON se automaticky konvertuje a zobrazí se v plátně

## Bezpečnost dat

- **SimDxf.html** zůstává nezměněno
- **simKresleni.html** nebylo nijak ovlivněno
- Existující data v 2D_AI.html se přepíší pouze po potvrzení
- Importované tvary získají ID začínající `simDxf_` pro identifikaci

## Poznámky

- Soubor **2D_AI.html** byl rozšířen o ~200 řádků kódu
- Funkce automaticky přizpůsobí zoom a pan aby se všechny tvary vešly na obrazovku
- Informační zpráva se zobrazí po úspěšném importu
- Při chybě formátu se zobrazí chybová hláška a import se zruší

## Poznámka o souřadnicích

- SimDxf pracuje s lathe/CNC souřadnicemi (Z axial, X radial)
- 2D_AI pracuje se standardními grafickými souřadnicemi (X horizontal, Y vertical)
- Konverze mapuje SimDxf souřadnice do 2D_AI bez změny měřítka (1:1)
