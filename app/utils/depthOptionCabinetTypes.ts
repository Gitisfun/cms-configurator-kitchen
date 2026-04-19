import type { CabinetType } from '../models/cabinet-type';
import type { DepthOption } from '../models/depth-option';
import { strapiRelationList } from './strapiRelationList';

export function depthOptionCabinetTypes(opt: DepthOption): CabinetType[] {
  return strapiRelationList<CabinetType>(opt.cabinetTypes);
}

export function depthOptionLinkedToCabinetType(opt: DepthOption, cabinetTypeDocumentId: string): boolean {
  return depthOptionCabinetTypes(opt).some((t) => t.documentId === cabinetTypeDocumentId);
}

export function formatDepthOptionCabinetTypesLabel(opt: DepthOption): string {
  const names = depthOptionCabinetTypes(opt)
    .map((t) => t.name)
    .filter((n) => n && String(n).trim());
  return names.length ? names.join(', ') : '—';
}
