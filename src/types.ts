// export type ElementType = 'text' | 'dropdown' | 'comment' | 'module_station' | 'module_compressor';

// export interface GridPos { x: number; y: number; w: number; h: number; i: string; }

// export interface InkComment {
//   enabled: boolean;
//   dataUrl?: string;
// }

// export interface BaseElement {
//   id: string;
//   type: ElementType;
//   label: string;
//   grid: GridPos;
//   ink?: InkComment;
// }

// export interface TextElement extends BaseElement {
//   type: 'text';
//   placeholder?: string;
// }
// export interface CommentElement extends BaseElement {
//   type: 'comment';
//   placeholder?: string;
// }
// export interface DropdownElement extends BaseElement {
//   type: 'dropdown';
//   options: string[];
// }
// export interface ModuleElement extends BaseElement {
//   type: 'module_station' | 'module_compressor';
//   instances: ModuleInstance[];
// }
// export interface ModuleInstance {
//   id: string;
//   title: string;
//   open: boolean;
//   fields: { key: string; label: string; value?: string }[];
// }

// export interface FormMeta {
//   id: string;
//   name: string;
//   description?: string;
//   createdAt: string;
//   status: 'draft' | 'done';
// }

// export interface FormData {
//   meta: FormMeta;
//   elements: FormElement[];
// }

// export type AnswerMap = Record<string, any>;

// /* --- ÚJ: Globális (általános) adatok --- */
// export interface GlobalInfo {
//   companyName: string;
//   site: string;        // telephely
//   phone: string;
//   email: string;
// }

// export type FileItem = {
//   name: string
//   type: string
//   /** képeknél dataURL (image/*). nem képeknél üres lehet */
//   dataUrl?: string
// }

// export type FileElement = {
//   id: string
//   type: 'file'
//   label: string
//   grid: { i: string; x: number; y: number; w: number; h: number }
//   ink?: { enabled: boolean } // opcionális: még tehető mellé kézírásos komment is
//   /** későbbre: több fájl engedélyezése, most true alapból */
//   multiple?: boolean
// }

// export type SketchElement = {
//   id: string
//   type: 'sketch'
//   label: string
//   grid: { i: string; x: number; y: number; w: number; h: number }
//   /** rajz vászon magasság px-ben (UI); PDF-ben arányosan illesztjük */
//   height?: number
// }

// // !!! egészítsd ki a FormElement uniót:
// export type FormElement =
//   | TextElement
//   | CommentElement
//   | DropdownElement
//   | ModuleElement
//   | FileElement
//   | SketchElement


// export type GlobalInfo = {
//   companyName: string
//   site: string
//   phone: string
//   email: string
//   logoDataUrl?: string
// }

// export type FormMeta = {
//   id: string
//   name: string
// }

// export type GridSpec = {
//   i: string
//   x: number
//   y: number
//   w: number
//   h: number
// }

// /** Minden elemben engedélyezhető egy opcionális kézírásos komment panel. */
// export type InkMeta = {
//   enabled: boolean
//   /** ha szeretnéd, itt is tárolhatnánk a legutóbbi képet; jelenleg az AnswerMap-ben van */
//   dataUrl?: string
// }

// /** Közös mezők minden elemhez */
// export type BaseElement = {
//   id: string
//   label: string
//   grid: GridSpec
//   /** Opcionális kézírásos komment meta – minden elemre megengedett, hogy egyszerű legyen a kód. */
//   ink?: InkMeta
// }

// /** Szövegmező */
// export type TextElement = BaseElement & {
//   type: 'text'
//   placeholder?: string
// }

// /** Többsoros megjegyzés (sima szöveg) */
// export type CommentElement = BaseElement & {
//   type: 'comment'
//   placeholder?: string
// }

// /** Legördülő lista */
// export type DropdownElement = BaseElement & {
//   type: 'dropdown'
//   options: string[]
// }

// /** Modul példányon belüli mező */
// export type ModuleField = {
//   key: string
//   label: string
//   value?: string
// }

// /** Modul egy példánya (állomás/kompresszor) */
// export type ModuleInstance = {
//   id: string
//   title: string
//   open: boolean
//   fields: ModuleField[]
// }



// /** Modul elem (állomás / kompresszor) */
// export type ModuleElement = BaseElement & {
//   type: 'module_station' | 'module_compressor'
//   instances: ModuleInstance[]
// }

// /** Feltöltött fájl modellje (válaszban tároljuk) */
// export type FileItem = {
//   name: string
//   type: string
//   dataUrl?: string
//   // ÚJ: a képernyőn beállított méret (px)
//   wPx?: number
//   hPx?: number
// }

// /** Fájlfeltöltés elem */
// export type FileElement = BaseElement & {
//   type: 'file'
//   multiple?: boolean
//   hideLabel?: boolean
// }

// /** Szabadkézi rajz elem */
// export type SketchElement = BaseElement & {
//   type: 'sketch'
//   /** vászon magassága px-ben az UI-ban (PDF-ben arányosan illesztjük) */
//   height?: number
//   hideLabel?: boolean
// }

// // ÚJ: képfeltöltő elem típusa (csak jelző, tényleges feltöltés a kitöltéskor)
// export type ImagesElement = BaseElement & {
//   type: 'images'
//   hideLabel?: boolean
// };

// // BŐVÍTÉS: vedd fel az unióba
// export type FormElement =
//   | TextElement
//   | CommentElement
//   | DropdownElement
//   | ModuleElement
//   | FileElement
//   | ImagesElement   // <= ÚJ
//   | SketchElement
  

// /** Egy teljes felmérési lap (fül) */
// export type FormData = {
//   meta: FormMeta
//   elements: FormElement[]
// }

// export interface FormTemplate {
//   meta: { [k: string]: any };
//   elements: any[]; // pontosítsd, ha van saját elem típusod
// }

// /** Válaszok – kulcs: elem id vagy speciális kulcs (pl. __ink__id) */
// export type AnswerMap = Record<string, any>

// ===== Alap típusok

// --- a fájl tetején: Globals típus kibővítése ---
export type Globals = {
  companyName: string
  site: string
  contactName: string        // kapcsolattartó név
  contactTitle: string       // kapcsolattartó beosztás
  phone: string
  email: string
  date: string               // dátum (YYYY-MM-DD)
  inspectorName: string      // felmérést végző személy neve
  logoDataUrl?: string
}

export const EMPTY: Globals = {
  companyName: '',
  site: '',
  contactName: '',
  contactTitle: '',
  phone: '',
  email: '',
  date: '',
  inspectorName: '',
  logoDataUrl: undefined
}

export type GlobalInfo = {
  companyName: string
  site: string
  phone: string
  email: string
  logoDataUrl?: string
}

export type FormMeta = {
  id: string
  name: string
}

export type GridSpec = {
  i: string
  x: number
  y: number
  w: number
  h: number
}

/** Opcionális kézírásos komment meta – bármely elemhez engedélyezhető. */
export type InkMeta = {
  enabled: boolean
  /** Ha szeretnéd, itt is tárolhatnánk a legutóbbi képet; jelenleg az AnswerMap-ben van. */
  dataUrl?: string
}

/** Közös mezők minden elemhez */
export type BaseElement = {
  id: string
  label: string
  grid: GridSpec
  ink?: InkMeta
}

// ===== Elem-specifikus típusok

/** Egysoros szövegmező (kitöltéskor input) */
export type TextElement = BaseElement & {
  type: 'text'
  placeholder?: string
}

/** Többsoros szabadkézi megjegyzés vászonnal (InlineInkCanvas) – tartalma az AnswerMap-ben */
export type CommentElement = BaseElement & {
  type: 'comment'
  placeholder?: string
}

/** Egyszeres választású legördülő */
export type DropdownElement = BaseElement & {
  type: 'dropdown'
  options: string[]
}

/** Többszörös választású legördülő – AnswerMap[el.id] => string[] */
export type DropdownMultiElement = BaseElement & {
  type: 'dropdown_multi'
  options: string[]
}

/** Csak megjelenő címsor – embedben nem szerkeszthető, nincs AnswerMap értéke */
// types.ts – bővítés
export type TitleElement = BaseElement & {
  type: 'title';
  note?: string;
  showNote?: boolean;
};
/** Gépelhető, automatikusan növekedő többsoros megjegyzés – AnswerMap[el.id] => string */
export type NoteTextElement = BaseElement & {
  type: 'note_text'
  placeholder?: string
}

/** Modul példányon belüli mező */
// export type ModuleField = {
//   key: string
//   label: string
//   value?: string
// }

/** Modul egy példánya (állomás/kompresszor) */
// export type ModuleInstance = {
//   id: string
//   title: string
//   open: boolean
//   fields: ModuleField[]
// }

/** Modul elem (állomás / kompresszor) */
// export type ModuleElement = BaseElement & {
//   type: 'module_station' | 'module_compressor'
//   instances: ModuleInstance[]
// }

/** Feltöltött fájl modellje (válaszban tároljuk) */
export type FileItem = {
  name: string
  type: string
  dataUrl?: string
  /** UI méret (px), opcionális */
  wPx?: number
  hPx?: number
}

/** Fájlfeltöltés elem */
export type FileElement = BaseElement & {
  type: 'file'
  multiple?: boolean
  hideLabel?: boolean
}

/** Szabadkézi rajz elem */
export type SketchElement = BaseElement & {
  type: 'sketch'
  /** vászon magassága px-ben az UI-ban (PDF-ben arányosan illesztjük) */
  height?: number
  hideLabel?: boolean
}

/** Képfeltöltő elem (kitöltéskor történik a tényleges feltöltés) */
export type ImagesElement = BaseElement & {
  type: 'images'
  hideLabel?: boolean
}

// export type MachineType =
//   | 'Kompresszor'
//   | 'Hűtveszárító'
//   | 'Adszorpciós szárító'
//   | 'Membrán szárító'
//   | 'N2 generátor'
//   | 'O2 generátor'
//   | 'Csapadékleválasztó'
//   | 'Előszűrő (részecske szűrő)'
//   | 'Mikroszűrő (olaj szűrő)'
//   | 'Aktívszén-szűrő (olaj szűrő)'
//   | 'Aktívszén adszorber'
//   | 'Katalitikus konverter'
//   | 'Steril szűrő'
//   | 'Légtartály'
//   | 'N2 tartály'
//   | 'Kondenzátum leeresztő'
//   | 'Kondenzátum szétválasztó'
//   | 'Felülrendelt vezérlés'

export type ModuleField = {
  key: string
  label: string
  value?: string
}

export type ModuleInstance = {
  id: string
  /** pl. "Kompresszor 3" – embedben fixen jelenítjük meg */
  title: string
  /** rész lenyitva? */
  open: boolean
  /** egyszerű és részletes modulnál is megvan */
  machineType?: MachineType
  /** standard mezők (Gyártó, Típus stb.) */
  fields: ModuleField[]
  /** csak a megjegyzés/inkhez (answers-be is tehető, de típus szerint itt is tarthatjuk) */
  noteKey?: string    // pl. `note::<instanceId>`
  inkKey?: string     // pl. `__ink__note::<instanceId>`
}

/** Egyszerű gép modul (Gyártó, Típus + megjegyzés + ink) */
export type ModuleMachineElement = BaseElement & {
  type: 'module_machine'
  instances: ModuleInstance[]
}

/** Részletes gép modul – típusfüggő mezők + megjegyzés + ink */
export type ModuleMachineDetailElement = BaseElement & {
  type: 'module_machine_detail'
  instances: ModuleInstance[]
}

/** A meglévő ModuleElement unió bővítve */
export type ModuleElement =
  | (BaseElement & { type: 'module_station' | 'module_compressor'; instances: ModuleInstance[] }) // backward compat
  | ModuleMachineElement
  | ModuleMachineDetailElement

export type MachineSimpleInstance = {
  id: string;
  title: string;            // pl. "Kompresszor 1" – fix, nem szerkeszthető
  open: boolean;            // lenyitva/zárva
  machineType: MachineType; // kiválasztott géptípus
  fields: ModuleField[];    // csak: manufacturer, model, general_note (value-k a template-ben)
};

export type MachineSimpleElement = BaseElement & {
  type: 'module_machine_simple';
  instances: MachineSimpleInstance[];
};

/** FormElement unió frissítve – ha nálad itt listázod */
export type FormElement =
  | TitleElement
  | NoteTextElement
  | TextElement
  | CommentElement
  | DropdownElement
  | DropdownMultiElement
  | ModuleElement
  | FileElement
  | ImagesElement
  | SketchElement
  | MachineSimpleElement     // <= ÚJ
  | SystemSurveyElement
  | TankDetailElement
  | MachineDetailElement;    // <= ÚJ

/** Egy teljes felmérési lap (fül) */
export type FormData = {
  meta: FormMeta
  elements: FormElement[]
}

/** FormTemplate – pontosítva a belső elemekre */
export interface FormTemplate {
  meta: { [k: string]: any }
  elements: FormElement[]
}

/** Válaszok – kulcs: elem id vagy speciális kulcs (pl. __ink__${id}) */
export type AnswerMap = Record<string, any>

// ========= Gép modul – közös konstansok és részletes sablonok =========

/** Támogatott géptípusok (readonly tuple) */
export const MACHINE_TYPES = [
  'Kompresszor',
  'Hűtveszárító',
  'Adszorpciós szárító',
  'Membrán szárító',
  'N2 generátor',
  'O2 generátor',
  'Csapadékleválasztó',
  'Előszűrő (részecske szűrő)',
  'Mikroszűrő (olaj szűrő)',
  'Aktívszén-szűrő (olaj szűrő)',
  'Aktívszén adszorber',
  'Katalitikus konverter',
  'Steril szűrő',
  'Légtartály',
  'N2 tartály',
  'Kondenzátum leeresztő',
  'Kondenzátum szétválasztó',
  'Felülrendelt vezérlés',
] as const;

// // ===== Specifikáció egy részletes mezőhöz =====
// export type FieldSpec = {
//   key: string;
//   label: string;
//   input: 'text' | 'select';
//   unit?: string;
//   options?: string[];        // csak selectnél
// };

export type InputKind = 'text' | 'select' | 'dropdown_multi';

export type FieldSpec = {
  key: string;
  label: string;
  input: InputKind;
  unit?: string;
  options?: string[]; // select / dropdown_multi
};

// Egy "szekció" (3.0, 4.0, ... 18.0)
export type SectionSpec = {
  code: number;        // pl. 3, 4, ..., 18
  title: string;       // pl. "Sűrített levegő általános jellemzői"
  fields: FieldSpec[]; // mezők listája ebben a szekcióban
  photoKey?: string;   // "Fotók helye" válasz kulcsa (ImageUploaderhez)
};

export type SystemSurveyInstance = {
  id: string;
  index: number;         // 0 = általános (3.0..18.0), 1 = első rendszer (3.1..18.1), stb.
  open: boolean;
  // sablon szerinti mezők (értékek UI-ban tölthetők, itt csak a label-t visszük)
  // a te kódodhoz igazodva: ModuleField[]
  fields: ModuleField[];
};

export type SystemSurveyElement = BaseElement & {
  type: 'module_system_survey';
  instances: SystemSurveyInstance[];
};

// ===== Részletes gép instance/elem (új elem típus) =====
export type MachineDetailInstance = {
  id: string;
  title: string;            // pl. "Kompresszor 1" – fix, nem szerkeszthető
  open: boolean;            // lenyitva/zárva
  machineType: MachineType; // kiválasztott géptípus
  fields: ModuleField[];    // FieldSpec kulcsok értékei (value-k ide mennek)
};

export type MachineDetailElement = BaseElement & {
  type: 'module_machine_detail';
  instances: MachineDetailInstance[];
};

export type MachineType = typeof MACHINE_TYPES[number];

/** Egy részletes mező leírása (slugolt key + felirat) */
export type MachineDetailField = { key: string; label: string };

/**
 * Részletes mezősablonok típusonként.
 * Kulcsok slug-oltak, a label az UI felirata. Az értékek szabad szöveg/number/checkbox lehetnek a UI-ban.
 * A "Gépállapot általános leírása" mezőt `general_note`,
 * a "Fotók helye" jelzést `photos` kulccsal adtam (UI oldalon képfeltöltőhöz köthető).
 * 
 * 
 */

// ===== Közös opciók, amiket sok típus használ =====
const OPT_WORKING = ['működik', 'nem működik', 'nem megállapítható'];
const OPT_MAINT_POLICY = ['Bestcair garancia szerint','gyártói előírás szerint','gyártói előírástól eltérően'];
const OPT_DOCS = ['van','nincs'];
const OPT_EFF = ['IE3','IE4','IE5'];

// kis helpertáblák
// const T = (key: string, label: string, unit?: string): FieldSpec => ({ key, label, input:'text', unit });
// const S = (key: string, label: string, options: string[], unit?: string): FieldSpec => ({ key, label, input:'select', options, unit });

// helperek
const T = (key: string, label: string, unit?: string): FieldSpec =>
  ({ key, label, input: 'text', unit });

const S = (key: string, label: string, options: string[], unit?: string): FieldSpec =>
  ({ key, label, input: 'select', options, unit });

const M = (key: string, label: string, options: string[]): FieldSpec =>
  ({ key, label, input: 'dropdown_multi', options });

// ===== TELJES részletes sablon – a kapott táblázat szerint =====
export const DETAIL_TEMPLATES: Record<MachineType, FieldSpec[]> = {
  // --- Kompresszor ---
  'Kompresszor': [
    T('manufacturer','gyártó'),
    T('model','típus'),
    T('pressure','nyomás'),
    T('flow','légszállítás'),
    T('year','gyártási év'),
    T('serial','gyártási szám'),
    T('hours_total','összes üzemóra'),
    T('hours_load','terhelt üzemóra'),
    T('hours_idle','üresjárati üzemóra'),
    T('switch_cycles','kapcsolási ciklus szám'),
    T('op_mode','üzemelési jellemző (üzemi, tartalék)'),
    T('annual_run','jellemző éves futásteljesítmény'),
    T('location','üzemelési hely (központi kompresszor ház, eltérő üzemrészben, stb.)'),
    T('drive_motor','meghajtómotor'),
    T('motor_power','névleges teljesítmény','kW'),
    S('efficiency','energetikai hatékonyság', OPT_EFF),
    T('power_factor','teljesítmény tényező','cos φ'),
    T('fan_motor','hűtőventilátor motor'),
    T('fan_power','névleges teljesítmény','kW'),
    // szárító blokk
    T('dryer_man','beépített / ráépített szárító – gyártó'),
    T('dryer_model','beépített / ráépített szárító – típus'),
    T('dryer_serial','beépített / ráépített szárító – gyártási szám'),
    T('refrig','hűtőközeg'),
    T('refrig_charge','hűtőközeg töltetmennyiség'),
    T('operable','üzemképesség'),
    // légtartály
    T('vessel_man','légtartály – gyártó'),
    T('vessel_size','légtartály – méret'),
    T('vessel_pmax','légtartály – maximális nyomás'),
    T('vessel_serial','légtartály – gyártási szám'),
    T('vfd_make','frekvenciaváltó gyártmánya'),
    // panel
    T('panel_type','vezérlő panel – típus'),
    T('panel_state','vezérlő panel – állapot'),
    // karbantartás
    S('mt_policy','karbantartás', OPT_MAINT_POLICY),
    S('mt_docs','karbantartási dokumentációk (munkalapok)', OPT_DOCS),
    T('mt_company','karbantartást végző cég'),
    T('mt_last','utolsó igazolt karbantartás dátuma'),
    S('working','a berendezés működőképes', OPT_WORKING),
  ],

  // --- Hűtveszárító ---
  'Hűtveszárító': [
    T('manufacturer','gyártó'),
    T('model','típus'),
    T('pressure','nyomás'),
    T('power','teljesítmény'),
    T('year','gyártási év'),
    T('serial','gyártási szám'),
    T('refrig_type','hűtőközeg fajtája'),
    T('refrig_charge','hűtőközeg töltet mennyiség'),
    T('operable','üzemképesség'),
    T('op_mode','üzemelési jellemző (üzemi, tartalék)'),
    T('location','üzemelési hely (központi kompresszor ház, eltérő üzemrészben, stb.)'),
    T('panel_type','vezérlő panel – típus'),
    T('panel_state','vezérlő panel – állapot'),
    S('working','a berendezés működőképes', OPT_WORKING),
  ],

  // --- Adszorpciós szárító ---
  'Adszorpciós szárító': [
    T('manufacturer','gyártó'),
    T('model','típus'),
    T('pressure','nyomás'),
    T('dewpoint','harmatpont'),
    T('power','teljesítmény'),
    T('year','gyártási év'),
    T('serial','gyártási szám'),
    T('coldregen','hidegregenerációs'),
    T('hotregen','melegregenerációs'),
    T('with_carbon','aktívszén adszorberrel egybeépítve'),
    T('insulation','szigetelés'),
    T('control','vezérlés (ciklusidő alapú, harmatpont alapú vezérlés)'),
    T('media','töltet fajtája'),
    T('media_qty','töltet mennyiség'),
    T('operable','üzemképesség'),
    T('op_mode','üzemelési jellemző (üzemi, tartalék)'),
    T('location','üzemelési hely (központi kompresszor ház, eltérő üzemrészben, stb.)'),
    S('working','a berendezés működőképes', OPT_WORKING),
  ],

  // --- Membrán szárító ---
  'Membrán szárító': [
    T('manufacturer','gyártó'),
    T('model','típus'),
    T('pressure','nyomás'),
    T('dewpoint','harmatpont'),
    T('power','teljesítmény'),
    T('year','gyártási év'),
    T('serial','gyártási szám'),
    T('prefilter','ráépített előszűrő (gyártó, típus, leeresztő…stb.)'),
    T('operable','üzemképesség'),
    T('op_mode','üzemelési jellemző (üzemi, tartalék)'),
    T('location','üzemelési hely (központi kompresszor ház, eltérő üzemrészben, stb.)'),
    S('working','a berendezés működőképes', OPT_WORKING),
  ],

  // --- N2 generátor ---
  'N2 generátor': [
    T('manufacturer','gyártó'),
    T('model','típus'),
    T('pressure','nyomás'),
    T('power','teljesítmény'),
    T('purity','N2 tisztaság (%) / fokozat / maradék O2'),
    T('year','gyártási év'),
    T('serial','gyártási szám'),
    T('control','vezérlés'),
    T('media_qty','töltet mennyiség'),
    T('operable','üzemképesség'),
    T('op_mode','üzemelési jellemző (üzemi, tartalék)'),
    T('location','üzemelési hely (központi kompresszor ház, eltérő üzemrészben, stb.)'),
    S('working','a berendezés működőképes', OPT_WORKING),
  ],

  // --- O2 generátor ---
  'O2 generátor': [
    T('manufacturer','gyártó'),
    T('model','típus'),
    T('pressure','nyomás'),
    T('power','teljesítmény'),
    T('purity','O2 tisztaság / maradék N2'),
    T('year','gyártási év'),
    T('serial','gyártási szám'),
    T('control','vezérlés'),
    T('media_qty','töltet mennyiség'),
    T('operable','üzemképesség'),
    T('op_mode','üzemelési jellemző (üzemi, tartalék)'),
    T('location','üzemelési hely (központi kompresszor ház, eltérő üzemrészben, stb.)'),
    S('working','a berendezés működőképes', OPT_WORKING),
  ],

  // --- Csapadékleválasztó ---
  'Csapadékleválasztó': [
    T('manufacturer','gyártó'),
    T('model','típus'),
    T('pressure','nyomás'),
    T('power','teljesítmény'),
    T('port_size','csatalkozó méret'),
    T('drain','kondenzleeresztő'),
    S('working','az eszköz működőképes', OPT_WORKING),
  ],

  // --- Előszűrő ---
  'Előszűrő (részecske szűrő)': [
    T('manufacturer','gyártó'),
    T('model','típus'),
    T('pressure','nyomás'),
    T('power','teljesítmény'),
    T('port_size','csatalkozó méret'),
    T('drain','kondenzleeresztő'),
    S('working','az eszköz működőképes', OPT_WORKING),
  ],

  // --- Mikroszűrő ---
  'Mikroszűrő (olaj szűrő)': [
    T('manufacturer','gyártó'),
    T('model','típus'),
    T('pressure','nyomás'),
    T('power','teljesítmény'),
    T('port_size','csatalkozó méret'),
    T('drain','kondenzleeresztő'),
    S('working','az eszköz működőképes', OPT_WORKING),
  ],

  // --- Aktívszén-szűrő ---
  'Aktívszén-szűrő (olaj szűrő)': [
    T('manufacturer','gyártó'),
    T('model','típus'),
    T('pressure','nyomás'),
    T('power','teljesítmény'),
    T('port_size','csatalkozó méret'),
    T('drain','kondenzleeresztő'),
    S('working','az eszköz működőképes', OPT_WORKING),
  ],

  // --- Aktívszén adszorber ---
  'Aktívszén adszorber': [
    T('manufacturer','gyártó'),
    T('model','típus'),
    T('pressure','nyomás'),
    T('power','teljesítmény'),
    T('port_size','csatalkozó méret'),
    T('drain','kondenzleeresztő'),
    S('working','az eszköz működőképes', OPT_WORKING),
  ],

  // --- Katalitikus konverter ---
  'Katalitikus konverter': [
    T('manufacturer','gyártó'),
    T('model','típus'),
    T('pressure','nyomás'),
    T('power','teljesítmény'),
    T('year','gyártási év'),
    T('serial','gyártási szám'),
    T('insulation','szigetelés'),
    T('control','vezérlés (ciklusidő/harmatpont alapú)'),
    T('media','töltet fajtája'),
    T('media_qty','töltet mennyiség'),
    T('operable','üzemképesség'),
    T('op_mode','üzemelési jellemző (üzemi, tartalék)'),
    T('location','üzemelési hely (központi kompresszor ház, eltérő üzemrészben, stb.)'),
    S('working','a berendezés működőképes', OPT_WORKING),
  ],

  // --- Steril szűrő ---
  'Steril szűrő': [
    T('manufacturer','gyártó'),
    T('model','típus'),
    T('pressure','nyomás'),
    T('power','teljesítmény'),
    T('port_size','csatalkozó méret'),
    T('drain','kondenzleeresztő'),
    S('working','az eszköz működőképes', OPT_WORKING),
  ],

  // --- Légtartály / N2 tartály – csak hivatkozás a külön jegyzőkönyvre ---
  'Légtartály': [
    T('ref','lsd. Nyomástartó edény állapotfelmérési jegyzőkönyv'),
  ],
  'N2 tartály': [
    T('ref','lsd. Nyomástartó edény állapotfelmérési jegyzőkönyv'),
  ],

  // --- Kondenzátum leeresztő ---
  'Kondenzátum leeresztő': [
    T('note_any','(akkor is rögzíteni, ha nincs / csak golyóscsap)'),
    T('manufacturer','gyártó'),
    T('model','típus'),
    T('pressure','nyomás'),
    T('power','teljesítmény'),
    T('year','gyártási év'),
    T('serial','gyártási szám'),
    T('insulation','szigetelés'),
    T('operable','üzemképesség'),
    T('op_mode','üzemelési jellemző (üzemi, tartalék)'),
    T('location','üzemelési hely (központi kompresszor ház, eltérő üzemrészben, stb.)'),
    S('working','a berendezés működőképes', OPT_WORKING),
  ],

  // --- Kondenzátum szétválasztó ---
  'Kondenzátum szétválasztó': [
    T('manufacturer','gyártó'),
    T('model','típus'),
    T('power','teljesítmény'),
    T('year','gyártási év'),
    T('serial','gyártási szám'),
    T('drain_to','kondenzátum elvezetése'),
    T('operable','üzemképesség'),
    T('op_mode','üzemelési jellemző (üzemi, tartalék)'),
    T('location','üzemelési hely (központi kompresszor ház, eltérő üzemrészben, stb.)'),
    T('tray','kármentő tálca'),
    S('working','a berendezés működőképes', OPT_WORKING),
  ],

  // --- Felülrendelt vezérlés ---
  'Felülrendelt vezérlés': [
    T('manufacturer','gyártó'),
    T('model','típus'),
    T('year','gyártási év'),
    T('serial','gyártási szám'),
    T('operable','üzemképesség'),
    T('op_mode','üzemelési jellemző (üzemóra alapú, energiahatékonyság alapú)'),
    T('location','üzemelési hely (központi kompresszor ház, eltérő üzemrészben, stb.)'),
    S('working','a berendezés működőképes', OPT_WORKING),
  ],
};

// === ÚJ: egyszerű (géptípus nélküli) instance ===
export type SimpleDetailInstance = {
  id: string;
  title: string;   // "Rendszer 1", "Tartály 2", stb.
  open: boolean;
  fields: ModuleField[];
};

export type SystemDetailElement = BaseElement & {
  type: 'module_system_detail';
  instances: SimpleDetailInstance[];
};

export type TankDetailElement = BaseElement & {
  type: 'module_tank_detail';
  instances: SimpleDetailInstance[];
};

// --- helper-ek maradhatnak: T(), S() ---

// === ÚJ: RENDSZER sablon a képek/brief alapján ===
export const SYSTEM_TEMPLATE: FieldSpec[] = [
  T('usage_area', 'felhasználási terület vagy berendezés megnevezése'),
  T('consumption', 'felhasznált mennyiség'),
  T('compressor_pmax', 'kompresszorok maximális nyomása', 'bar'),
  T('system_pressure', 'rendszer nyomás', 'bar'),
  T('user_pressure', 'felhasználói nyomásigény', 'bar'),

  // ISO 8573 – egységes egyválasztós mezők
  S('iso_class_solid', 'ISO 8573 – szilárd szennyeződés', ['1','2','3','4','5','6']),
  S('iso_class_dew', 'ISO 8573 – nyomás alatti harmatpont', ['1','2','3','4','5','6']),
  S('iso_class_oil', 'ISO 8573 – olajtartalom', ['1','2','3','4']),

  // Problémák blokk (szöveges)
  T('prob_flow', 'légszállítás'),
  T('prob_pressure', 'nyomás'),
  T('prob_solid', 'szilárd szennyeződés'),
  T('prob_dew', 'nyomás alatti harmatpont'),
  T('prob_oil', 'olajtartalom'),
  T('prob_noise', 'zajszint'),
  T('prob_other', 'egyéb megjegyzés'),

  // Képek helye – szabad szöveg (ha akarsz, később FileUploaderre cseréljük)
  T('photos', 'Fotók helye'),
];

// === ÚJ: TARTÁLY sablon a képek/brief alapján ===
export const TANK_TEMPLATE: FieldSpec[] = [
  T('manufacturer', 'gyártó'),
  T('model', 'típus'),
  T('volume', 'űrtartalom', 'l'),
  T('pressure', 'nyomás', 'bar'),
  T('year', 'gyártási év'),
  T('serial', 'gyártási szám'),
  T('temp_limits', 'üzemelési hőmérséklet határok'),
  T('finish', 'kivitel (festett / horganyzott)'),

  // Közeg / felállítás / kondenzleeresztés – egyválasztós
  S('medium', 'közeg', ['sűrített levegő','nitrogén','szárítóközeg']),
  S('placement', 'felállítási hely', ['kültér','beltér']),
  S('condensate_drain', 'kondenzátum leeresztés', [
    'nincs','golyóscsap','idővezérelt','automata','automata - fűtött'
  ]),
];




// --- 2) Szekció sablonok (rövidítve – a lényeges mezőkkel és típusokkal) ----



const SEC3: SectionSpec = {
  code: 3,
  title: 'Sűrített levegő általános jellemzői',
  fields: [
    T('consumption', 'felhasznált mennyiség', 'm³/min'),
    T('compressor_pmax', 'kompresszorok maximális nyomása', 'bar'),
    T('system_pressure', 'rendszer nyomás', 'bar'),
    T('user_pressure', 'felhasználói nyomásigény', 'bar'),
    T('iso_solid', 'ISO 8573 – szilárd szennyeződés', 'µm / mg/m³'),
    T('iso_dew',   'ISO 8573 – nyomás alatti harmatpont', '°C'),
    T('iso_oil',   'ISO 8573 – olajtartalom', 'mg/m³'),
    // Problémák – SZÖVEG + INK
    T('prob_flow',     'Problémák – légszállítás'),
    T('prob_pressure', 'Problémák – nyomás'),
    T('prob_solid',    'Problémák – szilárd szennyeződés'),
    T('prob_dew',      'Problémák – nyomás alatti harmatpont'),
    T('prob_oil',      'Problémák – olajtartalom'),
    T('prob_noise',    'Problémák – zajszint'),
    T('prob_other',    'Problémák – egyéb megjegyzés'),
  ],
  photoKey: 'photos_3',
};

// ===== 4.0 – Sűrített levegő hálózat =====
const SEC4: SectionSpec = {
  code: 4,
  title: 'Sűrített levegő hálózat',
  fields: [
    T('age', 'kora'),
    T('material', 'anyaga'),
    T('size', 'mérete'),
    S('indoor_only', 'csak épületen belül', ['igen','nem']),
    S('outdoor_too', 'épületen kívül is',  ['igen','nem']),
    T('note', 'egyéb megjegyzés'), // SZÖVEG + INK
  ],
  photoKey: 'photos_4',
};

// ===== 5.0 – Kondenzátum kezelés =====
const SEC5: SectionSpec = {
  code: 5,
  title: 'Kondenzátum kezelés',
  fields: [
    M('drain_types', 'leeresztések', [
      'csapadékleválasztó – automata leeresztő a kompresszorban (van)',
      'csapadékleválasztó – automata leeresztő a kompresszorban (nincs)',
      'kézi leeresztés', 'idővezérelt leeresztés', 'automata (zero-loss)'
    ]),
    S('oil_water_sep', 'olaj-víz szétválasztó', ['van','nincs']),
    S('tray',          'kármentő tálca', ['van','nincs']),
    T('note',          'egyéb megjegyzés'), // SZÖVEG + INK
  ],
  photoKey: 'photos_5',
};

// ===== 6.0 – Hővisszanyerés =====
const SEC6: SectionSpec = {
  code: 6,
  title: 'Hővisszanyerés',
  fields: [
    S('status', 'állapot', ['van','nincs','nincs, de érdekel a lehetőség','nincs, de nem is érdekes']),
    M('uses', 'felhasználás', ['fűtés','technológiai melegvíz','szociális ellátás']),
    T('note', 'egyéb megjegyzés'), // SZÖVEG + INK
  ],
  photoKey: 'photos_6',
};

// ===== 7.0 – Légcsatorna rendszer =====
const SEC7: SectionSpec = {
  code: 7,
  title: 'Légcsatorna rendszer',
  fields: [
    S('status', 'állapot', ['van','nincs','nincs, de tervezik']),
    M('features', 'jellemzők', [
      'manuális szabályozású',
      'termosztát vezérelt',
      'PLC vezérelt',
      'lemezcsatorna',
      'szigetelt lemezcsatorna',
      'anyagában szigetelt csatorna'
    ]),
    T('note', 'egyéb megjegyzés'), // SZÖVEG + INK
  ],
  photoKey: 'photos_7',
};

// ===== 8.0 – Felülrendelt vezérlés =====
const SEC8: SectionSpec = {
  code: 8,
  title: 'Felülrendelt vezérlés',
  fields: [
    S('status', 'állapot', ['van','nincs','nincs, de tervezik']),
    T('type', 'típus'),
    S('eq_load', 'van egyenlő kiterheltség szerint', ['igen','nem']),
    S('energy_opt', 'van energiahatékonyság szerint', ['igen','nem']),
  ],
  photoKey: 'photos_8',
};

// ===== 9.0 – N2 felhasználás =====
const SEC9: SectionSpec = {
  code: 9,
  title: 'N2 felhasználás',
  fields: [
    S('status', 'állapot', ['van','nincs','nincs, de tervezik']),
    T('note', 'egyéb megjegyzés'), // SZÖVEG + INK
  ],
  photoKey: 'photos_9',
};

// ===== 10.0 – O2 felhasználás =====
const SEC10: SectionSpec = {
  code: 10,
  title: 'O2 felhasználás',
  fields: [
    S('status', 'állapot', ['van','nincs','nincs, de tervezik']),
    T('note', 'egyéb megjegyzés'), // SZÖVEG + INK
  ],
  photoKey: 'photos_10',
};

// ===== 11.0 – Épületfelügyeleti rendszer =====
const SEC11: SectionSpec = {
  code: 11,
  title: 'Épületfelügyeleti rendszer',
  fields: [
    S('status', 'állapot', ['van','nincs','nincs, de tervezik']),
    T('note', 'egyéb megjegyzés'), // SZÖVEG + INK
  ],
  photoKey: 'photos_11',
};

// ===== 12.0 – Távfelügyelet =====
const SEC12: SectionSpec = {
  code: 12,
  title: 'Távfelügyelet',
  fields: [
    S('status', 'állapot', ['van','nincs','nincs, de tervezik']),
    T('note', 'egyéb megjegyzés'), // SZÖVEG + INK
  ],
  photoKey: 'photos_12',
};

// ===== 13.0 – Telepítés helye =====
const SEC13: SectionSpec = {
  code: 13,
  title: 'Telepítés helye',
  fields: [
    M('place', 'helyszín', [
      'meglévő kompresszorházban',
      'új kompresszorházban',
      'konténerben',
      'alaplapra szerelve'
    ]),
    T('note', 'egyéb megjegyzés'), // SZÖVEG + INK
  ],
  photoKey: 'photos_13',
};

// ===== 14.0 – Rendszerfelügyelet, automatizálás =====
const SEC14: SectionSpec = {
  code: 14,
  title: 'Rendszerfelügyelet, automatizálás',
  fields: [
    S('status', 'állapot', ['van','nincs','nincs, de tervezik']),
    M('features', 'funkciók', [
      'rendszernyomás (nyomástérkép) – logolással',
      'minőség mérés (részecske, nedvesség, olaj) – logolással',
      'nyomás alatti harmatpont',
      'sűrített levegő sebesség',
      'rendszer automata szabályozása (pl. automata elzárók a redundancia automata üzembe állításához)'
    ]),
    T('other', 'egyéb'), // SZÖVEG + INK
  ],
  photoKey: 'photos_14',
};

// ===== 15.0 – Rendszerdiagnosztikai mérések =====
const SEC15: SectionSpec = {
  code: 15,
  title: 'Rendszerdiagnosztikai mérések',
  fields: [
    S('air_cons_measure', 'sűrített levegő fogyasztásmérés', ['van','nincs','nincs, de tervezik']),
    S('n2_cons_measure',  'N2 fogyasztásmérés',              ['van','nincs','nincs, de tervezik']),
    S('leak_measure',     'szivárgásmérés',                  ['van','nincs','nincs, de tervezik']),
    T('note', 'egyéb megjegyzés'), // SZÖVEG + INK
  ],
  photoKey: 'photos_15',
};

// ===== 16.0 – Folyamatos rendszeroptimalizálási tanácsadás =====
const SEC16: SectionSpec = {
  code: 16,
  title: 'Folyamatos rendszeroptimalizálási tanácsadás',
  fields: [
    S('status', 'állapot', ['van','nincs','nincs, de tervezik']),
    M('topics', 'témák', [
      'tanácsadás a berendezések átállításához (mért adatok alapján)',
      'minőség mérés (részecske, nedvesség, olaj) – logolással, karbantartási tanácsok',
      'változások optimális kielégítése a működés módosításával',
      'beruházás előtt kapacitások felülvizsgálata (üzembiztonság / energiahatékonyság fókusz)'
    ]),
    T('note', 'egyéb megjegyzés'), // SZÖVEG + INK
  ],
  photoKey: 'photos_16',
};

// ===== 17.0 – Energiahatékonyság =====
const SEC17: SectionSpec = {
  code: 17,
  title: 'Energiahatékonyság',
  fields: [
    T('power_price', 'villamos áram díja', 'kW/Ft'),
    T('cost_info', 'rendelkeznek-e adattal a sűrített levegő előállítási költségéről?', 'm³/x bar'),
    T('note', 'egyéb megjegyzés'), // SZÖVEG + INK
    S('improve_info', 'rendelkeznek-e információval az energiahatékonyság javításának lehetőségeiről?', ['igen','nem']),
    S('ekr_tao_info', 'rendelkeznek-e információval az EKR rendszerről és TAO kedvezményekről?', ['igen','nem']),
    S('leak_loss_info', 'rendelkeznek-e információval a szivárgási veszteségekről?', ['igen','nem']),
  ],
  photoKey: 'photos_17',
};

// ===== 18.0 – Szolgáltatások, amik érdekelhetik az Ügyfelet =====
const SEC18: SectionSpec = {
  code: 18,
  title: 'Szolgáltatások amik érdekelhetik az Ügyfelet',
  fields: [
    M('services', 'szolgáltatások', [
      'koncepció terv','tervezés','kivitelezés','értékesítés',
      'sűrített levegő fogyasztásmérés','N2 fogyasztásmérés','szivárgásmérés','sűrített levegő eladás'
    ]),
    T('note', 'egyéb megjegyzés'), // SZÖVEG + INK
  ],
  photoKey: 'photos_18',
};

export const SYSTEM_SECTIONS: SectionSpec[] = [
  SEC3, SEC4, SEC5, SEC6, SEC7, SEC8, SEC9, SEC10, SEC11, SEC12, SEC13
  //  , SEC14, SEC15, SEC16, SEC17, SEC18
];