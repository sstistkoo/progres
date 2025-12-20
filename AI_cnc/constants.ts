
import { GMCodeItem, MachineType, ControlSystem } from './types';

export const G_M_CODES: GMCodeItem[] = [
  // --- UNIVERZÁLNÍ KÓDY ---
  { code: 'G00', category: 'pohyb', title: 'Rychloposuv', description: 'Rychlý pohyb nástroje do pozice bez obrábění.', example: 'G00 X50 Z10' },
  { code: 'G01', category: 'pohyb', title: 'Lineární interpolace', description: 'Přímočarý pohyb s definovaným posuvem.', example: 'G01 X30 Z-20 F0.15' },
  { code: 'G02', category: 'pohyb', title: 'Kruhová interpolace CW', description: 'Kruhový pohyb po směru hodinových ručiček.', example: 'G02 X40 Z-10 R5 F0.1' },
  { code: 'G03', category: 'pohyb', title: 'Kruhová interpolace CCW', description: 'Kruhový pohyb proti směru hodinových ručiček.', example: 'G03 X40 Z-10 I5 K0 F0.1' },
  { code: 'G04', category: 'pohyb', title: 'Prodleva', description: 'Pauza v programu na zadaný čas.', example: 'G04 P2.0' },
  { code: 'G17', category: 'coord', title: 'Rovina XY', description: 'Volba pracovní roviny XY (pro frézování).', example: 'G17' },
  { code: 'G18', category: 'coord', title: 'Rovina XZ', description: 'Volba pracovní roviny XZ (soustružení).', example: 'G18' },
  { code: 'G54', category: 'coord', title: 'Nulový bod 1', description: 'Výběr souřadnicového systému 1.', example: 'G54' },
  { code: 'G90', category: 'coord', title: 'Absolutní programování', description: 'Souřadnice jsou vztaženy k nulovému bodu.', example: 'G90' },
  { code: 'G91', category: 'coord', title: 'Přírůstkové programování', description: 'Souřadnice jsou vztaženy k poslední poloze.', example: 'G91' },
  { code: 'M03', category: 'm', title: 'Vřeteno CW', description: 'Spuštění vřetena doprava.', example: 'M03 S1000' },
  { code: 'M04', category: 'm', title: 'Vřeteno CCW', description: 'Spuštění vřetena doleva.', example: 'M04 S500' },
  { code: 'M05', category: 'm', title: 'Stop vřetena', description: 'Zastavení vřetena.', example: 'M05' },
  { code: 'M30', category: 'm', title: 'Konec programu', description: 'Ukončení programu s návratem na začátek.', example: 'M30' },

  // --- SINUMERIK SPECIFICKÉ ---
  { code: 'G291', category: 'coord', title: 'ISO Dialekt', description: 'Přepnutí do ISO módu (Fanuc styl).', example: 'G291', systems: [ControlSystem.SINUMERIK] },
  { code: 'TRANS', category: 'coord', title: 'Posunutí nulového bodu', description: 'Absolutní posunutí souřadnic.', example: 'TRANS X10 Y5', systems: [ControlSystem.SINUMERIK] },
  { code: 'ATRANS', category: 'coord', title: 'Aditivní posunutí', description: 'Přičtení posunutí k aktuálnímu.', example: 'ATRANS Z-2', systems: [ControlSystem.SINUMERIK] },
  { code: 'MCALL', category: 'cycle', title: 'Modální volání cyklu', description: 'Volání cyklu v každém dalším bloku s pohybem.', example: 'MCALL CYCLE81(...)', systems: [ControlSystem.SINUMERIK] },
  { code: 'CYCLE83', category: 'cycle', title: 'Hluboké vrtání', description: 'Vrtací cyklus s výplachem třísek.', example: 'CYCLE83(10, 0, 2, -20, ...)', systems: [ControlSystem.SINUMERIK] },
  { code: 'CYCLE95', category: 'cycle', title: 'Hrubování Siemens', description: 'Hrubování obrysu (obdoba G71).', example: 'CYCLE95("OBRYS", 2, 0.5, 0.5, ...)', systems: [ControlSystem.SINUMERIK] },

  // --- FANUC SPECIFICKÉ ---
  { code: 'G65', category: 'cycle', title: 'Volání makra', description: 'Jednorázové volání uživatelského makra s parametry.', example: 'G65 P9010 A10. B5.0', systems: [ControlSystem.FANUC] },
  { code: 'G71', category: 'cycle', title: 'Hrubování podélné', description: 'Hrubovací cyklus pro podélné obrábění (2 řádky).', example: 'G71 U2.0 R1.0\nG71 P10 Q20 U0.5 W0.1 F0.2', systems: [ControlSystem.FANUC] },
  { code: 'G76', category: 'cycle', title: 'Závitovací cyklus', description: 'Složený závitovací cyklus.', example: 'G76 P011060 Q100 R0.05\nG76 X18.0 Z-25.0 P1000 Q200 F1.5', systems: [ControlSystem.FANUC] },
  { code: 'M98', category: 'm', title: 'Volání podprogramu', description: 'Skok do podprogramu.', example: 'M98 P1001', systems: [ControlSystem.FANUC] },
  { code: 'M99', category: 'm', title: 'Konec podprogramu', description: 'Návrat z podprogramu do hlavního programu.', example: 'M99', systems: [ControlSystem.FANUC] },

  // --- HEIDENHAIN SPECIFICKÉ ---
  { code: 'L', category: 'pohyb', title: 'Lineární pohyb', description: 'Pohyb po přímce (Klartext).', example: 'L X+50 Y+20 R0 FMAX M3', systems: [ControlSystem.HEIDENHAIN] },
  { code: 'C', category: 'pohyb', title: 'Kruhový pohyb', description: 'Kruhová dráha se středem CC.', example: 'C X+30 Y+30 DR+', systems: [ControlSystem.HEIDENHAIN] },
  { code: 'RND', category: 'pohyb', title: 'Zaoblení rohu', description: 'Vloží rádius mezi dva prvky.', example: 'RND R5', systems: [ControlSystem.HEIDENHAIN] },
  { code: 'CYCL DEF', category: 'cycle', title: 'Definice cyklu', description: 'Zadání parametrů cyklu.', example: 'CYCL DEF 200 VRTANI ...', systems: [ControlSystem.HEIDENHAIN] },
  { code: 'CYCL CALL', category: 'cycle', title: 'Vyvolání cyklu', description: 'Spuštění naposledy definovaného cyklu.', example: 'CYCL CALL M3', systems: [ControlSystem.HEIDENHAIN] },
  { code: 'TOOL CALL', category: 'm', title: 'Vyvolání nástroje', description: 'Výměna nástroje a zadání otáček.', example: 'TOOL CALL 5 Z S2500', systems: [ControlSystem.HEIDENHAIN] },
  { code: 'LBL', category: 'coord', title: 'Návěští (Label)', description: 'Definice nebo volání skoku.', example: 'LBL 1', systems: [ControlSystem.HEIDENHAIN] },
];

export const MATERIALS = [
  { id: 'steel-c45', name: 'Ocel C45 (12050)', vc: 180, fz: 0.12, color: 'slate' },
  { id: 'steel-stainless', name: 'Nerez A2/A4', vc: 80, fz: 0.08, color: 'blue' },
  { id: 'alu', name: 'Hliník (AlMg)', vc: 450, fz: 0.25, color: 'teal' },
  { id: 'cast-iron', name: 'Litinia (GG25)', vc: 120, fz: 0.15, color: 'stone' },
  { id: 'plastic', name: 'Plasty (POM/PE)', vc: 300, fz: 0.30, color: 'white' },
];

export const MACHINE_OPTIONS = [
  { id: MachineType.LATHE, name: 'Soustruh', icon: '🔩', desc: 'Horizontální / Vertikální' },
  { id: MachineType.CAROUSEL, name: 'Karusel', icon: '⚙️', desc: 'Vertikální soustruh' },
  { id: MachineType.MILL, name: 'Frézka', icon: '🔨', desc: '3-5osá frézka' },
];

export const CONTROL_OPTIONS = [
  { id: ControlSystem.SINUMERIK, name: 'Sinumerik 840D', icon: '🔷', info: 'ISO G-kód Siemens, ShopTurn/ShopMill, CYCLE cykly.' },
  { id: ControlSystem.FANUC, name: 'Fanuc', icon: '🟠', info: 'Standardní ISO, Makro G65/G66, Cykly G70-G89.' },
  { id: ControlSystem.HEIDENHAIN, name: 'Heidenhain', icon: '🟦', info: 'Klartext / ISO, výkonné cykly pro frézování.' },
];
