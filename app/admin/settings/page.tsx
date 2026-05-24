'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminMenu from '@/components/admin/menu/AdminMenu';
import { Regulation, RegulationSnapshot, regulationsApi, validateRegulation } from '@/lib/api/regulations';

export default function AdminSettingsPage() {
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [snapshots, setSnapshots] = useState<RegulationSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [snapshotErrorMessage, setSnapshotErrorMessage] = useState<string | null>(null);
  
  const token = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem('token') || localStorage.getItem('authToken');
  }, []);

  useEffect(() => {
    const loadRegulations = async () => {
      setLoading(true);
      setErrorMessage(null);
      setSnapshotErrorMessage(null);
      try {
        const [data, snapshotData] = await Promise.all([
          regulationsApi.getRegulations(token || undefined),
          regulationsApi.getSnapshots(token || undefined).catch((error) => {
            console.error('Không thể tải lịch sử snapshot quy định:', error);
            setSnapshotErrorMessage('Không thể tải lịch sử thay đổi quy định. Vui lòng thử lại sau.');
            return [];
          }),
        ]);
        setRegulations(data);
        setSnapshots(snapshotData);
      } catch {
        setErrorMessage('Không thể tải cấu hình quy định. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    loadRegulations();
  }, [token]);

  const handleFieldChange = (key: string, field: keyof Regulation, value: string | boolean) => {
    setRegulations((current) =>
      current.map((item) =>
        item.regulationKey === key
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const handleSave = async (regulation: Regulation) => {
    setErrorMessage(null);
    const validationError = validateRegulation(regulation);

    if (validationError) {
      setErrorMessage(`Lỗi xác thực: ${validationError.message}`);
      return;
    }

    setSavingKey(regulation.regulationKey);

    try {
      const saved = await regulationsApi.saveRegulation(regulation.regulationKey, regulation, token || undefined);
      setRegulations((current) => current.map((item) => (item.regulationKey === saved.regulationKey ? saved : item)));
      regulationsApi.getSnapshots(token || undefined)
        .then((snapshotData) => {
          setSnapshots(snapshotData);
          setSnapshotErrorMessage(null);
        })
        .catch((error) => {
          console.error('Không thể tải lại lịch sử snapshot quy định:', error);
          setSnapshotErrorMessage('Đã lưu quy định, nhưng không thể tải lại lịch sử thay đổi.');
        });
    } catch (error: unknown) {
      const backendError = error instanceof Error
        ? error.message
        : 'Unable to save regulation. Please check the backend connection.';
      setErrorMessage(backendError);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <AdminMenu />

      <main className="ml-[280px] px-8 py-6">
        <div className="max-w-7xl space-y-4">
          <div className="rounded-xl bg-gradient-to-br from-[#0B1B3F] via-[#0E264F] to-[#0A3D8F] px-5 py-4 text-white">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFCC00]" />
              CheckInn Admin
            </div>
            <h1 className="mt-2 text-2xl font-semibold">Quản lý quy định hệ thống</h1>
          </div>

          <div className="rounded-2xl border border-[#E8E9F1] bg-white p-6 text-sm text-[#383E48] shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
            <p className="mb-4 text-base text-[#202634]">
              Tất cả quy định đang được load từ backend. Thay đổi ở đây sẽ được lưu vào dịch vụ regulations-service, tạo snapshot và gửi event cập nhật.
            </p>

            {loading ? (
              <p>Đang tải cấu hình...</p>
            ) : (
              <div className="space-y-6">
                {errorMessage ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{errorMessage}</div>
                ) : null}

                {regulations.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-slate-500">
                    Không tìm thấy quy định. Hãy kiểm tra backend regulations-service và thử lại.
                  </div>
                ) : (
                  regulations.map((regulation) =>{
                    const validationError = validateRegulation(regulation);
                    return (
                    <div key={regulation.regulationKey} className="rounded-2xl border border-[#E8E9F1] bg-[#F8FAFF] p-5 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{regulation.regulationKey}</p>
                          <h2 className="mt-1 text-lg font-semibold text-slate-900">{regulation.name}</h2>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={
                              savingKey === regulation.regulationKey ||
                              validationError !== null
                            }
                            onClick={() => handleSave(regulation)}
                            className="rounded-full bg-[#0B1B3F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#091730] disabled:cursor-not-allowed disabled:bg-[#8f9bb4]"
                          >
                            {savingKey === regulation.regulationKey ? 'Đang lưu...' : 'Lưu thay đổi'}
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <label className="space-y-2 text-sm text-slate-700">
                          <span>Tên quy định</span>
                          <input
                            value={regulation.name}
                            onChange={(event) => handleFieldChange(regulation.regulationKey, 'name', event.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-[#0B1B3F]"
                          />
                        </label>

                        <label className="space-y-2 text-sm text-slate-700">
                          <span>
                            Giá trị
                            {validationError && (
                              <span className="ml-2 text-red-500 font-semibold">*</span>
                            )}
                          </span>
                          <input
                            value={regulation.value}
                            onChange={(event) => handleFieldChange(regulation.regulationKey, 'value', event.target.value)}
                            className={`w-full rounded-xl border bg-white px-3 py-2 outline-none focus:border-[#0B1B3F] ${
                              validationError
                                ? 'border-red-400 focus:border-red-500'
                                : 'border-slate-300'
                            }`}
                            placeholder="0.00"
                          />
                          {validationError && (
                            <p className="mt-1 text-xs text-red-500">{validationError ?.message}</p>
                          )}
                        </label>

                        <label className="space-y-2 text-sm text-slate-700 lg:col-span-2">
                          <span>Mô tả</span>
                          <textarea
                            value={regulation.description || ''}
                            onChange={(event) => handleFieldChange(regulation.regulationKey, 'description', event.target.value)}
                            rows={3}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-[#0B1B3F]"
                          />
                        </label>

                        <label className="flex items-center gap-3 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={regulation.active}
                            onChange={(event) => handleFieldChange(regulation.regulationKey, 'active', event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-[#0B1B3F] focus:ring-[#0B1B3F]"
                          />
                          <span>Kích hoạt quy định</span>
                        </label>
                      </div>
                    </div>
                  );
                  })
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#E8E9F1] bg-white p-6 text-sm text-[#383E48] shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
            <div className="mb-4 flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-[#202634]">Lịch sử thay đổi quy định</h2>
              <p className="text-sm text-slate-500">
                Snapshot được tạo sau mỗi lần lưu quy định thành công.
              </p>
            </div>

            {loading ? (
              <p>Đang tải lịch sử...</p>
            ) : snapshotErrorMessage ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-700">
                {snapshotErrorMessage}
              </div>
            ) : snapshots.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-slate-500">
                Chưa có snapshot quy định nào.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Quy định</th>
                      <th className="px-4 py-3">Phiên bản</th>
                      <th className="px-4 py-3">Người thay đổi</th>
                      <th className="px-4 py-3">Thời gian</th>
                      <th className="px-4 py-3">Snapshot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {snapshots.map((snapshot, index) => (
                      <tr key={`${snapshot.regulationKey}-${snapshot.version}-${snapshot.appliedAt}-${index}`}>
                        <td className="px-4 py-3 align-top">
                          <div className="font-semibold text-slate-900">{snapshot.regulationName}</div>
                          <div className="mt-1 text-xs text-slate-500">{snapshot.regulationKey}</div>
                        </td>
                        <td className="px-4 py-3 align-top text-slate-700">v{snapshot.version}</td>
                        <td className="px-4 py-3 align-top text-slate-700">{snapshot.sourceUser || 'system'}</td>
                        <td className="px-4 py-3 align-top text-slate-700">
                          {new Date(snapshot.appliedAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="max-w-[360px] px-4 py-3 align-top">
                          <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
                            {snapshot.snapshotData}
                          </pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
