import {
  rootFORM,
  rootJSON,
  middleNodeFORM,
  middleNodeJSON,
  rootURL,
  middleNodeURL,
} from '@/axios';

import type { CancelToken } from 'axios';

// 上传接口
export const uploadUrl = `${middleNodeURL}/upload/file`;

export function axiosIndexData(): Promise<indexDataResponse> {
  return rootJSON.get('/indexData');
}

export function axiosEmailTemplate(): Promise<emailTemplateResponse> {
  return rootJSON.get('/emailTemplate');
}

export function axiosGetHistory(): Promise<getHistoryResponse> {
  return rootJSON.get('/getHistory');
}

export function axiosSetHistory(
  data: setHistoryRequest
): Promise<setHistoryResponse> {
  return rootJSON.post('/setHistory', data);
}

export function axiosOpen({ path }: setOpenRequest): Promise<setOpenResponse> {
  return rootJSON.get('/open', {
    params: {
      path,
    },
  });
}

export function axiosImport({
  path,
  cancelToken,
}: setImportRequest<CancelToken>): Promise<setImportResponse> {
  return rootJSON.post('/import', { path }, { cancelToken });
}

export function axiosExport({
  path,
  cancelToken,
}: setExportRequest<CancelToken>): Promise<setExportResponse> {
  return rootJSON.post('/export', { path }, { cancelToken });
}

export function axiosGarbage(): Promise<setGarbageResponse> {
  return rootJSON.get('/garbage');
}

/**
 * 中间服务器的接口
 */

export function axiosSendEmail(data: any): Promise<sendEmailResponse> {
  return middleNodeJSON.post('/email/send', data);
}
