'use client'

import { createClient } from '@/lib/supabase/client'
import { SetHeader } from '@/components/layout/header-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslations } from 'next-intl'
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
import { CheckCircle, Pencil, Trash, Undo, Trash2, Monitor, Smartphone, Info } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ActivityLog = {
  id: number;
  created_at: string;
  user_email: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  target_table: string;
  target_id: string;
  platform?: 'web' | 'mobile';
  details: {
    old_data?: any;
    new_data?: any;
  };
};

function formatValue(value: any): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function getChanges(oldData: any, newData: any): string[] {
  if (!oldData || !newData) return [];

  const changes = [];
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  for (const key of allKeys) {
    if (['created_at', 'deleted_at'].includes(key)) continue;

    const oldValue = oldData[key];
    const newValue = newData[key];

    if (oldValue !== newValue) {
      const formattedKey = key.replace(/_/g, ' ');
      changes.push(`Changed <strong>${formattedKey}</strong> from "<em>${formatValue(oldValue)}</em>" to "<em>${formatValue(newValue)}</em>"`);
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
    case 'UPDATE': {
      const changes = getChanges(details.old_data, details.new_data);
      if (changes.length > 0 && changes.length <= 2) {
        // Show changes inline if there are only 1-2 changes
        return `Updated ${targetName} <a href="${targetLink}" class="text-blue-500 hover:underline">${getTargetIdentifier()}</a>: <ul>${changes.map(c => `<li class='ml-4 list-disc'>${c}</li>`).join('')}</ul>`;
      }
      // For more than 2 changes or complex data, just show summary
      return `Updated ${targetName} <a href="${targetLink}" class="text-blue-500 hover:underline">${getTargetIdentifier()}</a>`;
    }
    default:
      return `An action (${action}) was performed on ${targetName}.`;
  }
}

const PAGE_SIZE = 50;

export default function LogsPage() {
  const t = useTranslations('logs')
  const tCommon = useTranslations('common')
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
  const [detailsLog, setDetailsLog] = useState<ActivityLog | null>(null);

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
    let group = t('earlier');
    if (isToday(date)) group = t('today');
    else if (isYesterday(date)) group = t('yesterday');
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
      toast.error(t('failedToDeleteLogs', { count: bulkDeleteIds.length }));
    } else {
      toast.success(t('logsDeletedSuccess', { count: bulkDeleteIds.length }));
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
      toast.error(t('failedToRestoreLogs', { count: bulkRestoreIds.length }));
    } else {
      toast.success(t('logsRestoredSuccess', { count: bulkRestoreIds.length }));
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
      toast.error(t('failedToPermanentlyDeleteLog'));
    } else {
      toast.success(t('logPermanentlyDeletedSuccess'));
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
      toast.error(t('failedToPermanentlyDeleteLogs', { count: bulkPermanentDeleteIds.length }));
    } else {
      toast.success(t('logsPermanentlyDeletedSuccess', { count: bulkPermanentDeleteIds.length }));
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
      toast.error(t('failedToRestoreLog'));
    } else {
      toast.success(t('logRestoredSuccess'));
      setLogs((prev) => prev.filter(log => log.id !== id));
    }
    setSelected(selected.filter(sel => sel !== id));
  };

  return (
    <>
      <SetHeader title={t('title')} />
      <Card>
        <CardHeader>
          <CardTitle>{t('recentActivity')}</CardTitle>
          <CardDescription>{t('recentActivityDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tabs and Bulk Action Bar in a flex row */}
          <div className="flex items-center justify-between mb-4">
            <Tabs value={tab} onValueChange={v => { setTab(v as 'active' | 'deleted'); clearSelection(); }}>
            <TabsList>
              <TabsTrigger value="active">{t('active')}</TabsTrigger>
              <TabsTrigger value="deleted">{t('deleted')}</TabsTrigger>
            </TabsList>
          </Tabs>
          {selected.length > 0 && (
              <div className="flex items-center gap-4">
              {tab === 'active' ? (
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('delete')} ({selected.length})
                  </Button>
              ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={handleBulkRestore}>
                      <Undo className="mr-2 h-4 w-4" />
                      {t('restore')} ({selected.length})
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleBulkPermanentDelete}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('deletePermanently')} ({selected.length})
                    </Button>
                  </>
              )}
              <Button variant="ghost" size="sm" onClick={clearSelection}>{t('clear')}</Button>
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
            title={t('areYouSure')}
            description={
              bulkDeleteIds
                ? t('deleteLogsConfirm', { count: bulkDeleteIds.length })
                : bulkRestoreIds
                ? t('restoreLogsConfirm', { count: bulkRestoreIds.length })
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
            title={t('areYouSure')}
            description={t('permanentDeleteLogConfirm')}
          />
          {Array.isArray(bulkPermanentDeleteIds) && bulkPermanentDeleteIds.length > 0 && (
            <ConfirmationDialog
              isOpen={isConfirmOpen}
              onClose={() => {
                setIsConfirmOpen(false);
                setBulkPermanentDeleteIds(null);
              }}
              onConfirm={confirmBulkPermanentDelete}
              title={t('areYouSure')}
              description={t('permanentDeleteLogsConfirm', { count: bulkPermanentDeleteIds.length })}
            />
          )}
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6 items-end">
            <div>
              <label className="block text-xs mb-1">{t('action')}</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={t('allActions')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allActions')}</SelectItem>
                  <SelectItem value="INSERT">{t('created')}</SelectItem>
                  <SelectItem value="UPDATE">{t('updated')}</SelectItem>
                  <SelectItem value="DELETE">{t('deleted')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs mb-1">{t('user')}</label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('allUsers')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allUsers')}</SelectItem>
                  {userOptions.map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs mb-1">{t('dateRange')}</label>
              <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1">{tCommon('search')}</label>
              <Input type="text" placeholder={t('searchLogs')} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="space-y-8">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">{t('loadingLogs')}</div>
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
                          <TableHead>{t('activity')}</TableHead>
                          <TableHead>{t('user')}</TableHead>
                          <TableHead className="text-right">{t('when')}</TableHead>
                          <TableHead className="text-right">{t('actions')}</TableHead>
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
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs font-mono px-2 py-1 bg-muted/50 border border-muted-foreground/20">
                                    {log.user_email || t('system')}
                                  </Badge>
                                  {log.platform && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs px-2 py-1 flex items-center gap-1"
                                      title={`From ${log.platform}`}
                                    >
                                      {log.platform === 'mobile' ? (
                                        <Smartphone className="h-3 w-3" />
                                      ) : (
                                        <Monitor className="h-3 w-3" />
                                      )}
                                      <span className="capitalize">{log.platform}</span>
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                              </TableCell>
                              <TableCell className="text-right">
                                {tab === 'active' ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDetailsLog(log)}
                                    className="h-8"
                                  >
                                    <Info className="h-4 w-4 mr-1" />
                                    {t('details')}
                                  </Button>
                                ) : (
                                  <div className="flex gap-1 justify-end">
                                    <Button variant="outline" size="icon" onClick={() => handleRestore(log.id)}>
                                      <Undo className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => { setPermanentDeleteId(log.id); setIsConfirmOpen(true); }}>
                                      <Trash className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
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
              {t('previous')}
            </button>
            <span className="text-sm text-muted-foreground">
              {t('pageOf', { current: page, total: totalPages })}
            </span>
            <button
              className="px-4 py-2 rounded bg-muted text-muted-foreground disabled:opacity-50"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages || totalPages === 0}
            >
              {t('next')}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!detailsLog} onOpenChange={(open) => !open && setDetailsLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('activityLogDetails')}</DialogTitle>
            <DialogDescription>
              {t('detailedInformation')}
            </DialogDescription>
          </DialogHeader>
          {detailsLog && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">{t('action')}</div>
                  <div className="text-lg font-semibold capitalize">{detailsLog.action.toLowerCase()}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">{t('table')}</div>
                  <div className="text-lg font-semibold capitalize">{detailsLog.target_table.replace(/_/g, ' ')}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm font-medium text-muted-foreground">{t('user')}</div>
                  <div className="text-base font-semibold truncate" title={detailsLog.user_email || t('system')}>
                    {detailsLog.user_email || t('system')}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">{t('platform')}</div>
                  <div className="text-lg font-semibold flex items-center gap-2">
                    {detailsLog.platform === 'mobile' ? (
                      <><Smartphone className="h-4 w-4" /> {t('mobile')}</>
                    ) : (
                      <><Monitor className="h-4 w-4" /> {t('web')}</>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">{t('time')}</div>
                  <div className="text-base font-semibold">{format(new Date(detailsLog.created_at), 'PPpp')}</div>
                </div>
              </div>

              {/* Changes */}
              {detailsLog.action === 'UPDATE' && detailsLog.details.old_data && detailsLog.details.new_data && (() => {
                const changes = Object.keys({ ...detailsLog.details.old_data, ...detailsLog.details.new_data })
                  .filter(key => !['created_at', 'deleted_at', 'id'].includes(key))
                  .filter(key => {
                    const oldValue = detailsLog.details.old_data?.[key];
                    const newValue = detailsLog.details.new_data?.[key];
                    return oldValue !== newValue;
                  });

                if (changes.length === 0) return null;

                return (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">{t('changes')}</h3>
                    <div className="space-y-3">
                      {changes.map((key) => {
                        const oldValue = detailsLog.details.old_data?.[key];
                        const newValue = detailsLog.details.new_data?.[key];
                        return (
                          <div key={key} className="border rounded-lg overflow-hidden">
                            <div className="bg-muted px-4 py-2 font-medium capitalize border-b">
                              {key.replace(/_/g, ' ')}
                            </div>
                            <div className="grid grid-cols-2 divide-x">
                              <div className="p-4">
                                <div className="text-xs font-medium text-muted-foreground uppercase mb-2">{t('before')}</div>
                                <div className="font-mono text-sm bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-100 p-3 rounded border border-red-200 dark:border-red-900">
                                  {formatValue(oldValue)}
                                </div>
                              </div>
                              <div className="p-4">
                                <div className="text-xs font-medium text-muted-foreground uppercase mb-2">{t('after')}</div>
                                <div className="font-mono text-sm bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-100 p-3 rounded border border-green-200 dark:border-green-900">
                                  {formatValue(newValue)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* New Data for INSERT */}
              {detailsLog.action === 'INSERT' && detailsLog.details.new_data && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('createdData')}</h3>
                  <div className="p-4 bg-muted rounded-lg font-mono text-sm">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(detailsLog.details.new_data, null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* Old Data for DELETE */}
              {detailsLog.action === 'DELETE' && detailsLog.details.old_data && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('deletedData')}</h3>
                  <div className="p-4 bg-muted rounded-lg font-mono text-sm">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(detailsLog.details.old_data, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
