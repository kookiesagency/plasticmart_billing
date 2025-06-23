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
  const { action, target_table, target_id, user_email, details } = log;
  const targetName = target_table.replace(/_/g, ' ').slice(0, -1);
  const user = user_email || 'System';
  
  let targetLink = `/${target_table}/${target_id}`;
  if (target_table === 'units') {
    targetLink = '/settings';
  } else if (target_table === 'items') {
    targetLink = '/items';
  }

  const getTargetIdentifier = () => {
    const data = details.new_data || details.old_data;
    return data?.name || data?.title || `#${target_id}`;
  };

  switch (action) {
    case 'INSERT':
      return `<strong>${user}</strong> created a new ${targetName}: <Link href="${targetLink}" className="text-blue-500 hover:underline">${getTargetIdentifier()}</Link>`;
    case 'DELETE':
      return `<strong>${user}</strong> deleted ${targetName}: ${getTargetIdentifier()}`;
    case 'UPDATE':
      const changes = getChanges(details.old_data, details.new_data);
      if (changes.length > 0) {
        return `<strong>${user}</strong> updated ${targetName} <Link href="${targetLink}" className="text-blue-500 hover:underline">${getTargetIdentifier()}</Link>: <ul>${changes.map(c => `<li class="ml-4 list-disc">${c}</li>`).join('')}</ul>`;
      }
      return `<strong>${user}</strong> updated ${targetName} <Link href="${targetLink}" className="text-blue-500 hover:underline">${getTargetIdentifier()}</Link> (no displayable changes).`;
    default:
      return `An action (${action}) was performed on ${targetName} by <strong>${user}</strong>.`;
  }
}

async function getLogs() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching logs:', error);
    return [];
  }
  return data as ActivityLog[];
}

export default async function LogsPage() {
  const logs = await getLogs();

  return (
    <>
      <SetHeader title="Activity Logs" />
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>A log of the most recent activities in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead className="text-right">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div dangerouslySetInnerHTML={{ __html: formatLogMessage(log) }} />
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
} 