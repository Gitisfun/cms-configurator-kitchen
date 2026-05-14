import { extractPlinthImage, type PlinthWithImage } from './plinthImage';
import { extractFrontPriceClass } from './frontPriceClass';
import { extractHandlePositionsRelations } from './handlePositionRelation';
import { formatDepthOptionCabinetTypesLabel } from './depthOptionCabinetTypes';
import { formatSubcategoryParentLine } from './subcategoryParent';
import type { CabinetTypeSurchargeDimension } from '../models/cabinet-type-surcharge';
import type { DepthOption } from '../models/depth-option';

const DIMENSION_LABEL: Record<CabinetTypeSurchargeDimension, string> = {
  height: 'Height',
  width: 'Width',
  depth: 'Depth',
};

class TableHelpers {
  static codeCell(code: string | null | undefined): string {
    const t = code?.trim();
    return t ? t : '—';
  }

  /** @param fallback – shown when color is blank (default '—', use 'white' for backs) */
  static colorLabel(color: string | null | undefined, fallback = '—'): string {
    const t = color?.trim();
    return t ? t : fallback;
  }

  static descriptionPreview(text: string | null | undefined, max = 72): string {
    if (!text) return '—';
    const t = text.trim();
    if (!t) return '—';
    if (t.length <= max) return t;
    return `${t.slice(0, max)}…`;
  }

  static rowImageSrc(row: PlinthWithImage, strapiBase: string): string | null {
    return extractPlinthImage(row, strapiBase).src;
  }

  static priceClassLabel(f: { priceClass?: unknown }): string {
    const pc = extractFrontPriceClass(f);
    if (!pc.name) return '—';
    if (pc.level != null) return `${pc.name} (${pc.level})`;
    return pc.name;
  }

  static handlePositionLabel(h: { handlePositions?: unknown }): string {
    const names = extractHandlePositionsRelations(h)
      .map((hp) => hp.name)
      .filter((n): n is string => typeof n === 'string' && n.trim() !== '');
    return names.length ? names.join(', ') : '—';
  }

  static formatDimension(d: CabinetTypeSurchargeDimension | null | undefined): string {
    if (d == null) return '—';
    return DIMENSION_LABEL[d] ?? String(d);
  }

  static cabinetTypesLabel(opt: DepthOption): string {
    return formatDepthOptionCabinetTypesLabel(opt);
  }

  static subcategoryParentLine(sub: { category?: unknown; parent?: unknown }): string {
    return formatSubcategoryParentLine(sub);
  }
}

export default TableHelpers;
