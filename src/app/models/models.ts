// src/app/models/models.ts
export interface Matiere {
  id?:                number;
  nom:                string;
  objectifHeures?:    number;
  objectifHebdoHeures?: number;
  priorite:           'haute' | 'moyenne' | 'basse' | number;
  couleur?:           string;
  progression?:       number;
}

export interface Disponibilite {
  id?:        number;
  jour:       string;
  actif?:     boolean;
  heureDebut: string;
  heureFin:   string;
  creneaux?:  Creneau[];
}

export interface Creneau {
  debut: string;
  fin:   string;
}