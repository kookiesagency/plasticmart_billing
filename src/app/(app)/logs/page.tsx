'use client'

import { createClient } from '@/lib/supabase/client'
import { SetHeader } from '@/components/layout/header-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { CheckCircle, Pencil, Trash, Undo, Trash2 } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { formatISO, parseISO } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import React from 'react'
import { toast } from 'sonner'
import { ConfirmationDialog } from '@/components/confirmation-dialog'

type ActivityLog = {
  id: number;
  created_at: string;
  user_email: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  target_table: string;
  target_id: string;
  details: {
    old_data?: any;
    new_data?: any;
  };
};

function getChanges(oldData: any, newData: any): string[] {
  if (!oldData || !newData) return [];
  
  const changes = [];
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  for (const key of allKeys) {
    if (['created_at', 'updated_at', 'deleted_at'].includes(key)) continue;

    const oldValue = oldData[key];
    const newValue = newData[key];

    if (oldValue !== newValue) {
      changes.push(`Changed <strong>${key}</strong> from "<em>${oldValue}</em>" to "<em>${newValue}</em>"`);
    }
  }
  return changes;
}

function formatLogMessage(log: ActivityLog) {
  const { action, target_table, target_id, details } = log;
  const targetName = target_table.replace(/_/g, ' ').slice(0, -1);
  let targetLink = `/${target_table}/${target_id}`;
  if (target_table === 'units' || target_table === 'app_settings') {
    targetLink = '/settings';
  } else if (target_table === 'items') {
    targetLink = '/items';
  }
  const getTargetIdentifier = () => {
    const data = details.new_data || details.old_data;
    return data?.name || data?.title || data?.imported_names || `#${target_id}`;
  };
  const isImported = details?.new_data?.imported_via === 'import';
  switch (action) {
    case 'INSERT': {
      let msg = `Created a new ${targetName}: <a href="${targetLink}" class="text-blue-500 hover:underline">${getTargetIdentifier()}</a>`;
      if (isImported) {
        msg += ' <span class="ml-2 inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs">imported</span>';
      }
      return msg;
    }
    case 'DELETE':
      return `Deleted ${targetName}: ${getTargetIdentifier()}`;
    case 'UPDATE':
      const changes = getChanges(details.old_data, details.new_data);
      if (changes.length > 0) {
        return `Updated ${targetName} <a href="${targetLink}" class="text-blue-500 hover:underline">${getTargetIdentifier()}</a>: <ul>${changes.map(c => `<li class='ml-4 list-disc'>${c}</li>`).join('')}</ul>`;
      }
      return `Updated ${targetName} <a href="${targetLink}" class="text-blue-500 hover:underline">${getTargetIdentifier()}</a> (no displayable changes).`;
    default:
      return `An action (${action}) was performed on ${targetName}.`;
  }
}

const PAGE_SIZE = 50;

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [tab, setTab] = useState<'active' | 'deleted'>('active');
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[] | null>(null);
  const [bulkRestoreIds, setBulkRestoreIds] = useState<number[] | null>(null);
  const [permanentDeleteId, setPermanentDeleteId] = useState<number | null>(null);
  const [bulkPermanentDeleteIds, setBulkPermanentDeleteIds] = useState<number[] | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const supabase = createClient();
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }
      if (userFilter !== 'all') {
        query = query.eq('user_email', userFilter);
      }
      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        const toDate = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate(), 23, 59, 59, 999);
        query = query.lte('created_at', toDate.toISOString());
      }
      // Filter by deleted_at based on tab
      if (tab === 'active') {
        query = query.is('deleted_at', null);
      } else {
        query = query.not('deleted_at', 'is', null);
      }
      const { data, error } = await query;
      if (!error && data) {
        setLogs(data as ActivityLog[]);
      }
      setLoading(false);
    };
    fetchLogs();
  }, [actionFilter, userFilter, dateRange, tab]);

  // Unique users for filter (fetch from current logs, or you can fetch all users separately for a more complete list)
  const userOptions = Array.from(new Set(logs.map(l => l.user_email).filter(Boolean)));

  // Client-side search and pagination
  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    if (log.user_email && log.user_email.toLowerCase().includes(searchLower)) return true;
    if (log.details && JSON.stringify(log.details).toLowerCase().includes(searchLower)) return true;
    return false;
  });
  const total = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Group logs by date
  const grouped: { [key: string]: typeof paginatedLogs } = {};
  paginatedLogs.forEach(log => {
    const date = new Date(log.created_at);
    let group = 'Earlier';
    if (isToday(date)) group = 'Today';
    else if (isYesterday(date)) group = 'Yesterday';
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(log);
  });

  function getActionIconAndColor(action: string) {
    switch (action) {
      case 'INSERT':
        return { icon: <CheckCircle className="h-4 w-4 text-green-600 mr-2" />, color: 'text-green-700' };
      case 'UPDATE':
        return { icon: <Pencil className="h-4 w-4 text-blue-600 mr-2" />, color: 'text-blue-700' };
      case 'DELETE':
        return { icon: <Trash className="h-4 w-4 text-red-500 mr-2" />, color: 'text-red-700' };
      default:
        return { icon: null, color: '' };
    }
  }

  // Selection logic
  const allIds = paginatedLogs.map(log => log.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.includes(id));
  const someSelected = allIds.some(id => selected.includes(id));
  const toggleSelectAll = () => {
    if (allSelected) setSelected(selected.filter(id => !allIds.includes(id)));
    else setSelected([...selected, ...allIds.filter(id => !selected.includes(id))]);
  };
  const toggleSelect = (id: number) => {
    setSelected(selected => selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id]);
  };
  const clearSelection = () => setSelected([]);

  // Bulk Delete Logic
  const confirmBulkDelete = async () => {
    if (!bulkDeleteIds || bulkDeleteIds.length === 0) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('activity_logs')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', bulkDeleteIds);
    if (error) {
      toast.error(`Failed to delete ${bulkDeleteIds.length} logs.`);
    } else {
      toast.success(`${bulkDeleteIds.length} logs deleted successfully.`);
      setLogs((prev) => prev.filter(log => !bulkDeleteIds.includes(log.id)));
      setPage(1);
    }
    setBulkDeleteIds(null);
    setIsConfirmOpen(false);
    setSelected([]);
  };

  // Bulk Restore Logic
  const confirmBulkRestore = async () => {
    if (!bulkRestoreIds || bulkRestoreIds.length === 0) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('activity_logs')
      .update({ deleted_at: null })
      .in('id', bulkRestoreIds);
    if (error) {
      toast.error(`Failed to restore ${bulkRestoreIds.length} logs.`);
    } else {
      toast.success(`${bulkRestoreIds.length} logs restored successfully.`);
      setLogs((prev) => prev.filter(log => !bulkRestoreIds.includes(log.id)));
      setPage(1);
    }
    setBulkRestoreIds(null);
    setIsConfirmOpen(false);
    setSelected([]);
  };

  // Individual Permanent Delete
  const confirmPermanentDelete = async () => {
    if (!permanentDeleteId) return;
    const supabase = createClient();
    const { error } = await supabase.from('activity_logs').delete().eq('id', permanentDeleteId);
    if (error) {
      toast.error('Failed to permanently delete log.');
    } else {
      toast.success('Log permanently deleted.');
      setLogs((prev) => prev.filter(log => log.id !== permanentDeleteId));
    }
    setPermanentDeleteId(null);
    setIsConfirmOpen(false);
    setSelected(selected.filter(id => id !== permanentDeleteId));
  };

  // Bulk Permanent Delete
  const confirmBulkPermanentDelete = async () => {
    if (!bulkPermanentDeleteIds || bulkPermanentDeleteIds.length === 0) return;
    const supabase = createClient();
    const { error } = await supabase.from('activity_logs').delete().in('id', bulkPermanentDeleteIds);
    if (error) {
      toast.error(`Failed to permanently delete ${bulkPermanentDeleteIds.length} logs.`);
    } else {
      toast.success(`${bulkPermanentDeleteIds.length} logs permanently deleted.`);
      setLogs((prev) => prev.filter(log => !bulkPermanentDeleteIds.includes(log.id)));
    }
    setBulkPermanentDeleteIds(null);
    setIsConfirmOpen(false);
    setSelected(selected.filter(id => !bulkPermanentDeleteIds.includes(id)));
  };

  // Handler for bulk delete action
  const handleBulkDelete = () => {
    setBulkDeleteIds(selected);
    setIsConfirmOpen(true);
  };

  // Handler for bulk restore action
  const handleBulkRestore = () => {
    setBulkRestoreIds(selected);
    setIsConfirmOpen(true);
  };

  // Handler for bulk permanent delete action
  const handleBulkPermanentDelete = () => {
    setBulkPermanentDeleteIds(selected);
    setIsConfirmOpen(true);
  };

  // Handler for individual restore
  const handleRestore = async (id: number) => {
    const supabase = createClient();
    const { error } = await supabase.from('activity_logs').update({ deleted_at: null }).eq('id', id);
    if (error) {
      toast.error('Failed to restore log.');
    } else {
      toast.success('Log restored successfully.');
      setLogs((prev) => prev.filter(log => log.id !== id));
    }
    setSelected(selected.filter(sel => sel !== id));
  };

  return (
    <>
      <SetHeader title="Activity Logs" />
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>A log of the most recent activities in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tabs and Bulk Action Bar in a flex row */}
          <div className="flex items-center justify-between mb-4">
            <Tabs value={tab} onValueChange={v => { setTab(v as 'active' | 'deleted'); clearSelection(); }}>
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="deleted">Deleted</TabsTrigger>
              </TabsList>
            </Tabs>
            {selected.length > 0 && (
              <div className="flex items-center gap-4">
                {tab === 'active' ? (
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete ({selected.length})
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={handleBulkRestore}>
                      <Undo className="mr-2 h-4 w-4" />
                      Restore ({selected.length})
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleBulkPermanentDelete}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Permanently ({selected.length})
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={clearSelection}>Clear</Button>
              </div>
            )}
          </div>
          {/* Confirmation Dialogs */}
          <ConfirmationDialog
            isOpen={Boolean(isConfirmOpen && (bulkDeleteIds || bulkRestoreIds))}
            onClose={() => {
              setIsConfirmOpen(false);
              setBulkDeleteIds(null);
              setBulkRestoreIds(null);
            }}
            onConfirm={() => {
              if (bulkDeleteIds) confirmBulkDelete();
              else if (bulkRestoreIds) confirmBulkRestore();
            }}
            title="Are you sure?"
            description={
              bulkDeleteIds
                ? `This action will mark ${bulkDeleteIds.length} logs as deleted. You can restore them from the Deleted tab within 90 days.`
                : bulkRestoreIds
                ? `This will restore ${bulkRestoreIds.length} logs and make them active again.`
                : ''
            }
          />
          <ConfirmationDialog
            isOpen={isConfirmOpen && !!permanentDeleteId}
            onClose={() => {
              setIsConfirmOpen(false);
              setPermanentDeleteId(null);
            }}
            onConfirm={confirmPermanentDelete}
            title="Are you sure?"
            description="This action is IRREVERSIBLE. This will permanently delete the log."
          />
          {Array.isArray(bulkPermanentDeleteIds) && bulkPermanentDeleteIds.length > 0 && (
            <ConfirmationDialog
              isOpen={isConfirmOpen}
              onClose={() => {
                setIsConfirmOpen(false);
                setBulkPermanentDeleteIds(null);
              }}
              onConfirm={confirmBulkPermanentDelete}
              title="Are you sure?"
              description={`This action is IRREVERSIBLE. This will permanently delete ${bulkPermanentDeleteIds.length} logs.`}
            />
          )}
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6 items-end">
            <div>
              <label className="block text-xs mb-1">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="INSERT">Created</SelectItem>
                  <SelectItem value="UPDATE">Updated</SelectItem>
                  <SelectItem value="DELETE">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs mb-1">User</label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {userOptions.map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs mb-1">Date Range</label>
              <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1">Search</label>
              <Input type="text" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="space-y-8">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading logs...</div>
            ) : (
              Object.entries(grouped).map(([group, groupLogs]) => {
                const groupIds = groupLogs.map(log => log.id);
                const groupAllSelected = groupIds.length > 0 && groupIds.every(id => selected.includes(id));
                const groupSomeSelected = groupIds.some(id => selected.includes(id));
                const toggleGroupSelectAll = () => {
                  if (groupAllSelected) setSelected(selected.filter(id => !groupIds.includes(id)));
                  else setSelected([...selected, ...groupIds.filter(id => !selected.includes(id))]);
                };
                return (
                  <div key={group}>
                    <div className="flex items-center font-semibold text-lg mb-2 text-muted-foreground">
                      <label className="relative flex items-center mr-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="peer absolute opacity-0 w-4 h-4"
                          checked={groupAllSelected}
                          ref={el => { if (el) el.indeterminate = !groupAllSelected && groupSomeSelected; }}
                          onChange={toggleGroupSelectAll}
                        />
                        <span
                          className={`
                            flex items-center justify-center
                            size-4 rounded-[4px] border border-input bg-background
                            transition-colors
                            peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary
                            shadow-none
                          `}
                        >
                          {/* Indeterminate (minus) icon */}
                          {!groupAllSelected && groupSomeSelected && (
                            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="5" y="11" width="14" height="2" rx="1" />
                            </svg>
                          )}
                          {/* Checkmark icon */}
                          {groupAllSelected && (
                            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                      </label>
                      {group}
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8"></TableHead>
                          <TableHead>Activity</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead className="text-right">When</TableHead>
                          {tab === 'deleted' && (
                            <TableHead>Actions</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupLogs.map((log) => {
                          const { icon, color } = getActionIconAndColor(log.action);
                          return (
                            <TableRow key={log.id}>
                              <TableCell className="w-8">
                                <Checkbox
                                  checked={selected.includes(log.id)}
                                  onCheckedChange={() => toggleSelect(log.id)}
                                />
                              </TableCell>
                              <TableCell className={`flex items-center ${color} text-sm font-medium`}>
                                {icon}
                                <div dangerouslySetInnerHTML={{ __html: formatLogMessage(log) }} />
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs font-mono px-2 py-1 bg-muted/50 border border-muted-foreground/20">
                                  {log.user_email || 'System'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                              </TableCell>
                              {tab === 'deleted' && (
                                <TableCell className="text-right">
                                  <Button variant="outline" size="icon" onClick={() => handleRestore(log.id)}>
                                    <Undo className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => { setPermanentDeleteId(log.id); setIsConfirmOpen(true); }}>
                                    <Trash className="h-4 w-4 text-red-500" />
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                );
              })
            )}
          </div>
          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-8">
            <button
              className="px-4 py-2 rounded bg-muted text-muted-foreground disabled:opacity-50"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              className="px-4 py-2 rounded bg-muted text-muted-foreground disabled:opacity-50"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages || totalPages === 0}
            >
              Next
            </button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
