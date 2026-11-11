export class ReportApiError extends Error {
  readonly code:string;
  readonly status:number|null;
  constructor(code:string,status:number|null) {
    const message=code==='REPORT_RECONCILIATION_REQUIRED'
      ? 'Dữ liệu giao dịch chưa đủ hoặc có xung đột. Cần đối soát trước khi lập báo cáo.'
      : status===401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      : status===403 ? 'Bạn không có quyền xem báo cáo này.'
      : status===400 ? 'Khoảng ngày hoặc cách nhóm báo cáo không hợp lệ.'
      : 'Không thể tải dữ liệu báo cáo. Vui lòng thử lại.';
    super(message);this.name='ReportApiError';this.code=code;this.status=status;
  }
}
export function safeReportError(error:unknown):ReportApiError {
  const source=error as {response?:{status?:unknown;data?:{code?:unknown}}};
  const status=typeof source?.response?.status==='number'?source.response.status:null;
  const code=source?.response?.data?.code==='REPORT_RECONCILIATION_REQUIRED'?'REPORT_RECONCILIATION_REQUIRED':'REPORT_UNAVAILABLE';
  return new ReportApiError(code,status);
}
