export type Species = 'dog' | 'cat';
export type PetSize = 'small' | 'medium' | 'large';

export interface Breed {
  id: string;
  name_pt: string;
  name_en: string;
  species: Species;
  size: PetSize;
}

export const breeds: Breed[] = [
  // Cães
  { id: 'labrador', name_pt: 'Labrador Retriever', name_en: 'Labrador Retriever', species: 'dog', size: 'large' },
  { id: 'golden', name_pt: 'Golden Retriever', name_en: 'Golden Retriever', species: 'dog', size: 'large' },
  { id: 'bulldog', name_pt: 'Buldogue Francês', name_en: 'French Bulldog', species: 'dog', size: 'small' },
  { id: 'poodle', name_pt: 'Poodle', name_en: 'Poodle', species: 'dog', size: 'medium' },
  { id: 'shih-tzu', name_pt: 'Shih Tzu', name_en: 'Shih Tzu', species: 'dog', size: 'small' },
  { id: 'yorkshire', name_pt: 'Yorkshire Terrier', name_en: 'Yorkshire Terrier', species: 'dog', size: 'small' },
  { id: 'pastor-alemao', name_pt: 'Pastor Alemão', name_en: 'German Shepherd', species: 'dog', size: 'large' },
  { id: 'border-collie', name_pt: 'Border Collie', name_en: 'Border Collie', species: 'dog', size: 'medium' },
  { id: 'rottweiler', name_pt: 'Rottweiler', name_en: 'Rottweiler', species: 'dog', size: 'large' },
  { id: 'dachshund', name_pt: 'Dachshund (Salsicha)', name_en: 'Dachshund', species: 'dog', size: 'small' },
  { id: 'beagle', name_pt: 'Beagle', name_en: 'Beagle', species: 'dog', size: 'medium' },
  { id: 'pinscher', name_pt: 'Pinscher Miniatura', name_en: 'Miniature Pinscher', species: 'dog', size: 'small' },
  { id: 'pit-bull', name_pt: 'Pit Bull', name_en: 'Pit Bull', species: 'dog', size: 'medium' },
  { id: 'husky', name_pt: 'Husky Siberiano', name_en: 'Siberian Husky', species: 'dog', size: 'large' },
  { id: 'lhasa-apso', name_pt: 'Lhasa Apso', name_en: 'Lhasa Apso', species: 'dog', size: 'small' },
  { id: 'maltese', name_pt: 'Maltês', name_en: 'Maltese', species: 'dog', size: 'small' },
  { id: 'spitz', name_pt: 'Spitz Alemão (Lulu)', name_en: 'German Spitz', species: 'dog', size: 'small' },
  { id: 'cocker', name_pt: 'Cocker Spaniel', name_en: 'Cocker Spaniel', species: 'dog', size: 'medium' },
  { id: 'boxer', name_pt: 'Boxer', name_en: 'Boxer', species: 'dog', size: 'large' },
  { id: 'srd-dog', name_pt: 'SRD (Vira-lata)', name_en: 'Mixed Breed', species: 'dog', size: 'medium' },

  // Gatos
  { id: 'persa', name_pt: 'Persa', name_en: 'Persian', species: 'cat', size: 'medium' },
  { id: 'siames', name_pt: 'Siamês', name_en: 'Siamese', species: 'cat', size: 'medium' },
  { id: 'maine-coon', name_pt: 'Maine Coon', name_en: 'Maine Coon', species: 'cat', size: 'large' },
  { id: 'ragdoll', name_pt: 'Ragdoll', name_en: 'Ragdoll', species: 'cat', size: 'large' },
  { id: 'british-shorthair', name_pt: 'British Shorthair', name_en: 'British Shorthair', species: 'cat', size: 'medium' },
  { id: 'bengal', name_pt: 'Bengal', name_en: 'Bengal', species: 'cat', size: 'medium' },
  { id: 'sphynx', name_pt: 'Sphynx', name_en: 'Sphynx', species: 'cat', size: 'medium' },
  { id: 'scottish-fold', name_pt: 'Scottish Fold', name_en: 'Scottish Fold', species: 'cat', size: 'medium' },
  { id: 'angorá', name_pt: 'Angorá', name_en: 'Angora', species: 'cat', size: 'medium' },
  { id: 'exotico', name_pt: 'Exótico', name_en: 'Exotic Shorthair', species: 'cat', size: 'medium' },
  { id: 'abissinio', name_pt: 'Abissínio', name_en: 'Abyssinian', species: 'cat', size: 'medium' },
  { id: 'noruegues', name_pt: 'Norueguês da Floresta', name_en: 'Norwegian Forest', species: 'cat', size: 'large' },
  { id: 'srd-cat', name_pt: 'SRD (Vira-lata)', name_en: 'Mixed Breed', species: 'cat', size: 'medium' },
];

export const dogBreeds = breeds.filter((b) => b.species === 'dog');
export const catBreeds = breeds.filter((b) => b.species === 'cat');
