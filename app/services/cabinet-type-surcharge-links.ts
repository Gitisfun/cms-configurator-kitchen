import type {
  CabinetTypeSurchargeLinkDocumentResponse,
  CabinetTypeSurchargeLinksResponse,
} from '../models/cabinet-type-surcharge-link';

export type {
  CabinetTypeSurchargeLink,
  CabinetTypeSurchargeLinksResponse,
  CabinetTypeSurchargeLinkDocumentResponse,
} from '../models/cabinet-type-surcharge-link';

export const cabinetTypeSurchargeLinksListPath = '/api/cabinet-type-surcharge-links' as const;

export interface SurchargeLinkPriceInput {
  priceClassId: number;
  price: number | string;
}

export interface CreateSurchargeLinkBody {
  cabinetTypeId: number;
  surchargeId: number;
  prices: SurchargeLinkPriceInput[];
}

export interface UpdateSurchargeLinkBody {
  prices: SurchargeLinkPriceInput[];
}

export function getCabinetTypeSurchargeLinksForCabinetType(cabinetTypeNumericId: number, pageSize = 200) {
  return $fetch<CabinetTypeSurchargeLinksResponse>(cabinetTypeSurchargeLinksListPath, {
    query: {
      'filters[cabinetType][id][$eq]': cabinetTypeNumericId,
      'pagination[page]': 1,
      'pagination[pageSize]': pageSize,
      'populate[surcharge]': 'true',
      'populate[prices][populate][priceClass]': 'true',
      'populate[cabinetType]': 'true',
    },
  });
}

export function createCabinetTypeSurchargeLink(body: CreateSurchargeLinkBody) {
  return $fetch<CabinetTypeSurchargeLinkDocumentResponse>(cabinetTypeSurchargeLinksListPath, {
    method: 'POST',
    body,
  });
}

export function updateCabinetTypeSurchargeLink(documentId: string, body: UpdateSurchargeLinkBody) {
  return $fetch<CabinetTypeSurchargeLinkDocumentResponse>(
    `${cabinetTypeSurchargeLinksListPath}/${encodeURIComponent(documentId)}`,
    {
      method: 'PUT',
      body,
    },
  );
}

export function deleteCabinetTypeSurchargeLink(documentId: string) {
  return $fetch(`${cabinetTypeSurchargeLinksListPath}/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  });
}
