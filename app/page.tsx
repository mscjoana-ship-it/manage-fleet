'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Unit {
  id?: string;
  client_name: string;
  machine_model: string;
  serial_number: string;
  leasing_plan: string;
  location: string;
  toner_percentage: number;
  drum_life: number;
  error_code: string | null;
  counter_total: number;
}

export default function FleetDashboard() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Unit>({
    client_name: '',
    machine_model: '',
    serial_number: '',
    leasing_plan: 'Full Lease',
    location: '',
    toner_percentage: 100,
    drum_life: 100,
    error_code: null,
    counter_total: 0,
  });

  useEffect(() => {
    fetchUnits();
  }, []);

  async function fetchUnits() {
    const { data, error } = await (supabase.from('fleet_units') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Error:', error.message);
    } else if (data) {
      setUnits(data as Unit[]);
    }
  }

  async function handleAddUnit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      client_name: formData.client_name,
      machine_model: formData.machine_model,
      serial_number: formData.serial_number,
      leasing_plan: formData.leasing_plan,
      location: formData.location,
      toner_percentage: Number(formData.toner_percentage),
      drum_life: Number(formData.drum_life),
      error_code: formData.error_code || null,
      counter_total: Number(formData.counter_total),
    };

    const { error } = await (supabase.from('fleet_units') as any).insert([payload]);

    setLoading(false);

    if (error) {
      alert('Error adding unit: ' + error.message);
    } else {
      setIsModalOpen(false);
      setFormData({
        client_name: '',
        machine_model: '',
        serial_number: '',
        leasing_plan: 'Full Lease',
        location: '',
        toner_percentage: 100,
        drum_life: 100,
        error_code: null,
        counter_total: 0,
      });
      fetchUnits();
    }
  }

  const filtered = units.filter(
    (u) =>
      (u.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.serial_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.machine_model || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fleet Monitor</h1>
          <p className="text-sm text-gray-500">Live operational overview of client units</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search client, serial, or model..."
            className="px-4 py-2 border rounded-md text-sm w-full md:w-64 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm rounded-md shadow-sm transition-colors whitespace-nowrap"
          >
            + Add Unit
          </button>
        </div>
      </header>

      {/* Main Table */}
      <main className="max-w-7xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Client & Model</th>
              <th className="py-3 px-4">Serial & Plan</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Toner %</th>
              <th className="py-3 px-4">Drum Life %</th>
              <th className="py-3 px-4">Counter</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500 text-sm">
                  No machines found. Click <strong>"+ Add Unit"</strong> to add your first machine.
                </td>
              </tr>
            ) : (
              filtered.map((u, idx) => (
                <tr key={u.id || idx} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-semibold text-gray-900">{u.client_name}</div>
                    <div className="text-xs text-gray-500">{u.machine_model}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-mono text-xs text-gray-700">{u.serial_number}</div>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-gray-100 rounded text-gray-600 mt-1">
                      {u.leasing_plan}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{u.location}</td>
                  <td className="py-4 px-4">
                    <ProgressBar value={u.toner_percentage} />
                  </td>
                  <td className="py-4 px-4">
                    <ProgressBar value={u.drum_life} />
                  </td>
                  <td className="py-4 px-4 font-mono text-xs">{(u.counter_total || 0).toLocaleString()}</td>
                  <td className="py-4 px-4">
                    {u.error_code ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                        Error: {u.error_code}
                      </span>
                    ) : u.toner_percentage <= 15 ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Low Toner
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Ready
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </main>

      {/* Add Unit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Add New Machine Unit</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-semibold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUnit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Client Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Speedcom Corp"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Machine Model</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bizhub C360i"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    value={formData.machine_model}
                    onChange={(e) => setFormData({ ...formData, machine_model: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SN-884920"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Leasing Plan</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    value={formData.leasing_plan}
                    onChange={(e) => setFormData({ ...formData, leasing_plan: e.target.value })}
                  >
                    <option value="Full Lease">Full Lease</option>
                    <option value="Cost-per-Page">Cost-per-Page</option>
                    <option value="Rent-to-Own">Rent-to-Own</option>
                    <option value="Short-term Rental">Short-term Rental</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Location / Department</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gilmore HQ - QC"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Toner %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    value={formData.toner_percentage}
                    onChange={(e) => setFormData({ ...formData, toner_percentage: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Drum Life %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    value={formData.drum_life}
                    onChange={(e) => setFormData({ ...formData, drum_life: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Initial Counter</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    value={formData.counter_total}
                    onChange={(e) => setFormData({ ...formData, counter_total: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Error Code (Optional)</label>
                <input
                  type="text"
                  placeholder="Leave empty if operational (e.g. C-0204)"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none uppercase"
                  value={formData.error_code || ''}
                  onChange={(e) => setFormData({ ...formData, error_code: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const color = value <= 15 ? 'bg-red-500' : value <= 30 ? 'bg-amber-500' : 'bg-teal-500';
  return (
    <div className="w-28">
      <div className="flex justify-between text-xs mb-1 font-mono">
        <span>{value}%</span>
      </div>
      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}